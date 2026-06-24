"use client";

import { useActionState } from "react";
import {
  cambiarPasswordAction,
  type CambiarPasswordState,
} from "./actions";
import { PASSWORD_REQUIREMENTS } from "@/lib/validators";
import { SavingSpinner } from "@/components/ui/saving-spinner";

export function CambiarPasswordForm() {
  const [state, formAction, pending] = useActionState<
    CambiarPasswordState,
    FormData
  >(cambiarPasswordAction, null);

  return (
    <form action={formAction} className="space-y-4">
      <p className="text-sm text-[var(--muted-foreground)] bg-[var(--muted)] p-3 rounded-lg">
        {PASSWORD_REQUIREMENTS}
      </p>
      <div>
        <label className="block text-sm mb-1" htmlFor="current">
          Contraseña actual
        </label>
        <input
          id="current"
          name="current"
          type="password"
          className="input w-full"
          required
          autoComplete="current-password"
        />
        {state?.fieldErrors?.actual && (
          <p className="text-sm text-[var(--destructive)] mt-1">
            {state.fieldErrors.actual}
          </p>
        )}
      </div>
      <div>
        <label className="block text-sm mb-1" htmlFor="next">
          Nueva contraseña
        </label>
        <input
          id="next"
          name="next"
          type="password"
          minLength={8}
          className="input w-full"
          required
          autoComplete="new-password"
        />
        {state?.fieldErrors?.nueva && (
          <p className="text-sm text-[var(--destructive)] mt-1">
            {state.fieldErrors.nueva}
          </p>
        )}
      </div>
      <div>
        <label className="block text-sm mb-1" htmlFor="confirm">
          Repetir nueva contraseña
        </label>
        <input
          id="confirm"
          name="confirm"
          type="password"
          minLength={8}
          className="input w-full"
          required
          autoComplete="new-password"
        />
        {state?.fieldErrors?.confirmar && (
          <p className="text-sm text-[var(--destructive)] mt-1">
            {state.fieldErrors.confirmar}
          </p>
        )}
      </div>
      {state?.error && (
        <p className="text-sm text-[var(--destructive)]">{state.error}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="btn btn-primary w-full inline-flex items-center justify-center gap-2"
      >
        {pending && <SavingSpinner />}
        Cambiar contraseña
      </button>
    </form>
  );
}
