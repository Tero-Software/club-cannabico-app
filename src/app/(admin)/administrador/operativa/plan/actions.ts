"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { assertCan } from "@/lib/permissions";
import { audit } from "@/lib/audit";
import { buildHarvestRule } from "@/lib/plan-cultivo";

const PATH = "/administrador/operativa/plan";

async function requireAdmin() {
  const session = await auth();
  assertCan(session, "containers:manage");
  return session;
}

// Lee mes + semanas de un hito ("germination" → germinationMonth/-Weeks).
function parseHito(formData: FormData, key: string) {
  const month = parseInt(String(formData.get(`${key}Month`) || ""), 10);
  if (isNaN(month) || month < 1 || month > 12) {
    return { month: null, weeks: [] as number[] };
  }
  const weeks = [
    ...new Set(
      formData
        .getAll(`${key}Weeks`)
        .map((w) => parseInt(String(w), 10))
        .filter((w) => !isNaN(w) && w >= 1 && w <= 4),
    ),
  ].sort();
  return { month, weeks };
}

// Lee y valida los campos de una siembra del plan.
function parseEntry(formData: FormData):
  | { error: string }
  | {
      number: number;
      germinationMonth: number | null;
      germinationWeeks: number[];
      pottingMonth: number | null;
      pottingWeeks: number[];
      bedMonth: number | null;
      bedWeeks: number[];
      harvestRule: string;
      notes: string | null;
    } {
  const number = parseInt(String(formData.get("number") || ""), 10);
  if (isNaN(number) || number <= 0) return { error: "Número de siembra inválido" };

  const months = formData
    .getAll("months")
    .map((m) => parseInt(String(m), 10))
    .filter((m) => !isNaN(m) && m >= 1 && m <= 12);
  if (months.length === 0) {
    return { error: "Elegí al menos un mes de cosecha estimada" };
  }

  const germination = parseHito(formData, "germination");
  const potting = parseHito(formData, "potting");
  const bed = parseHito(formData, "bed");

  return {
    number,
    germinationMonth: germination.month,
    germinationWeeks: germination.weeks,
    pottingMonth: potting.month,
    pottingWeeks: potting.weeks,
    bedMonth: bed.month,
    bedWeeks: bed.weeks,
    harvestRule: buildHarvestRule(months),
    notes: String(formData.get("notes") || "") || null,
  };
}

function isUniqueError(e: unknown): boolean {
  return (
    e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002"
  );
}

/* ── Crear siembra del plan ───────────────────────────────
   Una siembra numerada del plan de cultivo, con sus hitos aproximados tal como
   figuran en el documento y la ventana de cosecha por meses. */
export async function createPlanEntry(formData: FormData) {
  const session = await requireAdmin();
  const tenantId = session.user.tenantId;

  const parsed = parseEntry(formData);
  if ("error" in parsed) return parsed;

  let id: string;
  try {
    const entry = await prisma.plannedHarvest.create({
      data: { tenantId, ...parsed },
      select: { id: true },
    });
    id = entry.id;
  } catch (e) {
    if (isUniqueError(e)) {
      return { error: `Ya existe la siembra N.º ${parsed.number}` };
    }
    throw e;
  }

  await audit({
    tenantId,
    userId: session.user.id,
    actorEmail: session.user.email,
    action: "plan.crear",
    entity: "PlannedHarvest",
    entityId: id,
    metadata: { number: parsed.number },
  });

  revalidatePath(PATH);
  return { ok: true, id };
}

/* ── Editar siembra del plan ──────────────────────────────*/
export async function updatePlanEntry(formData: FormData) {
  const session = await requireAdmin();
  const tenantId = session.user.tenantId;

  const id = String(formData.get("id") || "");
  if (!id) return { error: "Falta la siembra del plan" };

  const entry = await prisma.plannedHarvest.findFirst({
    where: { id, tenantId },
    select: { id: true },
  });
  if (!entry) return { error: "La siembra no existe" };

  const parsed = parseEntry(formData);
  if ("error" in parsed) return parsed;

  try {
    await prisma.plannedHarvest.update({ where: { id }, data: parsed });
  } catch (e) {
    if (isUniqueError(e)) {
      return { error: `Ya existe la siembra N.º ${parsed.number}` };
    }
    throw e;
  }

  await audit({
    tenantId,
    userId: session.user.id,
    actorEmail: session.user.email,
    action: "plan.editar",
    entity: "PlannedHarvest",
    entityId: id,
  });

  revalidatePath(PATH);
  return { ok: true };
}

/* ── Borrar siembra del plan ──────────────────────────────
   Solo si no tiene cosechas reales enganchadas: si las tuviera, quedarían sin
   número ante el IRCCA. */
export async function deletePlanEntry(formData: FormData) {
  const session = await requireAdmin();
  const tenantId = session.user.tenantId;

  const id = String(formData.get("id") || "");
  if (!id) return { error: "Falta la siembra del plan" };

  const entry = await prisma.plannedHarvest.findFirst({
    where: { id, tenantId },
    select: { id: true, _count: { select: { harvests: true } } },
  });
  if (!entry) return { error: "La siembra no existe" };
  if (entry._count.harvests > 0) {
    return {
      error: "Tiene cosechas asociadas en trazabilidad; desvinculalas antes de borrar",
    };
  }

  await prisma.plannedHarvest.delete({ where: { id } });

  await audit({
    tenantId,
    userId: session.user.id,
    actorEmail: session.user.email,
    action: "plan.borrar",
    entity: "PlannedHarvest",
    entityId: id,
  });

  revalidatePath(PATH);
  return { ok: true };
}
