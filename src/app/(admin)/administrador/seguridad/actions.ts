"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { auth, signOut } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateTotpSecret, verifyTotp, totpUri } from "@/lib/totp";
import { audit } from "@/lib/audit";

export type TotpSetupState =
  | { error?: string; secret?: string; uri?: string }
  | null;

export async function startTotpEnrollment(
  _prev: TotpSetupState,
  _fd: FormData,
): Promise<TotpSetupState> {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN")
    return { error: "No autorizado." };

  const secret = generateTotpSecret();
  await prisma.user.update({
    where: { id: session.user.id },
    data: { totpSecret: secret, totpEnabled: false },
  });
  const uri = totpUri(secret, session.user.email);
  return { secret, uri };
}

export type TotpConfirmState =
  | { error?: string; success?: boolean }
  | null;

export async function confirmTotpEnrollment(
  _prev: TotpConfirmState,
  formData: FormData,
): Promise<TotpConfirmState> {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN")
    return { error: "No autorizado." };

  const code = String(formData.get("code") ?? "").trim();
  if (!/^\d{6}$/.test(code)) return { error: "Código de 6 dígitos." };

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });
  if (!user?.totpSecret)
    return { error: "Generá primero el código de configuración." };

  if (!verifyTotp(user.totpSecret, code))
    return { error: "Código inválido. Volvé a intentar." };

  await prisma.user.update({
    where: { id: user.id },
    data: { totpEnabled: true },
  });
  await audit({
    userId: user.id,
    actorEmail: user.email,
    action: "auth.totp.enabled",
  });

  revalidatePath("/administrador/seguridad");
  await signOut({ redirect: false });
  redirect("/login");
}

export async function disableTotp(formData: FormData) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") return;

  const password = String(formData.get("password") ?? "");
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });
  if (!user) return;
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return;

  await prisma.user.update({
    where: { id: user.id },
    data: { totpEnabled: false, totpSecret: null },
  });
  await audit({
    userId: user.id,
    actorEmail: user.email,
    action: "auth.totp.disabled",
  });
  revalidatePath("/administrador/seguridad");
}
