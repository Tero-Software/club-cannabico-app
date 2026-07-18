"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { assertCan } from "@/lib/permissions";
import { audit } from "@/lib/audit";
import { getClubConfig } from "@/lib/config";
import { retiroSchema } from "@/lib/validators";
import {
  reserveForWithdrawal,
  releaseReservationsForWithdrawal,
  consumeReservationsForWithdrawal,
  InsufficientStockError,
} from "@/lib/reservations";
import { computeWithdrawalCharge } from "@/lib/billing";
import { resolvePlanForMember } from "@/lib/billing-server";
import type { WithdrawalStatus } from "@/generated/prisma/enums";

const VALID_ESTADOS: WithdrawalStatus[] = [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "COMPLETED",
  "CANCELLED",
];

type Result = { ok?: true; error?: string };

export async function updateWithdrawalStatusAction(
  formData: FormData,
): Promise<Result | void> {
  const session = await auth();
  assertCan(session, "retiros:manage");

  const id = formData.get("id");
  const estado = formData.get("estado");
  if (typeof id !== "string" || typeof estado !== "string") return;
  if (!VALID_ESTADOS.includes(estado as WithdrawalStatus)) return;

  const next = estado as WithdrawalStatus;
  const tenantId = session.user.tenantId;

  const prev = await prisma.withdrawal.findFirst({
    where: { id, tenantId },
    select: {
      status: true,
      userId: true,
      date: true,
      paid: true,
      chargedAmount: true,
      user: { select: { role: true, name: true } },
    },
  });
  if (!prev) return;
  if (prev.status === next) return;
  if (prev.user.role === "VISITANTE") {
    return { error: "Este retiro es de demostración y no se puede modificar." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const leavingReserved =
        (prev.status === "APPROVED" || prev.status === "PENDING") &&
        (next === "REJECTED" || next === "CANCELLED");

      if (next === "APPROVED" && prev.status !== "COMPLETED") {
        await reserveForWithdrawal(tx, id, tenantId);
      } else if (next === "COMPLETED") {
        if (prev.status !== "APPROVED") {
          await reserveForWithdrawal(tx, id, tenantId);
        }
        await consumeReservationsForWithdrawal(tx, id, tenantId);
      } else if (leavingReserved) {
        await releaseReservationsForWithdrawal(tx, id, tenantId);
      }

      // El ingreso al libro se asienta al completar el retiro, si el socio pagó
      // y hay un monto congelado (calculado al aprobar). Idempotente por el único
      // withdrawalId. Si se sale de COMPLETED (reabrir/cancelar), se quita.
      if (next === "COMPLETED") {
        const charge = prev.chargedAmount ? prev.chargedAmount.toNumber() : 0;
        if (prev.paid && charge > 0) {
          await tx.financeEntry.upsert({
            where: { withdrawalId: id },
            create: {
              tenantId,
              date: prev.date,
              kind: "INGRESO",
              category: "Membresía",
              description: `Cobro de retiro — ${prev.user.name}`,
              amount: charge,
              withdrawalId: id,
              createdById: session.user.id,
            },
            update: {},
          });
        }
      } else if (prev.status === "COMPLETED") {
        await tx.financeEntry.deleteMany({ where: { tenantId, withdrawalId: id } });
      }

      await tx.withdrawal.update({
        where: { id },
        data: { status: next },
      });
    });
  } catch (err) {
    if (err instanceof InsufficientStockError) {
      return { error: err.message };
    }
    throw err;
  }

  await audit({
    userId: session.user.id,
    actorEmail: session.user.email,
    action: "retiro.estado_change",
    entity: "Retiro",
    entityId: id,
    metadata: { from: prev.status, to: next, socioId: prev.userId },
  });

  revalidatePath("/administrador");
  revalidatePath("/administrador/retiros");
  revalidatePath("/administrador/acopio");
  revalidatePath("/administrador/directiva/finanzas");
  return { ok: true };
}

/**
 * Aprueba un retiro PENDING verificando la forma de pago. El admin marca si el
 * socio pagó y con qué plan se cobra (por defecto, el que le corresponde al
 * socio). El monto se congela en el retiro; si está pagado, se asienta el
 * ingreso en el libro de finanzas, ligado al retiro.
 */
