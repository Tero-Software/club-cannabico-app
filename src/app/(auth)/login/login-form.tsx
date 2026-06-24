"use client";

import { useActionState } from "react";
import { loginAction, type FormState } from "../actions";
import { SavingSpinner } from "@/components/ui/saving-spinner";

export function LoginForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(
    loginAction,
    null,
  );
  const showTotp = !!state?.totpRequired;

  return (
    <form action={action} className="flex flex-col gap-4">
      <div>
        <label htmlFor="email" className="label">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="input"
        />
        {state?.fieldErrors?.email && (
          <p className="text-sm text-[var(--destructive)] mt-1">
            {state.fieldErrors.email}
          </p>
        )}
      </div>
      <div>
        <label htmlFor="password" className="label">
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="input"
        />
        {state?.fieldErrors?.password && (
          <p className="text-sm text-[var(--destructive)] mt-1">
            {state.fieldErrors.password}
          </p>
        )}
      </div>
      {showTotp && (
        <div>
          <label htmlFor="totp" className="label">
            Código 2FA
          </label>
          <input
            id="totp"
            name="totp"
            inputMode="numeric"
            pattern="[0-9]{6}"
            autoComplete="one-time-code"
            placeholder="123456"
            className="input tracking-[0.4em] text-center"
            autoFocus
          />
          <p className="text-xs text-[var(--muted-foreground)] mt-1">
            Ingresá el código de 6 dígitos de tu app autenticadora.
          </p>
        </div>
      )}
      {state?.error && (
        <div className="text-sm text-[var(--destructive)] bg-[color-mix(in_oklab,var(--destructive)_10%,transparent)] p-3 rounded-lg">
          {state.error}
        </div>
      )}
      <button
        type="submit"
        disabled={pending}
        className="btn btn-primary inline-flex items-center justify-center gap-2"
      >
        {pending && <SavingSpinner />}
        Ingresar
      </button>
    </form>
  );
}
