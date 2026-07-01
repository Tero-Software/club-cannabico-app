"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";

async function requireAdmin() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("No autorizado");
  }
  return session;
}

const tierSchema = z.object({
  fromGrams: z.number().nonnegative().max(100000),
  price: z.number().nonnegative().max(1000000000).multipleOf(0.01, "Hasta dos decimales"),
});

const planSchema = z
  .object({
    name: z.string().trim().min(1, "Nombre requerido").max(120),
    monthlyPrice: z
      .number()
      .nonnegative()
      .max(1000000000)
      .multipleOf(0.01, "Hasta dos decimales"),
    tiers: z.array(tierSchema),
  })
  .superRefine((data, ctx) => {
    const grams = data.tiers.map((t) => t.fromGrams);
    if (new Set(grams).size !== grams.length) {
      ctx.addIssue({ code: "custom", path: ["tiers"], message: "No repitas el mismo valor de gramos en dos franjas" });
    }
  });

export type PlanState = { ok?: true; error?: string; fieldErrors?: Record<string, string> } | null;

function parsePayload(fd: FormData) {
  let tiers: { fromGrams: number; price: number }[] = [];
  const raw = fd.get("tiers");
  if (typeof raw === "string" && raw.trim()) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        tiers = parsed
          .map((t) => ({ fromGrams: Number(t?.fromGrams), price: Number(t?.price) }))
          .filter((t) => !Number.isNaN(t.fromGrams) && !Number.isNaN(t.price));
      }
    } catch {
      /* ignore: validado abajo */
    }
  }
  const monthlyRaw = fd.get("monthlyPrice");
  const monthlyPrice =
    typeof monthlyRaw === "string" && monthlyRaw.trim() !== "" ? Number(monthlyRaw) : NaN;

  return planSchema.safeParse({
    name: String(fd.get("name") ?? ""),
    monthlyPrice,
    tiers,
  });
}

function fieldErrorsFrom(parsed: z.ZodError) {
  const fieldErrors: Record<string, string> = {};
  for (const issue of parsed.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return fieldErrors;
}

export async function createPlanAction(_prev: PlanState, fd: FormData): Promise<PlanState> {
  const session = await requireAdmin();
  const tenantId = session.user.tenantId;

  const parsed = parsePayload(fd);
  if (!parsed.success) {
    return { error: "Revisá los campos", fieldErrors: fieldErrorsFrom(parsed.error) };
  }
  const data = parsed.data;

  // El plan por defecto del club se fija en Configuración, no acá. Un plan nuevo
  // nace sin ser el default.
  const plan = await prisma.membershipPlan.create({
    data: {
      tenantId,
      name: data.name,
      monthlyPrice: data.monthlyPrice,
      tiers: {
        create: data.tiers.map((t) => ({ tenantId, fromGrams: t.fromGrams, price: t.price })),
      },
    },
  });

  await audit({
    userId: session.user.id,
    actorEmail: session.user.email,
    action: "membership.plan.create",
    entity: "MembershipPlan",
    entityId: plan.id,
    metadata: { name: data.name, monthlyPrice: data.monthlyPrice, tiers: data.tiers.length },
  });

  revalidatePath("/administrador/configuracion");
  return { ok: true };
}

export async function updatePlanAction(_prev: PlanState, fd: FormData): Promise<PlanState> {
  const session = await requireAdmin();
  const tenantId = session.user.tenantId;
  const id = String(fd.get("id") ?? "");

  const existing = await prisma.membershipPlan.findFirst({ where: { id, tenantId }, select: { id: true } });
  if (!existing) return { error: "Plan no encontrado" };

  const parsed = parsePayload(fd);
  if (!parsed.success) {
    return { error: "Revisá los campos", fieldErrors: fieldErrorsFrom(parsed.error) };
  }
  const data = parsed.data;

  await prisma.$transaction(async (tx) => {
    // Tramos: se reemplazan por completo (es la forma más simple y sin estado
    // intermedio inconsistente para una lista corta editable a mano). El estado
    // de plan por defecto no se toca acá; se gestiona desde Configuración.
    await tx.membershipTier.deleteMany({ where: { planId: id, tenantId } });
    await tx.membershipPlan.update({
      where: { id },
      data: {
        name: data.name,
        monthlyPrice: data.monthlyPrice,
        tiers: {
          create: data.tiers.map((t) => ({ tenantId, fromGrams: t.fromGrams, price: t.price })),
        },
      },
    });
  });

  await audit({
    userId: session.user.id,
    actorEmail: session.user.email,
    action: "membership.plan.update",
    entity: "MembershipPlan",
    entityId: id,
    metadata: { name: data.name, monthlyPrice: data.monthlyPrice, tiers: data.tiers.length },
  });

  revalidatePath("/administrador/configuracion");
  return { ok: true };
}

export async function deletePlanAction(fd: FormData): Promise<PlanState> {
  const session = await requireAdmin();
  const tenantId = session.user.tenantId;
  const id = String(fd.get("id") ?? "");

  const plan = await prisma.membershipPlan.findFirst({
    where: { id, tenantId },
    select: { id: true, name: true, _count: { select: { members: true, withdrawals: true } } },
  });
  if (!plan) return { error: "Plan no encontrado" };

  // No se borra un plan en uso (socios asignados o retiros ya cobrados con él):
  // borraría la trazabilidad del cobro. Se desactiva en su lugar.
  if (plan._count.members > 0 || plan._count.withdrawals > 0) {
    await prisma.membershipPlan.update({
      where: { id },
      data: { active: false, isDefault: false },
    });
    await audit({
      userId: session.user.id,
      actorEmail: session.user.email,
      action: "membership.plan.deactivate",
      entity: "MembershipPlan",
      entityId: id,
      metadata: { name: plan.name, reason: "in_use" },
    });
    revalidatePath("/administrador/configuracion");
    return { ok: true };
  }

  await prisma.membershipPlan.delete({ where: { id } });
  await audit({
    userId: session.user.id,
    actorEmail: session.user.email,
    action: "membership.plan.delete",
    entity: "MembershipPlan",
    entityId: id,
    metadata: { name: plan.name },
  });

  revalidatePath("/administrador/configuracion");
  return { ok: true };
}
