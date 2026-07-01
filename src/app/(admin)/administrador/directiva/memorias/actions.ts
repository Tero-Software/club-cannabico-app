"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";

const PATH = "/administrador/directiva/memorias";

async function requireAdmin() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("No autorizado");
  }
  return session;
}

// El ejercicio del club va del 01/04 de un año al 31/03 del siguiente. El año
// del ejercicio es el del inicio del período.
function periodForYear(year: number): { start: Date; end: Date } {
  return {
    start: new Date(Date.UTC(year, 3, 1)), // 1 de abril
    end: new Date(Date.UTC(year + 1, 2, 31)), // 31 de marzo del año siguiente
  };
}

/* ── Crear memoria ────────────────────────────────────────
   Abre la memoria de un ejercicio en borrador. El período se deriva del año.
   Un ejercicio por año: si ya existe, se rechaza. */
export async function createMemoria(formData: FormData) {
  const session = await requireAdmin();
  const tenantId = session.user.tenantId;

  const year = parseInt(String(formData.get("year") || ""), 10);
  if (isNaN(year) || year < 2000 || year > 2100) {
    return { error: "Año de ejercicio inválido" };
  }

  const existing = await prisma.memoria.findFirst({
    where: { tenantId, year },
    select: { id: true },
  });
  if (existing) return { error: `Ya existe la memoria del ejercicio ${year}` };

  const { start, end } = periodForYear(year);

  const memoria = await prisma.memoria.create({
    data: { tenantId, year, periodStart: start, periodEnd: end },
    select: { id: true },
  });

  await audit({
    tenantId,
    userId: session.user.id,
    actorEmail: session.user.email,
    action: "memoria.crear",
    entity: "Memoria",
    entityId: memoria.id,
    metadata: { year },
  });

  revalidatePath(PATH);
  return { ok: true, id: memoria.id };
}

async function findEditable(id: string, tenantId: string) {
  return prisma.memoria.findFirst({
    where: { id, tenantId, status: "DRAFT" },
    select: { id: true },
  });
}

/* ── Editar resumen ───────────────────────────────────────*/
export async function updateMemoriaSummary(formData: FormData) {
  const session = await requireAdmin();
  const tenantId = session.user.tenantId;

  const id = String(formData.get("id") || "");
  if (!id) return { error: "Falta la memoria" };
  const memoria = await findEditable(id, tenantId);
  if (!memoria) return { error: "La memoria no está disponible para editar" };

  await prisma.memoria.update({
    where: { id },
    data: { summary: String(formData.get("summary") || "") },
  });

  await audit({
    tenantId,
    userId: session.user.id,
    actorEmail: session.user.email,
    action: "memoria.resumen",
    entity: "Memoria",
    entityId: id,
  });

  revalidatePath(PATH);
  return { ok: true };
}

/* ── Agregar hito ─────────────────────────────────────────
   Un hito (tema + desarrollo) en un mes de la memoria. El mes (MemoriaEntry) se
   crea si no existe; el hito cuelga de él. */
export async function addMemoriaMilestone(formData: FormData) {
  const session = await requireAdmin();
  const tenantId = session.user.tenantId;

  const memoriaId = String(formData.get("memoriaId") || "");
  const month = parseInt(String(formData.get("month") || ""), 10);
  const title = String(formData.get("title") || "").trim();
  const body = String(formData.get("body") || "").trim();
  if (!memoriaId) return { error: "Falta la memoria" };
  if (isNaN(month) || month < 1 || month > 12) return { error: "Mes inválido" };
  if (!title) return { error: "Falta el tema del hito" };

  const memoria = await findEditable(memoriaId, tenantId);
  if (!memoria) return { error: "La memoria no está disponible para editar" };

  const entry = await prisma.memoriaEntry.upsert({
    where: { memoriaId_month: { memoriaId, month } },
    create: { tenantId, memoriaId, month },
    update: {},
    select: { id: true },
  });

  await prisma.memoriaMilestone.create({
    data: { tenantId, entryId: entry.id, title, body },
  });

  await audit({
    tenantId,
    userId: session.user.id,
    actorEmail: session.user.email,
    action: "memoria.hito.agregar",
    entity: "Memoria",
    entityId: memoriaId,
    metadata: { month },
  });

  revalidatePath(PATH);
  return { ok: true };
}

