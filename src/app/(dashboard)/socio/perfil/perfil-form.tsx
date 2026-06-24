"use client";

import { useActionState } from "react";
import { updatePerfilAction } from "./actions";
import { SavingSpinner } from "@/components/ui/saving-spinner";

export function PerfilForm({
  initialName,
  initialPhone,
  email,
}: {
  initialName: string;
  initialPhone: string;
  email: string;
}) {
  const [state, action, pending] = useActionState(updatePerfilAction, null);

  return (
    <form action={action} className="flex flex-col gap-4">
      <div>
        <label htmlFor="name" className="label">
          Nombre
        </label>
        <input
          id="name"
          name="name"
          defaultValue={initialName}
          required
          className="input"
        />
      </div>
      <div>
        <label htmlFor="email" className="label">
          Email
        </label>
        <input
          id="email"
          value={email}
          readOnly
          disabled
          className="input opacity-60"
        />
      </div>
      <div>
        <label htmlFor="phone" className="label">
          Teléfono
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          defaultValue={initialPhone}
          className="input"
        />
      </div>
      {state?.error && (
        <div className="text-sm text-[var(--destructive)]">{state.error}</div>
      )}
      {state?.ok && (
        <div className="text-sm text-[var(--success)]">
          ✓ Perfil actualizado
        </div>
      )}
      <button
        type="submit"
        disabled={pending}
        className="btn btn-primary inline-flex items-center justify-center gap-2"
      >
        {pending && <SavingSpinner />}
        Guardar cambios
      </button>
    </form>
  );
}
