"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { assertCan } from "@/lib/permissions";
import { audit } from "@/lib/audit";

const PATH = "/administrador/operativa/sanitaria";

async function requireAdmin() {
  const session = await auth();
  assertCan(session, "containers:manage");
  return session;
}

function parseDate(raw: FormDataEntryValue | null): Date | null {
  const s = String(raw || "").trim();
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

/* ── Registrar tratamiento ────────────────────────────────
   Un tratamiento aplicado en una fecha. Se aplica a todas las plantas o, si se
   indica una planta puntual, solo a esa (la columna "nº planta" de la planilla). */
export async function createTreatment(formData: FormData) {
  const session = await requireAdmin();
  const tenantId = session.user.tenantId;

  const date = parseDate(formData.get("date"));
  if (!date) return { error: "Fecha inválida" };

  const description = String(formData.get("description") || "").trim();
  if (!description) return { error: "Falta el tratamiento" };

  const plantId = String(formData.get("plantId") || "") || null;
  // "todos" cuando no se elige una planta puntual.
  const appliesToAll = !plantId;

  if (plantId) {
    const plant = await prisma.plant.findFirst({
      where: { id: plantId, tenantId },
      select: { id: true },
    });
    if (!plant) return { error: "La planta no existe" };
  }

  const treatment = await prisma.treatment.create({
    data: { tenantId, date, description, appliesToAll, plantId },
    select: { id: true },
  });

  await audit({
    tenantId,
    userId: session.user.id,
    actorEmail: session.user.email,
    action: "sanitaria.crear",
    entity: "Treatment",
    entityId: treatment.id,
  });

  revalidatePath(PATH);
  return { ok: true, id: treatment.id };
}

/* ── Editar tratamiento ───────────────────────────────────
   Edita la fecha, a qué plantas aplica y la descripción del tratamiento. */
export async function updateTreatment(formData: FormData) {
  const session = await requireAdmin();
  const tenantId = session.user.tenantId;

  const id = String(formData.get("id") || "");
  if (!id) return { error: "Falta el tratamiento" };

  const treatment = await prisma.treatment.findFirst({
    where: { id, tenantId },
    select: { id: true },
  });
  if (!treatment) return { error: "El tratamiento no existe" };

  const date = parseDate(formData.get("date"));
  if (!date) return { error: "Fecha inválida" };

  const description = String(formData.get("description") || "").trim();
  if (!description) return { error: "Falta el tratamiento" };

  const plantId = String(formData.get("plantId") || "") || null;
  const appliesToAll = !plantId;

  if (plantId) {
    const plant = await prisma.plant.findFirst({
      where: { id: plantId, tenantId },
      select: { id: true },
    });
    if (!plant) return { error: "La planta no existe" };
  }

  await prisma.treatment.update({
    where: { id },
    data: { date, description, appliesToAll, plantId },
  });

  await audit({
    tenantId,
    userId: session.user.id,
    actorEmail: session.user.email,
    action: "sanitaria.editar",
    entity: "Treatment",
    entityId: id,
  });

  revalidatePath(PATH);
  return { ok: true };
}

/* ── Borrar tratamiento ───────────────────────────────────*/
export async function deleteTreatment(formData: FormData) {
  const session = await requireAdmin();
  const tenantId = session.user.tenantId;

  const id = String(formData.get("id") || "");
  if (!id) return { error: "Falta el tratamiento" };

  const treatment = await prisma.treatment.findFirst({
    where: { id, tenantId },
    select: { id: true },
  });
  if (!treatment) return { error: "El tratamiento no existe" };

  await prisma.treatment.delete({ where: { id } });

  await audit({
    tenantId,
    userId: session.user.id,
    actorEmail: session.user.email,
    action: "sanitaria.borrar",
    entity: "Treatment",
    entityId: id,
  });

  revalidatePath(PATH);
  return { ok: true };
}