/* ── Editar hito ──────────────────────────────────────────*/
export async function updateMemoriaMilestone(formData: FormData) {
  const session = await requireAdmin();
  const tenantId = session.user.tenantId;

  const id = String(formData.get("id") || "");
  const title = String(formData.get("title") || "").trim();
  const body = String(formData.get("body") || "").trim();
  if (!id) return { error: "Falta el hito" };
  if (!title) return { error: "Falta el tema del hito" };

  const hito = await prisma.memoriaMilestone.findFirst({
    where: { id, tenantId, entry: { memoria: { status: "DRAFT" } } },
    select: { id: true },
  });
  if (!hito) return { error: "El hito no está disponible" };

  await prisma.memoriaMilestone.update({
    where: { id },
    data: { title, body },
  });

  revalidatePath(PATH);
  return { ok: true };
}

/* ── Borrar hito ──────────────────────────────────────────
   Borra el hito; si el mes queda sin hitos, se borra el mes también. */
export async function deleteMemoriaMilestone(formData: FormData) {
  const session = await requireAdmin();
  const tenantId = session.user.tenantId;

  const id = String(formData.get("id") || "");
  if (!id) return { error: "Falta el hito" };

  const hito = await prisma.memoriaMilestone.findFirst({
    where: { id, tenantId, entry: { memoria: { status: "DRAFT" } } },
    select: { id: true, entryId: true },
  });
  if (!hito) return { error: "El hito no está disponible" };

  await prisma.memoriaMilestone.delete({ where: { id } });

  const left = await prisma.memoriaMilestone.count({
    where: { entryId: hito.entryId },
  });
  if (left === 0) {
    await prisma.memoriaEntry.delete({ where: { id: hito.entryId } });
  }

  revalidatePath(PATH);
  return { ok: true };
}

/* ── Cerrar memoria ───────────────────────────────────────
   Marca la memoria como cerrada (CLOSED). Deja de ser editable. */
export async function closeMemoria(formData: FormData) {
  const session = await requireAdmin();
  const tenantId = session.user.tenantId;

  const id = String(formData.get("id") || "");
  if (!id) return { error: "Falta la memoria" };
  const memoria = await findEditable(id, tenantId);
  if (!memoria) return { error: "La memoria ya está cerrada" };

  await prisma.memoria.update({ where: { id }, data: { status: "CLOSED" } });

  await audit({
    tenantId,
    userId: session.user.id,
    actorEmail: session.user.email,
    action: "memoria.cerrar",
    entity: "Memoria",
    entityId: id,
  });

  revalidatePath(PATH);
  return { ok: true };
}

/* ── Reabrir memoria ──────────────────────────────────────*/
export async function reopenMemoria(formData: FormData) {
  const session = await requireAdmin();
  const tenantId = session.user.tenantId;

  const id = String(formData.get("id") || "");
  if (!id) return { error: "Falta la memoria" };
  const memoria = await prisma.memoria.findFirst({
    where: { id, tenantId, status: "CLOSED" },
    select: { id: true },
  });
  if (!memoria) return { error: "La memoria no está cerrada" };

  await prisma.memoria.update({ where: { id }, data: { status: "DRAFT" } });

  await audit({
    tenantId,
    userId: session.user.id,
    actorEmail: session.user.email,
    action: "memoria.reabrir",
    entity: "Memoria",
    entityId: id,
  });

  revalidatePath(PATH);
  return { ok: true };
}

/* ── Borrar memoria ───────────────────────────────────────*/
export async function deleteMemoria(formData: FormData) {
  const session = await requireAdmin();
  const tenantId = session.user.tenantId;

  const id = String(formData.get("id") || "");
  if (!id) return { error: "Falta la memoria" };
  const memoria = await prisma.memoria.findFirst({
    where: { id, tenantId },
    select: { id: true, year: true },
  });
  if (!memoria) return { error: "La memoria no existe" };

  await prisma.memoria.delete({ where: { id } });

  await audit({
    tenantId,
    userId: session.user.id,
    actorEmail: session.user.email,
    action: "memoria.borrar",
    entity: "Memoria",
    entityId: id,
    metadata: { year: memoria.year },
  });

  revalidatePath(PATH);
  return { ok: true };
}
