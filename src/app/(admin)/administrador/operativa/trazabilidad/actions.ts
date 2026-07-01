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

function parseDate(raw: FormDataEntryValue | null): Date | null {
  const s = String(raw || "").trim();
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

/* ── Crear planta ─────────────────────────────────────────
   Abre la ficha de una planta con su número. El resto de las etapas se cargan
   después, a medida que avanza el ciclo. */
export async function createPlant(formData: FormData) {
  const session = await requireAdmin();
  const tenantId = session.user.tenantId;

  const number = parseInt(String(formData.get("number") || ""), 10);
  if (isNaN(number) || number <= 0) return { error: "Número de planta inválido" };

  const harvestId = String(formData.get("harvestId") || "") || null;
  const strainId = String(formData.get("strainId") || "") || null;

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
   Edita rendimiento, observaciones, genética y cosecha de la ficha. */
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

  await prisma.plant.update({
    where: { id },
    data: {
      yield: yieldVal,
      notes: String(formData.get("notes") || "") || null,
      strainId: String(formData.get("strainId") || "") || null,
      harvestId: String(formData.get("harvestId") || "") || null,
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
