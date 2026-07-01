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

const PATH = "/administrador/directiva/finanzas";

const entrySchema = z.object({
  date: z.string().min(1, "Fecha requerida"),
  kind: z.enum(["INGRESO", "EGRESO"]),
  category: z.string().trim().min(1, "Rubro requerido").max(120),
  description: z.string().trim().min(1, "Descripción requerida").max(500),
  amount: z
    .number()
    .positive("Monto debe ser mayor a 0")
    .max(1000000000)
    .multipleOf(0.01, "Hasta dos decimales"),
});

export type EntryState =
  | { ok?: true; error?: string; fieldErrors?: Record<string, string> }
  | null;

export async function createFinanceEntryAction(
  _prev: EntryState,
  fd: FormData,
): Promise<EntryState> {
  const session = await requireAdmin();
  const tenantId = session.user.tenantId;

  const parsed = entrySchema.safeParse({
    date: String(fd.get("date") ?? ""),
    kind: String(fd.get("kind") ?? ""),
    category: String(fd.get("category") ?? ""),
    description: String(fd.get("description") ?? ""),
    amount: Number(fd.get("amount")),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { error: "Revisá los campos", fieldErrors };
  }

  const date = new Date(parsed.data.date);
  if (Number.isNaN(date.getTime())) {
    return { error: "Revisá los campos", fieldErrors: { date: "Fecha inválida" } };
  }

  const entry = await prisma.financeEntry.create({
    data: {
      tenantId,
      date,
      kind: parsed.data.kind,
      category: parsed.data.category,
      description: parsed.data.description,
      amount: parsed.data.amount,
      createdById: session.user.id,
    },
  });

  await audit({
    userId: session.user.id,
    actorEmail: session.user.email,
    action: "finance.entry.create",
    entity: "FinanceEntry",
    entityId: entry.id,
    metadata: { kind: parsed.data.kind, amount: parsed.data.amount, category: parsed.data.category },
  });

  revalidatePath(PATH);
  return { ok: true };
}

export async function deleteFinanceEntryAction(fd: FormData): Promise<EntryState> {
  const session = await requireAdmin();
  const tenantId = session.user.tenantId;
  const id = String(fd.get("id") ?? "");

  const entry = await prisma.financeEntry.findFirst({
    where: { id, tenantId },
    select: { id: true, withdrawalId: true, kind: true, amount: true },
  });
  if (!entry) return { error: "Movimiento no encontrado" };

  // Los ingresos que vienen de un retiro cobrado no se borran desde el libro:
  // su origen es el retiro. Para anularlos se cambia la forma de pago del retiro.
  if (entry.withdrawalId) {
    return { error: "Este ingreso proviene de un retiro cobrado. Modificalo desde el retiro." };
  }

  await prisma.financeEntry.delete({ where: { id } });

  await audit({
    userId: session.user.id,
    actorEmail: session.user.email,
    action: "finance.entry.delete",
    entity: "FinanceEntry",
    entityId: id,
    metadata: { kind: entry.kind, amount: entry.amount },
  });

  revalidatePath(PATH);
  return { ok: true };
}
