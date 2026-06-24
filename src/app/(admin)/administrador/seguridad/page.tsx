import QRCode from "qrcode";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { totpUri } from "@/lib/totp";
import { TotpEnrollClient } from "./enroll-client";
import { disableTotp } from "./actions";
import { SubmitWithSpinner } from "@/components/ui/submit-with-spinner";

export const metadata = { title: "Seguridad" };

export default async function SeguridadPage() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, totpEnabled: true, totpSecret: true, lastLoginAt: true },
  });
  if (!user) return null;

  let pendingUri: string | null = null;
  let pendingQr: string | null = null;
  let pendingSecret: string | null = null;
  if (!user.totpEnabled && user.totpSecret) {
    pendingSecret = user.totpSecret;
    pendingUri = totpUri(user.totpSecret, user.email);
    pendingQr = await QRCode.toDataURL(pendingUri, { margin: 1, width: 240 });
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Seguridad</h1>
        <p className="text-[var(--muted-foreground)]">
          Protegé tu cuenta de administrador con autenticación en dos pasos.
        </p>
      </div>

      <section className="card space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-xl font-semibold">Autenticación en dos pasos</h2>
          <span
            className={`text-xs px-2 py-1 rounded-full font-semibold ${
              user.totpEnabled
                ? "bg-[color-mix(in_oklab,var(--primary)_20%,transparent)] text-[var(--primary)]"
                : "bg-[var(--muted)] text-[var(--muted-foreground)]"
            }`}
          >
            {user.totpEnabled ? "Activa" : "Inactiva"}
          </span>
        </div>

        {user.totpEnabled ? (
          <form action={disableTotp} className="space-y-3">
            <p className="text-sm text-[var(--muted-foreground)]">
              Para desactivar 2FA ingresá tu contraseña. No recomendado.
            </p>
            <input
              type="password"
              name="password"
              className="input w-full"
              placeholder="Contraseña actual"
              required
            />
            <SubmitWithSpinner className="btn btn-ghost text-sm">
              Desactivar 2FA
            </SubmitWithSpinner>
          </form>
        ) : (
          <TotpEnrollClient
            pendingSecret={pendingSecret}
            pendingUri={pendingUri}
            pendingQr={pendingQr}
          />
        )}
      </section>

      {user.lastLoginAt && (
        <section className="card">
          <h2 className="text-sm font-medium uppercase tracking-wide text-[var(--muted-foreground)] mb-2">
            Último acceso
          </h2>
          <p className="tabular-nums">
            {new Intl.DateTimeFormat("es-UY", {
              dateStyle: "medium",
              timeStyle: "short",
            }).format(user.lastLoginAt)}
          </p>
        </section>
      )}
    </div>
  );
}
