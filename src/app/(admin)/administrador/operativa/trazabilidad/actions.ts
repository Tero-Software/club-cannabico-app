"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { assertCan } from "@/lib/permissions";
import { audit } from "@/lib/audit";

const PATH = "/administrador/operativa/trazabilidad";

async function requireAdmin() {
  const session = await auth();
  assertCan(session, "containers:manage");
  return session;
}

// Las etapas del ciclo, en el mismo orden y con el mismo nombre que la planilla
// del IRCCA. Cada una guarda una fecha en la planta.
const STAGES = [
  "germinatedAt",
  "pottedAt",
  "bedAt",
  "floweredAt",
  "harvestedAt",
] as const;
type Stage = (typeof STAGES)[number];

// Valida que una genética y una cosecha (ambas opcionales) pertenezcan al club.
// Nada se comparte entre clubes: una planta solo puede referenciar genéticas y
// cosechas del propio tenant. Null si no hay refs o son válidas; un error si
// algún id es de otro club.
async function validateRefs(
  tenantId: string,
  strainId: string | null,
  harvestId: string | null,
): Promise<{ error: string } | null> {
  if (strainId) {
    const strain = await prisma.strain.findFirst({
      where: { id: strainId, tenantId },
      select: { id: true },
    });
    if (!strain) return { error: "La genética no pertenece al club" };
  }
  if (harvestId) {
    const harvest = await prisma.harvest.findFirst({
      where: { id: harvestId, tenantId },
      select: { id: true },
    });
    if (!harvest) return { error: "La cosecha no pertenece al club" };
  }
  return null;
}

