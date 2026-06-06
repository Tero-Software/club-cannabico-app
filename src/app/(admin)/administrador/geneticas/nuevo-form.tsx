"use client";

import { useActionState, useEffect, useRef } from "react";
import type { GeneticaFormState } from "./actions";
import { PhotosEditor } from "./photos-editor";
import { SavingSpinner } from "@/components/saving-spinner";

type Action = (prev: GeneticaFormState, fd: FormData) => Promise<GeneticaFormState>;

export function NuevaGeneticaForm({
  action,
  onCreated,
}: {
  action: Action;
  onCreated?: () => void;
}) {
  const [state, formAction, pending] = useActionState<GeneticaFormState, FormData>(
    action,
    null,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) {
      formRef.current?.reset();
      onCreated?.();
    }
  }, [state, onCreated]);

  return (
    <form action={formAction} ref={formRef} className="flex flex-col gap-3">
      <div>
        <label htmlFor="np-name" className="label">Nombre</label>
        <input id="np-name" name="name" required className="input" placeholder="Ej: Blueberry" />
        {state?.fieldErrors?.name && (
          <p className="text-sm text-[var(--destructive)] mt-1">{state.fieldErrors.name}</p>
        )}
      </div>
      <div>
        <label htmlFor="np-bank" className="label">Banco</label>
        <input id="np-bank" name="bank" className="input" placeholder="Ej: BSF" />
      </div>
      <div>
        <label htmlFor="np-desc" className="label">Descripción</label>
        <textarea id="np-desc" name="description" rows={3} className="input" />
      </div>
      <PhotosEditor initial={[]} />
      <div>
        <label htmlFor="np-src" className="label">URL de origen</label>
        <input id="np-src" name="sourceUrl" type="url" className="input" placeholder="https://..." />
        {state?.fieldErrors?.sourceUrl && (
          <p className="text-sm text-[var(--destructive)] mt-1">{state.fieldErrors.sourceUrl}</p>
        )}
      </div>
      <div>
        <label htmlFor="np-stock" className="label">Stock inicial (g)</label>
        <input id="np-stock" name="stock" type="number" step="0.1" min="0" defaultValue="0" className="input" />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="active" defaultChecked />
        Activo
      </label>
      {state?.ok && <p className="text-sm text-[var(--success)]">✓ Genética creada</p>}
      <button
        type="submit"
        disabled={pending}
        className="btn btn-primary inline-flex items-center justify-center gap-2"
      >
        {pending && <SavingSpinner />}
        Crear genética
      </button>
    </form>
  );
}
