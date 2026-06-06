import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { redeemVisitorInviteAction } from "./actions";
import { AutoSubmit } from "./auto-submit";
import { SubmitButton } from "./submit-button";

export const metadata = { title: "Acceso de visitante" };
export const dynamic = "force-dynamic";

export default async function VisitaTokenPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const invite = await prisma.visitorInvite.findUnique({ where: { token } });
  if (!invite) redirect("/visita/error?reason=not_found");
  if (invite.usedAt) redirect("/visita/error?reason=used");
  if (invite.expiresAt < new Date()) redirect("/visita/error?reason=expired");

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <form action={redeemVisitorInviteAction} className="card max-w-md w-full text-center">
        <input type="hidden" name="token" value={token} />
        <h1 className="text-2xl font-semibold mb-2">Bienvenido</h1>
        <p className="text-[var(--muted-foreground)] mb-4">
          Estamos preparando tu acceso de visitante…
        </p>
        <SubmitButton />
        <AutoSubmit />
      </form>
    </div>
  );
}
