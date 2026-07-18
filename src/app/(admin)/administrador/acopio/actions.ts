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

  const tenantId = session.user.tenantId;
  const number = parseInt(String(formData.get("number")), 10);
  if (isNaN(number)) return { error: "Número inválido" };

  // Si se carga dentro de una cosecha (staging), se asocia. La cosecha debe ser
  // del club y no estar declarada todavía.
  const harvestId = String(formData.get("harvestId") || "") || null;
  if (harvestId) {
    const harvest = await prisma.harvest.findFirst({
      where: { id: harvestId, tenantId, declarada: false },
      select: { id: true },
    });
    if (!harvest) return { error: "La cosecha no está disponible" };
  }

  // El número es único por cosecha (cada cosecha numera desde 1).
  const exists = await prisma.container.findFirst({
    where: { tenantId, harvestId, number },
    select: { id: true },
  });
  if (exists) return { error: `El contenedor #${number} ya existe en esta cosecha` };

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

  // Nada se comparte entre clubes: cada genética referenciada por un item debe
  // pertenecer al club. Se validan todas en una sola consulta.
  const strainIds = [
    ...new Set(items.map((it) => it.strainId).filter((s): s is string => !!s)),
  ];
  if (strainIds.length) {
    const owned = await prisma.strain.findMany({
      where: { id: { in: strainIds }, tenantId },
      select: { id: true },
    });
    if (owned.length !== strainIds.length) {
      return { error: "Alguna genética no pertenece al club" };
    }
  }

  const container = await prisma.container.create({
    data: {
      tenantId,
      harvestId,
      number,
      notes: String(formData.get("notes") || "") || null,
      items: {
        create: items.map((it) => ({
          tenantId,
          strainId: it.strainId,
          plantNumber: it.plantNumber,
          initialWeight: it.weight,
          currentWeight: it.weight,
          movements: {
            create: {
              tenantId,
              type: "IN",
              amount: it.weight,
              notes: "Carga inicial",
            },
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
    metadata: { number, itemsCount: items.length, harvestId },
  });

  // Un contenedor en cosecha (staging) todavía no se ve en acopio; revalida la
  // página de cosechas. Uno suelto va directo a acopio.
  revalidatePath(harvestId ? "/administrador/operativa/cosechas" : "/administrador/acopio");
  return { ok: true, id: container.id };
}

/* ── Update container ─────────────────────────────────── */

export async function updateContainerAction(formData: FormData) {
  const session = await requireAdmin();
  const id = String(formData.get("id"));

  const before = await prisma.container.findFirst({
    where: { id, tenantId: session.user.tenantId },
  });
  if (!before) return;

  const nextNotes = String(formData.get("notes") || "") || null;

  await prisma.container.update({
    where: { id: before.id },
    data: { notes: nextNotes },
  });

  const changes: Record<string, { from: unknown; to: unknown }> = {};
  if (before.notes !== nextNotes)
    changes.notes = { from: before.notes, to: nextNotes };

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

/* ── Toggle active (por item/genética) ────────────────── */

export async function toggleContainerItemActiveAction(formData: FormData) {
  const session = await requireAdmin();
  const id = String(formData.get("id"));
  const active = formData.get("active") === "true";

  const res = await prisma.containerItem.updateMany({
    where: { id, tenantId: session.user.tenantId },
    data: { active: !active },
  });
  if (res.count === 0) return;

  await audit({
    userId: session.user.id,
    actorEmail: session.user.email,
    action: active ? "container.item.deactivate" : "container.item.activate",
    entity: "ContainerItem",
    entityId: id,
  });

  revalidatePath("/administrador/acopio");
}

/* ── Add item to container ────────────────────────────── */

export async function addContainerItemAction(formData: FormData) {
  const session = await requireAdmin();
  const tenantId = session.user.tenantId;
  const containerId = String(formData.get("containerId"));
  const strainId = String(formData.get("strainId") || "") || null;
  const plantNumber = String(formData.get("plantNumber") || "") || null;
  const weight = parseFloat(String(formData.get("weight")));

  if (isNaN(weight) || weight <= 0) return { error: "Peso inválido" };

  const container = await prisma.container.findFirst({
    where: { id: containerId, tenantId },
    select: { id: true },
  });
  if (!container) return { error: "Contenedor no encontrado" };

  // Nada se comparte entre clubes: la genética debe pertenecer al club.
  if (strainId) {
    const strain = await prisma.strain.findFirst({
      where: { id: strainId, tenantId },
      select: { id: true },
    });
    if (!strain) return { error: "La genética no pertenece al club" };
  }

  const item = await prisma.containerItem.create({
    data: {
      tenantId,
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
      tenantId,
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

  const tenantId = session.user.tenantId;
  const item = await prisma.containerItem.findFirst({
    where: { id: containerItemId, tenantId },
  });
  if (!item) return { error: "Item no encontrado" };

  if (type === "OUT") {
    // El stock que un OUT manual puede descontar es el libre: el peso actual
    // menos lo ya comprometido en reservas de retiros. Descontar contra
    // currentWeight a secas permitiría dejar el item por debajo de lo
    // reservado y, al consumir esas reservas, currentWeight quedaría negativo.
    const reserved = await prisma.reservation.aggregate({
      where: { tenantId, containerItemId },
      _sum: { amount: true },
    });
    const free = item.currentWeight - (reserved._sum.amount ?? 0);
    if (amount > free + 1e-6) {
      return { error: `No hay suficiente stock libre. Disponible: ${free} g.` };
    }
  }

  const newWeight =
    type === "IN"
      ? item.currentWeight + amount
      : item.currentWeight - amount;

  await prisma.$transaction([
    prisma.movement.create({
      data: { tenantId, containerItemId, type, amount, notes },
    }),
    prisma.containerItem.update({
      where: { id: containerItemId },
      // Al agotarse (peso <= 0) el bollón se desactiva solo: deja de figurar
      // como fuente de stock. El admin lo reactiva a mano si lo recarga.
      data: {
        currentWeight: newWeight,
        ...(newWeight <= 1e-6 ? { active: false } : {}),
      },
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

  const res = await prisma.containerItem.deleteMany({
    where: { id, tenantId: session.user.tenantId },
  });
  if (res.count === 0) return;

  await audit({
    userId: session.user.id,
    actorEmail: session.user.email,
    action: "container.item.delete",
    entity: "ContainerItem",
    entityId: id,
  });

  revalidatePath("/administrador/acopio");
}
