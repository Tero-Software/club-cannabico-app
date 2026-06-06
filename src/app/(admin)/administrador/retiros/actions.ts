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

  const prev = await prisma.withdrawal.findUnique({
    where: { id },
    select: { status: true, userId: true, user: { select: { role: true } } },
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
        await reserveForWithdrawal(tx, id);
      } else if (next === "COMPLETED") {
        if (prev.status !== "APPROVED") {
          await reserveForWithdrawal(tx, id);
        }
        await consumeReservationsForWithdrawal(tx, id);
      } else if (leavingReserved) {
        await releaseReservationsForWithdrawal(tx, id);
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
  const config = await getClubConfig();
  if (!config.horarios.includes(timeSlot)) {
    return { fieldErrors: { timeSlot: "Horario no válido" } };
  }

  const socio = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, active: true, name: true, email: true },
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
    where: { id: { in: geneticaIds } },
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

  try {
    const created = await prisma.$transaction(async (tx) => {
      const w = await tx.withdrawal.create({
        data: {
          userId: socio.id,
          date: fechaDate,
          timeSlot,
          status: "APPROVED",
          notes: notes ? String(notes) : null,
          items: {
            create: validItems.map((i) => ({
              strainId: i.strainId,
              amount: i.amount,
            })),
          },
        },
      });
      await reserveForWithdrawal(tx, w.id);
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
  return { ok: true };
}
