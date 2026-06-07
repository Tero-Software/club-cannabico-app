"use server";

import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { signIn } from "@/lib/auth";
import { audit } from "@/lib/audit";

const VISITOR_SESSION_TTL_MS = 60 * 60 * 1000;

export async function redeemVisitorInviteAction(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  if (!token) redirect("/visita/error?reason=not_found");

  const invite = await prisma.visitorInvite.findUnique({ where: { token } });
  if (!invite) redirect("/visita/error?reason=not_found");
  if (invite.usedAt) redirect("/visita/error?reason=used");
  if (invite.expiresAt < new Date()) redirect("/visita/error?reason=expired");

  const random = crypto.randomBytes(12).toString("base64url");
  const email = `visitante+${random.toLowerCase()}@clubcannabico.app`;
  const password = crypto.randomBytes(24).toString("base64url");
  const passwordHash = await bcrypt.hash(password, 12);

  let createdEmail: string | null = null;
  try {
    const created = await prisma.$transaction(async (tx) => {
      const fresh = await tx.visitorInvite.findUnique({ where: { token } });
      if (!fresh) throw new Error("not_found");
      if (fresh.usedAt) throw new Error("used");
      if (fresh.expiresAt < new Date()) throw new Error("expired");

      const user = await tx.user.create({
        data: {
          tenantId: fresh.tenantId,
          email,
          name: "Visitante",
          passwordHash,
          role: "VISITANTE",
          active: true,
          mustChangePassword: false,
          expiresAt: new Date(Date.now() + VISITOR_SESSION_TTL_MS),
        },
      });
      await tx.visitorInvite.update({
        where: { id: fresh.id },
        data: { usedAt: new Date(), userId: user.id },
      });
      return user;
    });
    createdEmail = created.email;

    await audit({
      userId: created.id,
      actorEmail: created.email,
      action: "visitor.invite.redeem",
      entity: "User",
      entityId: created.id,
    });
  } catch (err) {
    const reason =
      err instanceof Error && (err.message === "used" || err.message === "expired")
        ? err.message
        : "not_found";
    redirect(`/visita/error?reason=${reason}`);
  }

  await signIn("credentials", {
    email: createdEmail,
    password,
    redirectTo: "/socio",
  });
}
