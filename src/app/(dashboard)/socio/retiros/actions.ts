"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getClubConfig } from "@/lib/config";
import { retiroSchema } from "@/lib/validators";
import { releaseReservationsForWithdrawal } from "@/lib/reservations";
import { audit } from "@/lib/audit";

export type RetiroFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
} | null;

export async function crearRetiroAction(
  _prev: RetiroFormState,
  formData: FormData,
): Promise<RetiroFormState> {
  const session = await auth();
  if (!session) return { error: "No autenticado." };
  if (session.user.role === "ADMIN") {
    return {
      error:
        "El administrador no puede agendar retiros. Ingresá con una cuenta de socio.",
    };
  }
  if (session.user.mustChangePassword) {
    const fresh = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { mustChangePassword: true },
    });
    if (fresh?.mustChangePassword) {
      return { error: "Cambiá tu contraseña genérica antes de agendar retiros." };
    }
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
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (fechaDate < today) {
    return { fieldErrors: { date: "La fecha no puede ser en el pasado" } };
  }
  const config = await getClubConfig();
  if (!config.diasHabiles.includes(fechaDate.getDay())) {
    return { fieldErrors: { date: "Los retiros son de lunes a viernes" } };
  }
  if (!config.horarios.includes(timeSlot)) {
    return { fieldErrors: { timeSlot: "Horario no válido" } };
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
      userId: session.user.id,
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
      error: `Excede el máximo mensual. Disponible: ${disponible} g.`,
    };
  }

  const created = await prisma.withdrawal.create({
    data: {
      userId: session.user.id,
      date: fechaDate,
      timeSlot,
      notes: notes ? String(notes) : null,
      items: {
        create: validItems.map((i) => ({
          strainId: i.strainId,
          amount: i.amount,
        })),
      },
    },
  });

  await audit({
    userId: session.user.id,
    actorEmail: session.user.email,
    action: "withdrawal.create",
    entity: "Withdrawal",
    entityId: created.id,
    metadata: {
      date: fechaDate.toISOString(),
      timeSlot,
      totalGramos,
      items: validItems,
      isDemo: session.user.role === "VISITANTE",
    },
  });

  revalidatePath("/socio");
  revalidatePath("/socio/retiros");
  redirect("/socio/retiros");
}

export async function cancelarRetiroAction(formData: FormData) {
  const session = await auth();
  if (!session) return;
  if (session.user.role === "ADMIN") return;

  const id = formData.get("id");
  if (typeof id !== "string") return;

  const retiro = await prisma.withdrawal.findUnique({ where: { id } });
  if (!retiro || retiro.userId !== session.user.id) return;
  if (retiro.status !== "PENDING" && retiro.status !== "APPROVED") return;

  await prisma.$transaction(async (tx) => {
    await releaseReservationsForWithdrawal(tx, id);
    await tx.withdrawal.update({
      where: { id },
      data: { status: "CANCELLED" },
    });
  });

  await audit({
    userId: session.user.id,
    actorEmail: session.user.email,
    action: "withdrawal.cancel",
    entity: "Withdrawal",
    entityId: id,
    metadata: { isDemo: session.user.role === "VISITANTE" },
  });

  revalidatePath("/socio");
  revalidatePath("/socio/retiros");
  revalidatePath("/administrador/acopio");
}
