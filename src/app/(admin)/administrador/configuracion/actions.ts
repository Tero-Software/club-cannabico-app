"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { invalidateClubConfig } from "@/lib/config";
import { audit } from "@/lib/audit";

// Texto opcional de presentación: cadena vacía -> null para no guardar "".
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v === "" ? null : v))
    .nullable();

const schema = z.object({
  city: optionalText(120),
  tagline: optionalText(200),
  description: optionalText(2000),
  workingDays: z.array(z.number().int().min(0).max(6)).min(1, "Seleccioná al menos un día"),
  timeSlots: z.array(z.string().regex(/^\d{2}:\d{2}-\d{2}:\d{2}$/, "Formato HH:MM-HH:MM")).min(1, "Agregá al menos una franja"),
  maxGramsPerMonth: z.number().int().positive().max(10000),
  minGramsPerWithdrawal: z.number().int().positive().max(10000),
  minGramsPerStrain: z.number().int().positive().max(10000),
  gramsStep: z.number().int().positive().max(1000),
});

export type ConfigState =
  | { ok: true }
  | { error: string; fieldErrors?: Partial<Record<keyof z.infer<typeof schema>, string>> }
  | null;

export async function updateClubConfigAction(
  _prev: ConfigState,
  fd: FormData,
): Promise<ConfigState> {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return { error: "No autorizado" };
  }

  const workingDays = fd.getAll("workingDays").map((v) => Number(v));
  const timeSlots = String(fd.get("timeSlots") ?? "")
    .split(/\s*[,\n]\s*/)
    .map((s) => s.trim())
    .filter(Boolean);

  const parsed = schema.safeParse({
    city: String(fd.get("city") ?? ""),
    tagline: String(fd.get("tagline") ?? ""),
    description: String(fd.get("description") ?? ""),
    workingDays,
    timeSlots,
    maxGramsPerMonth: Number(fd.get("maxGramsPerMonth")),
    minGramsPerWithdrawal: Number(fd.get("minGramsPerWithdrawal")),
    minGramsPerStrain: Number(fd.get("minGramsPerStrain")),
    gramsStep: Number(fd.get("gramsStep")),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !fieldErrors[key]) {
        fieldErrors[key] = issue.message;
      }
    }
    return { error: "Revisá los campos", fieldErrors };
  }

  if (parsed.data.minGramsPerWithdrawal > parsed.data.maxGramsPerMonth) {
    return { error: "El mínimo por retiro no puede superar el cupo mensual" };
  }
  if (parsed.data.minGramsPerStrain > parsed.data.minGramsPerWithdrawal) {
    return { error: "El mínimo por variedad no puede superar el mínimo por retiro" };
  }

  await prisma.tenant.update({
    where: { id: session.user.tenantId },
    data: parsed.data,
  });

  invalidateClubConfig(session.user.tenantId);
  return { ok: true };
}

// Actualización parcial de un solo parámetro del club. La edición de
// configuración es campo por campo (cada uno con su lápiz y su guardar), así que
// se valida y guarda solo el campo tocado, respetando las reglas cruzadas.
const partialSchemas = {
  city: optionalText(120),
  tagline: optionalText(200),
  description: optionalText(2000),
  workingDays: schema.shape.workingDays,
  timeSlots: schema.shape.timeSlots,
  maxGramsPerMonth: schema.shape.maxGramsPerMonth,
  minGramsPerWithdrawal: schema.shape.minGramsPerWithdrawal,
  minGramsPerStrain: schema.shape.minGramsPerStrain,
  gramsStep: schema.shape.gramsStep,
  cobroExcedente: z.enum(["PROPORCIONAL", "FRANJA_MAS_EXCEDENTE"]),
} as const;

type ConfigField = keyof typeof partialSchemas;

export type FieldUpdateState = { ok?: true; error?: string } | null;

export async function updateClubFieldAction(
  _prev: FieldUpdateState,
  fd: FormData,
): Promise<FieldUpdateState> {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return { error: "No autorizado" };
  }
  const tenantId = session.user.tenantId;

  const field = String(fd.get("field") ?? "") as ConfigField;
  const fieldSchema = partialSchemas[field];
  if (!fieldSchema) return { error: "Campo inválido" };

  // El valor llega distinto según el tipo del campo.
  let raw: unknown;
  if (field === "workingDays") {
    raw = fd.getAll("value").map((v) => Number(v));
  } else if (field === "timeSlots") {
    raw = fd
      .getAll("value")
      .map((v) => String(v).trim())
      .filter(Boolean);
  } else if (
    field === "maxGramsPerMonth" ||
    field === "minGramsPerWithdrawal" ||
    field === "minGramsPerStrain" ||
    field === "gramsStep"
  ) {
    raw = Number(fd.get("value"));
  } else {
    raw = String(fd.get("value") ?? "");
  }

  const parsed = fieldSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Valor inválido" };
  }

  // Reglas cruzadas: al cambiar un límite, se valida contra los otros ya guardados.
  const current = await prisma.tenant.findUniqueOrThrow({
    where: { id: tenantId },
    select: {
      maxGramsPerMonth: true,
      minGramsPerWithdrawal: true,
      minGramsPerStrain: true,
    },
  });
  const next = { ...current, [field]: parsed.data as number };
  if (
    (field === "maxGramsPerMonth" || field === "minGramsPerWithdrawal") &&
    next.minGramsPerWithdrawal > next.maxGramsPerMonth
  ) {
    return { error: "El mínimo por retiro no puede superar el cupo mensual" };
  }
  if (
    (field === "minGramsPerWithdrawal" || field === "minGramsPerStrain") &&
    next.minGramsPerStrain > next.minGramsPerWithdrawal
  ) {
    return { error: "El mínimo por variedad no puede superar el mínimo por retiro" };
  }

  await prisma.tenant.update({
    where: { id: tenantId },
    data: { [field]: parsed.data },
  });

  invalidateClubConfig(tenantId);
  revalidatePath("/administrador/configuracion");
  return { ok: true };
}

// Fija el plan de membresía por defecto del club (el setting general de cobro).
// Se aplica a todo socio sin plan propio. Vacío = el club no cobra por defecto.
export type DefaultPlanState = { ok?: true; error?: string } | null;

export async function setDefaultPlanAction(
  _prev: DefaultPlanState,
  fd: FormData,
): Promise<DefaultPlanState> {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return { error: "No autorizado" };
  }
  const tenantId = session.user.tenantId;
  const planId = String(fd.get("planId") ?? "") || null;

  if (planId) {
    const plan = await prisma.membershipPlan.findFirst({
      where: { id: planId, tenantId, active: true },
      select: { id: true },
    });
    if (!plan) return { error: "Plan no disponible" };
  }

  await prisma.$transaction(async (tx) => {
    await tx.membershipPlan.updateMany({
      where: { tenantId, isDefault: true },
      data: { isDefault: false },
    });
    if (planId) {
      await tx.membershipPlan.update({ where: { id: planId }, data: { isDefault: true } });
    }
  });

  await audit({
    userId: session.user.id,
    actorEmail: session.user.email,
    action: "membership.default.set",
    entity: "MembershipPlan",
    entityId: planId ?? undefined,
    metadata: { planId },
  });

  revalidatePath("/administrador/configuracion");
  return { ok: true };
}
