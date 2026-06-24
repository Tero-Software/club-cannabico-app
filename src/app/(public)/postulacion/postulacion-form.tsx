"use client";

import { useActionState } from "react";
import {
  crearPostulacionAction,
  type PostulacionFormState,
} from "./actions";
import { SavingSpinner } from "@/components/ui/saving-spinner";

export function PostulacionForm() {
  const [state, action, pending] = useActionState<
    PostulacionFormState,
    FormData
  >(crearPostulacionAction, null);

  if (state?.ok) {
    return (
      <div className="card">
        <h2 className="text-lg font-medium mb-2">Postulación recibida</h2>
        <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
          Gracias. Revisamos las postulaciones en orden de llegada y te
          contactamos por email cuando haya una respuesta.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <Field
        name="nombre"
        label="Nombre y apellido"
        type="text"
        required
        autoComplete="name"
        error={state?.fieldErrors?.name}
      />
      <Field
        name="email"
        label="Email"
        type="email"
        required
        autoComplete="email"
        error={state?.fieldErrors?.email}
      />
      <Field
        name="telefono"
        label="Teléfono"
        type="tel"
        required
        autoComplete="tel"
        error={state?.fieldErrors?.phone}
      />
      <div>
        <label htmlFor="mensaje" className="label">
          Mensaje (opcional)
        </label>
        <textarea
          id="mensaje"
          name="mensaje"
          rows={4}
          maxLength={800}
          className="input"
        />
        {state?.fieldErrors?.message && (
          <p className="text-sm text-[var(--destructive)] mt-1">
            {state.fieldErrors.message}
          </p>
        )}
      </div>
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
        Enviar postulación
      </button>
    </form>
  );
}

function Field({
  name,
  label,
  type,
  required,
  autoComplete,
  error,
}: {
  name: string;
  label: string;
  type: string;
  required?: boolean;
  autoComplete?: string;
  error?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="label">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        className="input"
      />
      {error && (
        <p className="text-sm text-[var(--destructive)] mt-1">{error}</p>
      )}
    </div>
  );
}
