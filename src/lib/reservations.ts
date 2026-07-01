import type { Prisma } from "@/generated/prisma/client";

export class InsufficientStockError extends Error {
  constructor(
    public strainName: string,
    public requested: number,
    public available: number,
  ) {
    super(
      `Stock insuficiente de ${strainName}: pide ${requested}g, disponible ${available}g`,
    );
  }
}

type Tx = Prisma.TransactionClient;

async function availableByContainerItem(
  tx: Tx,
  containerItemIds: string[],
  tenantId: string,
): Promise<Map<string, number>> {
  if (containerItemIds.length === 0) return new Map();
  const rows = await tx.reservation.groupBy({
    by: ["containerItemId"],
    where: { tenantId, containerItemId: { in: containerItemIds } },
    _sum: { amount: true },
  });
  const map = new Map<string, number>();
  for (const r of rows) map.set(r.containerItemId, r._sum.amount ?? 0);
  return map;
}

/**
 * Reservar peso para cada item del retiro, splitteando entre containers
 * de menor a mayor stock libre. Si no alcanza el total para un item, tira.
 */
export async function reserveForWithdrawal(
  tx: Tx,
  withdrawalId: string,
  tenantId: string,
): Promise<void> {
  const items = await tx.withdrawalItem.findMany({
    where: { withdrawalId, tenantId },
    include: { strain: true },
  });

  for (const item of items) {
    const existing = await tx.reservation.findFirst({
      where: { withdrawalItemId: item.id, tenantId },
    });
    if (existing) continue;

    const candidates = await tx.containerItem.findMany({
      where: {
        tenantId,
        strainId: item.strainId,
        active: true,
        currentWeight: { gt: 0 },
      },
    });

    const reservedMap = await availableByContainerItem(
      tx,
      candidates.map((c) => c.id),
      tenantId,
    );

    const free = candidates
      .map((c) => ({
        id: c.id,
        free: c.currentWeight - (reservedMap.get(c.id) ?? 0),
      }))
      .filter((c) => c.free > 0)
      .sort((a, b) => a.free - b.free);

    const totalFree = free.reduce((s, c) => s + c.free, 0);
    if (totalFree + 1e-6 < item.amount) {
      throw new InsufficientStockError(
        item.strain.name,
        item.amount,
        totalFree,
      );
    }

    let remaining = item.amount;
    for (const c of free) {
      if (remaining <= 1e-6) break;
      const take = Math.min(c.free, remaining);
      await tx.reservation.create({
        data: {
          tenantId,
          containerItemId: c.id,
          withdrawalItemId: item.id,
          amount: take,
        },
      });
      remaining -= take;
    }
  }
}

/** Libera todas las reservas del retiro (cancel/reject). */
export async function releaseReservationsForWithdrawal(
  tx: Tx,
  withdrawalId: string,
  tenantId: string,
): Promise<void> {
  await tx.reservation.deleteMany({
    where: { tenantId, withdrawalItem: { withdrawalId } },
  });
}

/**
 * Convierte reservas del retiro en Movements OUT y descuenta currentWeight.
 * Borra las reservas consumidas.
 */
export async function consumeReservationsForWithdrawal(
  tx: Tx,
  withdrawalId: string,
  tenantId: string,
): Promise<void> {
  const reservations = await tx.reservation.findMany({
    where: { tenantId, withdrawalItem: { withdrawalId } },
  });

  for (const r of reservations) {
    await tx.movement.create({
      data: {
        tenantId,
        containerItemId: r.containerItemId,
        withdrawalItemId: r.withdrawalItemId,
        type: "OUT",
        amount: r.amount,
        notes: "Retiro entregado",
      },
    });
    const updated = await tx.containerItem.update({
      where: { id: r.containerItemId },
      data: { currentWeight: { decrement: r.amount } },
      select: { currentWeight: true },
    });
    // Al agotarse (peso <= 0) el bollón se desactiva solo: deja de figurar como
    // fuente de stock. El admin lo reactiva a mano si lo recarga.
    if (updated.currentWeight <= 1e-6) {
      await tx.containerItem.update({
        where: { id: r.containerItemId },
        data: { active: false },
      });
    }
  }

  await tx.reservation.deleteMany({
    where: { id: { in: reservations.map((r) => r.id) } },
  });
}
