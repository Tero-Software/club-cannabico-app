"use client";

import Image from "next/image";
import { useActionState } from "react";
import {
  startTotpEnrollment,
  confirmTotpEnrollment,
  type TotpSetupState,
  type TotpConfirmState,
} from "./actions";
import { SavingSpinner } from "@/components/ui/saving-spinner";

export function TotpEnrollClient({
  pendingSecret,
  pendingUri,
  pendingQr,
}: {
  pendingSecret: string | null;
  pendingUri: string | null;
  pendingQr: string | null;
}) {
  const [startState, startAction, starting] = useActionState<
    TotpSetupState,
    FormData
  >(startTotpEnrollment, null);
  const [confirmState, confirmAction, confirming] = useActionState<
    TotpConfirmState,
    FormData
  >(confirmTotpEnrollment, null);

  const qr = startState?.uri ? null : pendingQr;
  const secret = startState?.secret ?? pendingSecret;
  const uri = startState?.uri ?? pendingUri;

  if (!secret) {
    return (
      <form action={startAction} className="space-y-3">
        <p className="text-sm text-[var(--muted-foreground)]">
          Generá un secreto TOTP, escanealo con Google Authenticator, 1Password
          o similar, y confirmá con el código.
        </p>
        {startState?.error && (
          <p className="text-sm text-[var(--destructive)]">{startState.error}</p>
        )}
        <button
          type="submit"
          disabled={starting}
          className="btn btn-primary inline-flex items-center justify-center gap-2"
        >
          {starting && <SavingSpinner />}
          Configurar autenticador
        </button>
      </form>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row gap-5 items-start">
        {qr && (
          <div className="bg-white p-3 rounded-lg shrink-0">
            <Image
              src={qr}
              alt="Código QR 2FA"
              width={200}
              height={200}
              unoptimized
            />
          </div>
        )}
        <div className="space-y-2 flex-1 min-w-0">
          <p className="text-sm text-[var(--muted-foreground)]">
            Escaneá el QR o ingresá el secreto manualmente.
          </p>
          <div>
            <div className="text-xs uppercase tracking-wide text-[var(--muted-foreground)] mb-1">
              Secreto
            </div>
            <code className="block break-all bg-[var(--muted)] p-2 rounded text-sm">
              {secret}
            </code>
          </div>
          {uri && (
            <details className="text-xs">
              <summary className="cursor-pointer text-[var(--muted-foreground)]">
                Ver URI otpauth
              </summary>
              <code className="block break-all bg-[var(--muted)] p-2 rounded mt-2">
                {uri}
              </code>
            </details>
          )}
        </div>
      </div>

      <form action={confirmAction} className="space-y-3">
        <label htmlFor="code" className="label">
          Código de verificación
        </label>
        <input
          id="code"
          name="code"
          inputMode="numeric"
          pattern="[0-9]{6}"
          placeholder="123456"
          className="input tracking-[0.4em] text-center"
          required
          autoFocus
        />
        {confirmState?.error && (
          <p className="text-sm text-[var(--destructive)]">
            {confirmState.error}
          </p>
        )}
        <p className="text-xs text-[var(--muted-foreground)]">
          Al confirmar cerraremos tu sesión para que vuelvas a ingresar con 2FA.
        </p>
        <button
          type="submit"
          disabled={confirming}
          className="btn btn-primary inline-flex items-center justify-center gap-2"
        >
          {confirming && <SavingSpinner />}
          Activar 2FA
        </button>
      </form>
    </div>
  );
}
