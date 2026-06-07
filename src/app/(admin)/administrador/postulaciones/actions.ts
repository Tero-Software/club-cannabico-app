"use server";

import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { assertCan } from "@/lib/permissions";
import { audit } from "@/lib/audit";

async function requireAdmin() {
  const session = await auth();
  assertCan(session, "postulaciones:manage");
  return session;
}

export type AprobarResult = {
  ok?: boolean;
  passwordTemporal?: string;
  error?: string;
};

export async function aprobarPostulacionAction(
  formData: FormData,
): Promise<AprobarResult> {
  const session = await requireAdmin();
  const id = formData.get("id");
  if (typeof id !== "string") return { error: "ID inválido" };

  const tenantId = session.user.tenantId;

  const postulacion = await prisma.application.findFirst({
    where: { id, tenantId },
  });
  if (!postulacion) return { error: "Postulación no encontrada" };
  if (postulacion.status !== "PENDING") {
    return { error: "La postulación ya fue resuelta" };
  }

  const existente = await prisma.user.findUnique({
    where: { tenantId_email: { tenantId, email: postulacion.email } },
  });
  if (existente) {
    return { error: "Ya existe un socio con ese email" };
  }

  const tenant = await prisma.tenant.findUniqueOrThrow({
    where: { id: tenantId },
    select: { maxActiveMembers: true },
  });
  const socioCount = await prisma.user.count({
    where: { tenantId, role: "MEMBER", active: true },
  });
  if (socioCount >= tenant.maxActiveMembers) {
    return {
      error: `El club alcanzó el máximo de ${tenant.maxActiveMembers} socios activos`,
    };
  }

  const passwordTemporal = crypto.randomBytes(9).toString("base64url");
  const passwordHash = await bcrypt.hash(passwordTemporal, 12);

  const [createdUser] = await prisma.$transaction([
    prisma.user.create({
      data: {
        tenantId,
        name: postulacion.name,
        email: postulacion.email,
        phone: postulacion.phone,
        passwordHash,
        role: "MEMBER",
        mustChangePassword: true,
      },
    }),
    prisma.application.update({
      where: { id: postulacion.id },
      data: { status: "APPROVED" },
    }),
  ]);

  await audit({
    userId: session.user.id,
    actorEmail: session.user.email,
    action: "postulacion.approve",
    entity: "Postulacion",
    entityId: id,
    metadata: { socioId: createdUser.id, email: postulacion.email },
  });

  revalidatePath("/administrador/postulaciones");
  revalidatePath("/administrador/socios");
  return { ok: true, passwordTemporal };
}

export async function rechazarPostulacionAction(formData: FormData) {
  const session = await requireAdmin();
  const id = formData.get("id");
  if (typeof id !== "string") return;

  const res = await prisma.application.updateMany({
    where: { id, tenantId: session.user.tenantId },
    data: { status: "REJECTED" },
  });
  if (res.count === 0) return;
  await audit({
    userId: session.user.id,
    actorEmail: session.user.email,
    action: "postulacion.reject",
    entity: "Postulacion",
    entityId: id,
  });
  revalidatePath("/administrador/postulaciones");
}

export async function eliminarPostulacionAction(formData: FormData) {
  const session = await requireAdmin();
  const id = formData.get("id");
  if (typeof id !== "string") return;

  const res = await prisma.application.deleteMany({
    where: { id, tenantId: session.user.tenantId },
  });
  if (res.count === 0) return;
  await audit({
    userId: session.user.id,
    actorEmail: session.user.email,
    action: "postulacion.delete",
    entity: "Postulacion",
    entityId: id,
  });
  revalidatePath("/administrador/postulaciones");
}