export async function approveWithdrawalAction(
  formData: FormData,
): Promise<Result | void> {
  const session = await auth();
  assertCan(session, "retiros:manage");
  const tenantId = session.user.tenantId;

  const id = String(formData.get("id") ?? "");
  const paid = formData.get("paid") === "true";
  const planIdInput = String(formData.get("planId") ?? "") || null;

  const w = await prisma.withdrawal.findFirst({
    where: { id, tenantId },
    select: {
      status: true,
      userId: true,
      date: true,
      user: { select: { role: true, name: true, membershipPlanId: true } },
      items: { select: { amount: true } },
    },
  });
  if (!w) return { error: "Retiro no encontrado" };
  if (w.user.role === "VISITANTE") {
    return { error: "Este retiro es de demostración y no se puede modificar." };
  }
  if (w.status !== "PENDING") {
    return { error: "El retiro ya no está pendiente." };
  }

  // Plan: el elegido a mano en la aprobación, o el que le toca al socio.
  const planId = planIdInput ?? w.user.membershipPlanId;
  const [plan, config] = await Promise.all([
    resolvePlanForMember(tenantId, planId),
    getClubConfig(tenantId),
  ]);
  const totalGrams = w.items.reduce((s, i) => s + i.amount, 0);
  const charge = plan
    ? computeWithdrawalCharge(plan, totalGrams, config.cobroExcedente)
    : null;

  // En la aprobación solo se congela la forma de pago (pagó/no), el monto y el
  // plan aplicado. El ingreso al libro se asienta recién al completar el retiro.
  try {
    await prisma.$transaction(async (tx) => {
      await reserveForWithdrawal(tx, id, tenantId);
      await tx.withdrawal.update({
        where: { id },
        data: {
          status: "APPROVED",
          paid,
          chargedAmount: charge,
          appliedPlanId: plan?.id ?? null,
        },
      });
    });
  } catch (err) {
    if (err instanceof InsufficientStockError) {
      return { error: err.message };
    }
    throw err;
  }

  await audit({
    userId: session.user.id,
    actorEmail: session.user.email,
    action: "retiro.approve",
    entity: "Retiro",
    entityId: id,
    metadata: { socioId: w.userId, paid, planId: plan?.id ?? null, charge },
  });

  revalidatePath("/administrador");
  revalidatePath("/administrador/retiros");
  revalidatePath("/administrador/acopio");
  revalidatePath("/administrador/directiva/finanzas");
  return { ok: true };
}

/**
 * Edita la forma de pago de un retiro ya APPROVED (o COMPLETED): permite
 * corregir si el socio pagó y con qué plan se cobra, y recalcula el monto
 * congelado. Si el retiro ya está COMPLETED, ajusta también el asiento del
 * libro de finanzas para que refleje el nuevo estado de pago.
 */
export async function updatePaymentAction(
  formData: FormData,
): Promise<Result | void> {
  const session = await auth();
  assertCan(session, "retiros:manage");
  const tenantId = session.user.tenantId;

  const id = String(formData.get("id") ?? "");
  const paid = formData.get("paid") === "true";
  const planIdInput = String(formData.get("planId") ?? "") || null;

  const w = await prisma.withdrawal.findFirst({
    where: { id, tenantId },
    select: {
      status: true,
      date: true,
      userId: true,
      user: { select: { role: true, name: true, membershipPlanId: true } },
      items: { select: { amount: true } },
    },
  });
  if (!w) return { error: "Retiro no encontrado" };
  if (w.user.role === "VISITANTE") {
    return { error: "Este retiro es de demostración y no se puede modificar." };
  }
  if (w.status !== "APPROVED" && w.status !== "COMPLETED") {
    return { error: "Solo se puede editar el pago de un retiro aprobado o completado." };
  }

  const planId = planIdInput ?? w.user.membershipPlanId;
  const [plan, config] = await Promise.all([
    resolvePlanForMember(tenantId, planId),
    getClubConfig(tenantId),
  ]);
  const totalGrams = w.items.reduce((s, i) => s + i.amount, 0);
  const charge = plan
    ? computeWithdrawalCharge(plan, totalGrams, config.cobroExcedente)
    : null;

  await prisma.$transaction(async (tx) => {
    await tx.withdrawal.update({
      where: { id },
      data: { paid, chargedAmount: charge, appliedPlanId: plan?.id ?? null },
    });

    // Si el retiro ya estaba completado, el asiento del libro debe seguir al
    // nuevo estado de pago: se crea/actualiza si paga y hay monto, o se quita.
    if (w.status === "COMPLETED") {
      if (paid && charge && charge > 0) {
        await tx.financeEntry.upsert({
          where: { withdrawalId: id },
          create: {
            tenantId,
            date: w.date,
            kind: "INGRESO",
            category: "Membresía",
            description: `Cobro de retiro — ${w.user.name}`,
            amount: charge,
            withdrawalId: id,
            createdById: session.user.id,
          },
          update: { amount: charge },
        });
      } else {
        await tx.financeEntry.deleteMany({ where: { tenantId, withdrawalId: id } });
      }
    }
  });

  await audit({
    userId: session.user.id,
    actorEmail: session.user.email,
    action: "retiro.payment_edit",
    entity: "Retiro",
    entityId: id,
    metadata: { socioId: w.userId, paid, planId: plan?.id ?? null, charge },
  });

  revalidatePath("/administrador");
  revalidatePath("/administrador/retiros");
  revalidatePath("/administrador/directiva/finanzas");
  return { ok: true };
}

export type CrearRetiroAdminState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  ok?: boolean;
} | null;