function parseDate(raw: FormDataEntryValue | null): Date | null {
  const s = String(raw || "").trim();
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

/* ── Crear cosecha ────────────────────────────────────────
   La cosecha nace en trazabilidad, con su fecha de inicio (la siembra). Agrupa
   las plantas de su ciclo. Después, desde la sección de cosechas, se declara al
   IRCCA y se le agregan los contenedores de producto. */
export async function createHarvest(formData: FormData) {
  const session = await requireAdmin();
  const tenantId = session.user.tenantId;

  const date = parseDate(formData.get("date"));
  if (!date) return { error: "Fecha de inicio inválida" };

  // Entrada del plan de cultivo (opcional): da el número con el que se declara.
  const planId = String(formData.get("planId") || "") || null;
  if (planId) {
    const plan = await prisma.plannedHarvest.findFirst({
      where: { id: planId, tenantId },
      select: { id: true },
    });
    if (!plan) return { error: "La entrada del plan no pertenece al club" };
  }

  const harvest = await prisma.harvest.create({
    data: {
      tenantId,
      date,
      planId,
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

/* ── Crear planta ─────────────────────────────────────────
   Abre la ficha de una planta dentro de una cosecha, con su número. El resto de
   las etapas se cargan después, a medida que avanza el ciclo. */
export async function createPlant(formData: FormData) {
  const session = await requireAdmin();
  const tenantId = session.user.tenantId;

  const number = parseInt(String(formData.get("number") || ""), 10);
  if (isNaN(number) || number <= 0) return { error: "Número de planta inválido" };

  const harvestId = String(formData.get("harvestId") || "");
  if (!harvestId) return { error: "Falta la cosecha" };

  const strainId = String(formData.get("strainId") || "") || null;

  const invalid = await validateRefs(tenantId, strainId, harvestId);
  if (invalid) return invalid;

  const plant = await prisma.plant.create({
    data: {
      tenantId,
      number,
      harvestId,
      strainId,
      germinatedAt: parseDate(formData.get("germinatedAt")),
      notes: String(formData.get("notes") || "") || null,
    },
    select: { id: true },
  });

  await audit({
    tenantId,
    userId: session.user.id,
    actorEmail: session.user.email,
    action: "trazabilidad.crear",
    entity: "Plant",
    entityId: plant.id,
  });

  revalidatePath(PATH);
  return { ok: true, id: plant.id };
}

/* ── Actualizar etapa ─────────────────────────────────────
   Setea (o limpia) la fecha de una etapa del ciclo. */
export async function setPlantStage(formData: FormData) {
  const session = await requireAdmin();
  const tenantId = session.user.tenantId;

  const id = String(formData.get("id") || "");
  const stage = String(formData.get("stage") || "") as Stage;
  if (!id) return { error: "Falta la planta" };
  if (!STAGES.includes(stage)) return { error: "Etapa inválida" };

  const plant = await prisma.plant.findFirst({
    where: { id, tenantId },
    select: { id: true },
  });
  if (!plant) return { error: "La planta no existe" };

  await prisma.plant.update({
    where: { id },
    data: { [stage]: parseDate(formData.get("date")) },
  });

  await audit({
    tenantId,
    userId: session.user.id,
    actorEmail: session.user.email,
    action: "trazabilidad.etapa",
    entity: "Plant",
    entityId: id,
    metadata: { stage },
  });

  revalidatePath(PATH);
  return { ok: true };
}

/* ── Actualizar planta ────────────────────────────────────
   Edita la ficha completa: genética, las fechas de cada etapa del ciclo,
   rendimiento y observaciones. */
export async function updatePlant(formData: FormData) {
  const session = await requireAdmin();
  const tenantId = session.user.tenantId;

  const id = String(formData.get("id") || "");
  if (!id) return { error: "Falta la planta" };

  const plant = await prisma.plant.findFirst({
    where: { id, tenantId },
    select: { id: true },
  });
  if (!plant) return { error: "La planta no existe" };

  const yieldRaw = String(formData.get("yield") || "").trim();
  const yieldVal = yieldRaw ? Number(yieldRaw) : null;
  if (yieldRaw && (yieldVal === null || isNaN(yieldVal) || yieldVal < 0)) {
    return { error: "Rendimiento inválido" };
  }

  const strainId = String(formData.get("strainId") || "") || null;
  const invalid = await validateRefs(tenantId, strainId, null);
  if (invalid) return invalid;

  // Las fechas de cada etapa del ciclo se editan junto con el resto de la ficha.
  const stageDates = Object.fromEntries(
    STAGES.map((s) => [s, parseDate(formData.get(s))]),
  );

  await prisma.plant.update({
    where: { id },
    data: {
      yield: yieldVal,
      notes: String(formData.get("notes") || "") || null,
      strainId,
      notProspered: formData.get("notProspered") === "on",
      ...stageDates,
    },
  });

  await audit({
    tenantId,
    userId: session.user.id,
    actorEmail: session.user.email,
    action: "trazabilidad.editar",
    entity: "Plant",
    entityId: id,
  });

  revalidatePath(PATH);
  return { ok: true };
}

/* ── Borrar cosecha ───────────────────────────────────────
   Solo si no está declarada. Borra la cosecha con sus plantas y sus contenedores
   en staging (los contenedores sueltos aparecerían en acopio sin declararse). */
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

  await prisma.$transaction([
    prisma.plant.deleteMany({ where: { tenantId, harvestId: id } }),
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

/* ── Borrar planta ────────────────────────────────────────*/
export async function deletePlant(formData: FormData) {
  const session = await requireAdmin();
  const tenantId = session.user.tenantId;

  const id = String(formData.get("id") || "");
  if (!id) return { error: "Falta la planta" };

  const plant = await prisma.plant.findFirst({
    where: { id, tenantId },
    select: { id: true },
  });
  if (!plant) return { error: "La planta no existe" };

  await prisma.plant.delete({ where: { id } });

  await audit({
    tenantId,
    userId: session.user.id,
    actorEmail: session.user.email,
    action: "trazabilidad.borrar",
    entity: "Plant",
    entityId: id,
  });

  revalidatePath(PATH);
  return { ok: true };
}
