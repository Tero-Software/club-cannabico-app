"use client";

import { useActionState, useEffect, useState } from "react";
import {
  editSocioAction,
  type EditSocioState,
} from "../actions";
import { SavingSpinner } from "@/components/ui/saving-spinner";

type Socio = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
};

export function DatosEditor({
  socio,
  initialEditing = false,
}: {
  socio: Socio;
  initialEditing?: boolean;
}) {
  const [editing, setEditing] = useState(initialEditing);
  const [state, formAction, pending] = useActionState<EditSocioState, FormData>(
    editSocioAction,
    null,
  );

  useEffect(() => {
    if (state?.ok) setEditing(false);
  }, [state]);

  if (!editing) {
    return (
      <div className="card mb-8">
        <div className="flex items-start justify-between gap-3 mb-4">
          <h2 className="text-xl font-semibold">Datos del socio</h2>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="btn btn-secondary text-sm"
          >
            Editar
          </button>
        </div>
        <dl className="grid sm:grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-[var(--muted-foreground)] mb-1">Nombre</dt>
            <dd className="font-medium">{socio.name}</dd>
          </div>
          <div>
            <dt className="text-[var(--muted-foreground)] mb-1">Email</dt>
            <dd className="font-medium">{socio.email}</dd>
          </div>
          <div>
            <dt className="text-[var(--muted-foreground)] mb-1">Teléfono</dt>
            <dd className="font-medium">{socio.phone || "—"}</dd>
          </div>
        </dl>
      </div>
    );
  }

  return (
    <form action={formAction} className="card mb-8 flex flex-col gap-3">
      <input type="hidden" name="id" value={socio.id} />
      <div className="flex items-start justify-between gap-3 mb-2">
        <h2 className="text-xl font-semibold">Editar datos</h2>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="btn btn-ghost text-sm"
          disabled={pending}
        >
          Cancelar
        </button>
      </div>
      <div>
        <label htmlFor="es-name" className="label">Nombre</label>
        <input
          id="es-name"
          name="name"
          required
          defaultValue={socio.name}
          className="input"
        />
        {state?.fieldErrors?.name && (
          <p className="text-sm text-[var(--destructive)] mt-1">
            {state.fieldErrors.name}
          </p>
        )}
      </div>
      <div>
        <label htmlFor="es-email" className="label">Email</label>
        <input
          id="es-email"
          name="email"
          type="email"
          required
          defaultValue={socio.email}
          className="input"
        />
        {state?.fieldErrors?.email && (
          <p className="text-sm text-[var(--destructive)] mt-1">
            {state.fieldErrors.email}
          </p>
        )}
      </div>
      <div>
        <label htmlFor="es-phone" className="label">Teléfono</label>
        <input
          id="es-phone"
          name="phone"
          defaultValue={socio.phone ?? ""}
          className="input"
        />
        {state?.fieldErrors?.phone && (
          <p className="text-sm text-[var(--destructive)] mt-1">
            {state.fieldErrors.phone}
          </p>
        )}
      </div>
      {state?.error && (
        <p className="text-sm text-[var(--destructive)]">{state.error}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="btn btn-primary inline-flex items-center justify-center gap-2"
      >
        {pending && <SavingSpinner />}
        Aceptar
      </button>
    </form>
  );
}