export async function crearRetiroAdminAction(
  _prev: CrearRetiroAdminState,
  formData: FormData,
): Promise<CrearRetiroAdminState> {
  const session = await auth();
  assertCan(session, "retiros:manage");

  const userId = formData.get("userId");
  if (typeof userId !== "string" || !userId) {
    return { fieldErrors: { userId: "Seleccioná un socio" } };
  }

  const itemsRaw = formData.get("items");
  let items: { strainId: string; amount: number }[] = [];
  if (typeof itemsRaw === "string") {
    try {
      const parsed = JSON.parse(itemsRaw);
      if (Array.isArray(parsed)) {
        items = parsed.map((i) => ({
          strainId: String(i.strainId ?? ""),
          amount: Number(i.amount),
        }));
      }
    } catch {
      return { error: "Datos inválidos." };
    }
  }

  const parsed = retiroSchema.safeParse({
    date: formData.get("fecha"),
    timeSlot: formData.get("horario"),
    items,
    notes: formData.get("notas") || "",
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string") fieldErrors[key] = issue.message;
    }
    return { fieldErrors };
  }

  const { date, timeSlot, items: validItems, notes } = parsed.data;

  const fechaDate = new Date(date);
  if (Number.isNaN(fechaDate.getTime())) {
    return { fieldErrors: { date: "Fecha inválida" } };
  }
  const tenantId = session.user.tenantId;
  const config = await getClubConfig(tenantId);
  if (!config.horarios.includes(timeSlot)) {
    return { fieldErrors: { timeSlot: "Horario no válido" } };
  }

  const socio = await prisma.user.findFirst({
    where: { id: userId, tenantId },
    select: { id: true, role: true, active: true, name: true, email: true, membershipPlanId: true },
  });
  if (!socio || socio.role !== "MEMBER") {
    return { fieldErrors: { userId: "Socio no encontrado" } };
  }

  const totalGramos = validItems.reduce((s, i) => s + i.amount, 0);
  if (totalGramos < config.minGramosRetiro) {
    return { error: `Mínimo ${config.minGramosRetiro} g por retiro.` };
  }

  const geneticaIds = validItems.map((i) => i.strainId);
  if (new Set(geneticaIds).size !== geneticaIds.length) {
    return { error: "No podés repetir variedades en el mismo retiro." };
  }

  const geneticas = await prisma.strain.findMany({
    where: { id: { in: geneticaIds }, tenantId },
  });
  if (geneticas.length !== geneticaIds.length) {
    return { error: "Una variedad seleccionada no está disponible." };
  }

  const inicioMes = new Date(fechaDate.getFullYear(), fechaDate.getMonth(), 1);
  const inicioMesSiguiente = new Date(
    fechaDate.getFullYear(),
    fechaDate.getMonth() + 1,
    1,
  );
  const retirosDelMes = await prisma.withdrawal.findMany({
    where: {
      tenantId,
      userId: socio.id,
      date: { gte: inicioMes, lt: inicioMesSiguiente },
      status: { notIn: ["REJECTED", "CANCELLED"] },
    },
    include: { items: true },
  });
  const gramosAcumulados = retirosDelMes.reduce(
    (s, r) => s + r.items.reduce((ss, i) => ss + i.amount, 0),
    0,
  );
  if (gramosAcumulados + totalGramos > config.maxGramosMes) {
    const disponible = config.maxGramosMes - gramosAcumulados;
    return {
      error: `Excede el máximo mensual del socio. Disponible: ${disponible} g.`,
    };
  }

  // Cobro: el admin marca si el socio pagó y con qué plan (por defecto, el del
  // socio). El alta admin nace APPROVED, así que el cobro se resuelve acá mismo.
  const paid = formData.get("pagado") === "true";
  const planIdInput = String(formData.get("planId") ?? "") || null;
  const planId = planIdInput ?? socio.membershipPlanId;
  const plan = await resolvePlanForMember(tenantId, planId);
  const charge = plan
    ? computeWithdrawalCharge(plan, totalGramos, config.cobroExcedente)
    : null;

  try {
    const created = await prisma.$transaction(async (tx) => {
      const w = await tx.withdrawal.create({
        data: {
          tenantId,
          userId: socio.id,
          date: fechaDate,
          timeSlot,
          status: "APPROVED",
          notes: notes ? String(notes) : null,
          paid,
          chargedAmount: charge,
          appliedPlanId: plan?.id ?? null,
          items: {
            create: validItems.map((i) => ({
              tenantId,
              strainId: i.strainId,
              amount: i.amount,
            })),
          },
        },
      });
      await reserveForWithdrawal(tx, w.id, tenantId);
      // El retiro nace APPROVED; el ingreso al libro se asienta al completarlo,
      // no acá. Solo se congela paid/chargedAmount/plan en el retiro.
      return w;
    });

    await audit({
      userId: session.user.id,
      actorEmail: session.user.email,
      action: "retiro.create_admin",
      entity: "Retiro",
      entityId: created.id,
      metadata: {
        socioId: socio.id,
        socioEmail: socio.email,
        totalGramos,
        status: "APPROVED",
        paid,
        charge,
      },
    });
  } catch (err) {
    if (err instanceof InsufficientStockError) {
      return { error: err.message };
    }
    throw err;
  }

  revalidatePath("/administrador");
  revalidatePath("/administrador/retiros");
  revalidatePath("/administrador/acopio");
  revalidatePath("/administrador/directiva/finanzas");
  return { ok: true };
}
