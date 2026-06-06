"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { assertCan } from "@/lib/permissions";
import { audit } from "@/lib/audit";

async function requireAdmin() {
  const session = await auth();
  assertCan(session, "containers:manage");
  return session;
}

/* ── Create container ─────────────────────────────────── */

type NewItemInput = {
  strainId: string | null;
  plantNumber: string | null;
  weight: number;
};

export async function createContainerAction(formData: FormData) {
  const session = await requireAdmin();

  const number = parseInt(String(formData.get("number")), 10);
  if (isNaN(number)) return { error: "Número inválido" };

  const exists = await prisma.container.findUnique({ where: { number } });
  if (exists) return { error: `El contenedor #${number} ya existe` };

  let items: NewItemInput[] = [];
  const itemsRaw = formData.get("items");
  if (typeof itemsRaw === "string" && itemsRaw.trim()) {
    try {
      const parsed = JSON.parse(itemsRaw);
      if (Array.isArray(parsed)) {
        items = parsed
          .map((it) => ({
            strainId: it?.strainId ? String(it.strainId) : null,
            plantNumber: it?.plantNumber ? String(it.plantNumber) : null,
            weight: Number(it?.weight),
          }))
          .filter((it) => !isNaN(it.weight) && it.weight > 0);
      }
    } catch {
      return { error: "Items inválidos" };
    }
  }

  const container = await prisma.container.create({
    data: {
      number,
      notes: String(formData.get("notes") || "") || null,
      items: {
        create: items.map((it) => ({
          strainId: it.strainId,
          plantNumber: it.plantNumber,
          initialWeight: it.weight,
          currentWeight: it.weight,
          movements: {
            create: { type: "IN", amount: it.weight, notes: "Carga inicial" },
          },
        })),
      },
    },
  });

  await audit({
    userId: session.user.id,
    actorEmail: session.user.email,
    action: "container.create",
    entity: "Container",
    entityId: container.id,
    metadata: { number, itemsCount: items.length },
  });

  revalidatePath("/administrador/acopio");
  return { ok: true, id: container.id };
}

/* ── Update container ─────────────────────────────────── */

export async function updateContainerAction(formData: FormData) {
  const session = await requireAdmin();
  const id = String(formData.get("id"));

  const before = await prisma.container.findUnique({ where: { id } });
  if (!before) return;

  const nextNotes = String(formData.get("notes") || "") || null;
  const nextActive = formData.get("active") === "on";

  await prisma.container.update({
    where: { id },
    data: { notes: nextNotes, active: nextActive },
  });

  const changes: Record<string, { from: unknown; to: unknown }> = {};
  if (before.notes !== nextNotes)
    changes.notes = { from: before.notes, to: nextNotes };
  if (before.active !== nextActive)
    changes.active = { from: before.active, to: nextActive };

  await audit({
    userId: session.user.id,
    actorEmail: session.user.email,
    action: "container.update",
    entity: "Container",
    entityId: id,
    metadata: { number: before.number, changes },
  });

  revalidatePath("/administrador/acopio");
}

/* ── Toggle active ────────────────────────────────────── */

export async function toggleContainerActiveAction(formData: FormData) {
  const session = await requireAdmin();
  const id = String(formData.get("id"));
  const active = formData.get("active") === "true";

  await prisma.container.update({
    where: { id },
    data: { active: !active },
  });

  await audit({
    userId: session.user.id,
    actorEmail: session.user.email,
    action: active ? "container.deactivate" : "container.activate",
    entity: "Container",
    entityId: id,
  });

  revalidatePath("/administrador/acopio");
}

/* ── Add item to container ────────────────────────────── */

export async function addContainerItemAction(formData: FormData) {
  const session = await requireAdmin();
  const containerId = String(formData.get("containerId"));
  const strainId = String(formData.get("strainId") || "") || null;
  const plantNumber = String(formData.get("plantNumber") || "") || null;
  const weight = parseFloat(String(formData.get("weight")));

  if (isNaN(weight) || weight <= 0) return { error: "Peso inválido" };

  const item = await prisma.containerItem.create({
    data: {
      containerId,
      strainId,
      plantNumber,
      initialWeight: weight,
      currentWeight: weight,
    },
  });

  // Record IN movement
  await prisma.movement.create({
    data: {
      containerItemId: item.id,
      type: "IN",
      amount: weight,
      notes: "Carga inicial",
    },
  });

  await audit({
    userId: session.user.id,
    actorEmail: session.user.email,
    action: "container.item.add",
    entity: "ContainerItem",
    entityId: item.id,
    metadata: { containerId, weight, strainId, plantNumber },
  });

  revalidatePath("/administrador/acopio");
  return { ok: true };
}

/* ── Record manual movement (adjustment) ──────────────── */

export async function addMovementAction(formData: FormData) {
  const session = await requireAdmin();
  const containerItemId = String(formData.get("containerItemId"));
  const type = String(formData.get("type")) as "IN" | "OUT";
  const amount = parseFloat(String(formData.get("amount")));
  const notes = String(formData.get("notes") || "") || null;

  if (isNaN(amount) || amount <= 0) return { error: "Cantidad inválida" };

  const item = await prisma.containerItem.findUnique({
    where: { id: containerItemId },
  });
  if (!item) return { error: "Item no encontrado" };

  if (type === "OUT" && amount > item.currentWeight) {
    return { error: "No hay suficiente stock" };
  }

  const newWeight =
    type === "IN"
      ? item.currentWeight + amount
      : item.currentWeight - amount;

  await prisma.$transaction([
    prisma.movement.create({
      data: { containerItemId, type, amount, notes },
    }),
    prisma.containerItem.update({
      where: { id: containerItemId },
      data: { currentWeight: newWeight },
    }),
  ]);

  await audit({
    userId: session.user.id,
    actorEmail: session.user.email,
    action: `container.item.movement.${type.toLowerCase()}`,
    entity: "ContainerItem",
    entityId: containerItemId,
    metadata: { amount, type, notes },
  });

  revalidatePath("/administrador/acopio");
  return { ok: true };
}

/* ── Delete container item ────────────────────────────── */

export async function deleteContainerItemAction(formData: FormData) {
  const session = await requireAdmin();
  const id = String(formData.get("id"));

  await prisma.containerItem.delete({ where: { id } });

  await audit({
    userId: session.user.id,
    actorEmail: session.user.email,
    action: "container.item.delete",
    entity: "ContainerItem",
    entityId: id,
  });

  revalidatePath("/administrador/acopio");
}
