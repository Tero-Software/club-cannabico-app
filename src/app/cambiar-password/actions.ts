"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { cambiarPasswordSchema } from "@/lib/validators";
import { audit } from "@/lib/audit";

export type CambiarPasswordState =
  | { error?: string; fieldErrors?: Record<string, string> }
  | null
  | undefined;

const PASSWORD_CHANGE_WINDOW_MIN = 15;
const PASSWORD_CHANGE_MAX_FAILS = 10;

export async function cambiarPasswordAction(
  _prev: CambiarPasswordState,
  formData: FormData,
): Promise<CambiarPasswordState> {
  const session = await auth();
  if (!session) return { error: "No autenticado." };

  const parsed = cambiarPasswordSchema.safeParse({
    actual: String(formData.get("current") ?? ""),
    nueva: String(formData.get("next") ?? ""),
    confirmar: String(formData.get("confirm") ?? ""),
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !fieldErrors[key])
        fieldErrors[key] = issue.message;
    }
    return { fieldErrors };
  }

  const since = new Date(Date.now() - PASSWORD_CHANGE_WINDOW_MIN * 60_000);
  const recentFails = await prisma.auditLog.count({
    where: {
      userId: session.user.id,
      action: "auth.password_change.fail",
      createdAt: { gte: since },
    },
  });
  if (recentFails >= PASSWORD_CHANGE_MAX_FAILS) {
    return { error: "Demasiados intentos. Probá en unos minutos." };
  }

  const { actual, nueva } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });
  if (!user) return { error: "Usuario no encontrado." };

  const valid = await bcrypt.compare(actual, user.passwordHash);
  if (!valid) {
    await audit({
      userId: user.id,
      actorEmail: user.email,
      action: "auth.password_change.fail",
    });
    return { fieldErrors: { actual: "Contraseña actual incorrecta." } };
  }

  const passwordHash = await bcrypt.hash(nueva, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, mustChangePassword: false },
  });
  await audit({
    userId: user.id,
    actorEmail: user.email,
    action: "auth.password_change.success",
  });

  redirect(session.user.role === "ADMIN" ? "/administrador" : "/socio");
}
