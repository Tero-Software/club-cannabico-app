"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { assertCan } from "@/lib/permissions";
import { audit } from "@/lib/audit";

const PATH = "/administrador/operativa/cosechas";

async function requireAdmin() {
  const session = await auth();
  assertCan(session, "containers:manage");
  return session;
}

/* ── Crear cosecha ────────────────────────────────────────
   Abre una cosecha en staging (no declarada). Se identifica por fecha. */
export async function createHarvest(formData: FormData) {
  const session = await requireAdmin();
  const tenantId = session.user.tenantId;

  const dateRaw = String(formData.get("date") || "").trim();
  const date = dateRaw ? new Date(dateRaw) : new Date();
  if (isNaN(date.getTime())) return { error: "Fecha inválida" };

  const harvest = await prisma.harvest.create({
    data: {
      tenantId,
      date,
      notes: String(formData.get("notes") || "") || null,
    },
    select: { id: true },
  });

  await audit({
    tenantId,
    userId: session.user.id,
    actorEmail: session.user.email,
    action: "cosecha.crear",
    entity: "Harvest",
    entityId: harvest.id,
  });

  revalidatePath(PATH);
  return { ok: true, id: harvest.id };
}

/* ── Declarar cosecha ─────────────────────────────────────
   Declaración al IRCCA: marca la cosecha como declarada. Sus contenedores pasan
   a ser visibles en acopio. Irreversible desde acá. */
export async function declareHarvest(formData: FormData) {
  const session = await requireAdmin();
  const tenantId = session.user.tenantId;

  const id = String(formData.get("id") || "");
  if (!id) return { error: "Falta la cosecha" };

  const harvest = await prisma.harvest.findFirst({
    where: { id, tenantId, declarada: false },
    select: { id: true, _count: { select: { containers: true } } },
  });
  if (!harvest) return { error: "La cosecha no está disponible" };
  if (harvest._count.containers === 0) {
    return { error: "La cosecha no tiene contenedores" };
  }

  await prisma.harvest.update({
    where: { id },
    data: { declarada: true },
  });

  await audit({
    tenantId,
    userId: session.user.id,
    actorEmail: session.user.email,
    action: "cosecha.declarar",
    entity: "Harvest",
    entityId: id,
  });

  revalidatePath(PATH);
  revalidatePath("/administrador/acopio");
  return { ok: true };
}

/* ── Borrar cosecha ───────────────────────────────────────
   Solo si no está declarada. Sus contenedores quedan sueltos (SetNull). */
export async function deleteHarvest(formData: FormData) {
  const session = await requireAdmin();
  const tenantId = session.user.tenantId;

  const id = String(formData.get("id") || "");
  if (!id) return { error: "Falta la cosecha" };

  const harvest = await prisma.harvest.findFirst({
    where: { id, tenantId, declarada: false },
    select: { id: true },
  });
  if (!harvest) return { error: "No se puede borrar una cosecha declarada" };

  // Los contenedores en staging se borran con la cosecha; si quedaran sueltos
  // (SetNull) aparecerían en acopio sin haber sido declarados.
  await prisma.$transaction([
    prisma.container.deleteMany({ where: { tenantId, harvestId: id } }),
    prisma.harvest.delete({ where: { id } }),
  ]);

  await audit({
    tenantId,
    userId: session.user.id,
    actorEmail: session.user.email,
    action: "cosecha.borrar",
    entity: "Harvest",
    entityId: id,
  });

  revalidatePath(PATH);
  return { ok: true };
}
