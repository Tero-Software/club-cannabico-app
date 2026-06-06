"use server";

import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { invalidateClubConfig } from "@/lib/config";

const schema = z.object({
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

  await prisma.clubConfig.upsert({
    where: { id: "singleton" },
    update: parsed.data,
    create: { id: "singleton", ...parsed.data },
  });

  invalidateClubConfig();
  return { ok: true };
}
