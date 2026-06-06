"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";

const perfilSchema = z.object({
  name: z.string().min(2).max(80),
  phone: z.string().max(30).optional().or(z.literal("")),
});

export async function updatePerfilAction(
  _prev: { ok?: boolean; error?: string } | null,
  formData: FormData,
) {
  const session = await auth();
  if (!session) return { error: "No autenticado." };

  const parsed = perfilSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone") || "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const before = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, phone: true },
  });

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: parsed.data.name,
      phone: parsed.data.phone || null,
    },
  });

  const changes: Record<string, { from: unknown; to: unknown }> = {};
  if (before && before.name !== parsed.data.name) {
    changes.name = { from: before.name, to: parsed.data.name };
  }
  const newPhone = parsed.data.phone || null;
  if (before && (before.phone ?? null) !== newPhone) {
    changes.phone = { from: before.phone ?? null, to: newPhone };
  }
  if (Object.keys(changes).length > 0) {
    await audit({
      userId: session.user.id,
      actorEmail: session.user.email,
      action: "perfil.update",
      entity: "User",
      entityId: session.user.id,
      metadata: { changes, isDemo: session.user.role === "VISITANTE" },
    });
  }

  revalidatePath("/socio/perfil");
  return { ok: true };
}
