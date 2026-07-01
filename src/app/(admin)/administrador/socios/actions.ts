"use server";

import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { assertCan } from "@/lib/permissions";
import { audit } from "@/lib/audit";
import { createSocioSchema, editSocioSchema } from "@/lib/validators";

const VISITOR_INVITE_TTL_MS = 24 * 60 * 60 * 1000;
const VISITOR_RETENTION_DAYS = 30;

export type CreateSocioState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  ok?: boolean;
} | null;

export async function createSocioAction(
  _prev: CreateSocioState,
  formData: FormData,
): Promise<CreateSocioState> {
  const session = await auth();
  assertCan(session, "socios:manage");

  const parsed = createSocioSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") || "",
    password: formData.get("password"),
    mustChangePassword: formData.get("mustChangePassword") === "on",
    active: formData.get("active") === "on",
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string") fieldErrors[key] = issue.message;
    }
    return { fieldErrors };
  }

  const tenantId = session.user.tenantId;

  const existente = await prisma.user.findUnique({
    where: { tenantId_email: { tenantId, email: parsed.data.email } },
  });
  if (existente) {
    return { error: "Ya existe un usuario con ese email" };
  }

  if (parsed.data.active) {
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
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  const created = await prisma.user.create({
    data: {
      tenantId,
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
      passwordHash,
      role: "MEMBER",
      active: parsed.data.active,
      mustChangePassword: parsed.data.mustChangePassword,
    },
  });

  await audit({
    userId: session.user.id,
    actorEmail: session.user.email,
    action: "socio.create",
    entity: "User",
    entityId: created.id,
    metadata: {
      email: created.email,
      mustChangePassword: parsed.data.mustChangePassword,
    },
  });

  revalidatePath("/administrador/socios");
  return { ok: true };
}

export type EditSocioState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  ok?: boolean;
} | null;

export async function editSocioAction(
  _prev: EditSocioState,
  formData: FormData,
): Promise<EditSocioState> {
  const session = await auth();
  assertCan(session, "socios:manage");

  const id = formData.get("id");
  if (typeof id !== "string") return { error: "ID inválido" };

  const parsed = editSocioSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") || "",
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string") fieldErrors[key] = issue.message;
    }
    return { fieldErrors };
  }

  const tenantId = session.user.tenantId;

  const before = await prisma.user.findFirst({ where: { id, tenantId } });
  if (!before) return { error: "Socio no encontrado" };

  if (parsed.data.email !== before.email) {
    const dup = await prisma.user.findUnique({
      where: { tenantId_email: { tenantId, email: parsed.data.email } },
    });
    if (dup && dup.id !== id) {
      return { fieldErrors: { email: "Ya existe un usuario con ese email" } };
    }
  }

  await prisma.user.update({
    where: { id: before.id },
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
    },
  });

  const changes: Record<string, { from: unknown; to: unknown }> = {};
  if (before.name !== parsed.data.name)
    changes.name = { from: before.name, to: parsed.data.name };
  if (before.email !== parsed.data.email)
    changes.email = { from: before.email, to: parsed.data.email };
  if ((before.phone ?? "") !== (parsed.data.phone || "")) {
    changes.phone = { from: before.phone, to: parsed.data.phone || null };
  }

  if (Object.keys(changes).length > 0) {
    await audit({
      userId: session.user.id,
      actorEmail: session.user.email,
      action: "socio.update",
      entity: "User",
      entityId: id,
      metadata: { changes },
    });
  }

  revalidatePath("/administrador/socios");
  revalidatePath(`/administrador/socios/${id}`);
  return { ok: true };
}

export type CreateVisitorInviteState = {
  ok?: boolean;
  url?: string;
  expiresAt?: string;
  error?: string;
} | null;

export async function createVisitorInviteAction(
  _prev: CreateVisitorInviteState,
  _formData: FormData,
): Promise<CreateVisitorInviteState> {
  const session = await auth();
  assertCan(session, "socios:manage");

  const tenantId = session.user.tenantId;

  const cutoff = new Date(
    Date.now() - VISITOR_RETENTION_DAYS * 24 * 60 * 60 * 1000,
  );
  await prisma.user.deleteMany({
    where: { tenantId, role: "VISITANTE", createdAt: { lt: cutoff } },
  });

  const token = crypto.randomBytes(24).toString("base64url");
  const expiresAt = new Date(Date.now() + VISITOR_INVITE_TTL_MS);

  await prisma.visitorInvite.create({
    data: {
      tenantId,
      token,
      expiresAt,
      createdBy: session.user.id,
    },
  });

  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("host") ?? "localhost:9000";
  const url = `${proto}://${host}/visita/${token}`;

  await audit({
    userId: session.user.id,
    actorEmail: session.user.email,
    action: "visitor.invite.create",
    metadata: { expiresAt: expiresAt.toISOString() },
  });

  return { ok: true, url, expiresAt: expiresAt.toISOString() };
}

export async function toggleSocioActivoAction(formData: FormData) {
  const session = await auth();
  assertCan(session, "socios:manage");

  const id = formData.get("id");
  if (typeof id !== "string") return;
  if (id === session.user.id) return;

  const user = await prisma.user.findFirst({
    where: { id, tenantId: session.user.tenantId },
  });
  if (!user) return;

  const nextActive = !user.active;
  const now = new Date();
  await prisma.user.update({
    where: { id: user.id },
    // Se lleva el historial completo de movimientos: cada baja agrega una fecha
    // a deactivatedAt; cada reingreso, una a reactivatedAt. Nunca se pisan, para
    // poder reconstruir altas y bajas de cualquier período (lo usa el acta).
    data: nextActive
      ? { active: true, reactivatedAt: { push: now } }
      : { active: false, deactivatedAt: { push: now } },
  });

  await audit({
    userId: session.user.id,
    actorEmail: session.user.email,
    action: nextActive ? "socio.activate" : "socio.deactivate",
    entity: "User",
    entityId: id,
    metadata: { email: user.email },
  });

  revalidatePath("/administrador/socios");
}

// Asigna (o quita) el plan de membresía propio del socio. Vacío = vuelve a
// usar el plan por defecto del club.
export async function setSocioPlanAction(formData: FormData) {
  const session = await auth();
  assertCan(session, "socios:manage");
  const tenantId = session.user.tenantId;

  const id = String(formData.get("id") ?? "");
  const planIdRaw = String(formData.get("planId") ?? "");
  const planId = planIdRaw || null;

  const user = await prisma.user.findFirst({ where: { id, tenantId }, select: { id: true, email: true } });
  if (!user) return { error: "Socio no encontrado" };

  if (planId) {
    const plan = await prisma.membershipPlan.findFirst({
      where: { id: planId, tenantId, active: true },
      select: { id: true },
    });
    if (!plan) return { error: "Plan no disponible" };
  }

  await prisma.user.update({ where: { id }, data: { membershipPlanId: planId } });

  await audit({
    userId: session.user.id,
    actorEmail: session.user.email,
    action: "socio.plan.set",
    entity: "User",
    entityId: id,
    metadata: { email: user.email, planId },
  });

  revalidatePath(`/administrador/socios/${id}`);
  return { ok: true as const };
}
