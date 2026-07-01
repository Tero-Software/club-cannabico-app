"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createFinanceEntryAction, type EntryState } from "./actions";
import { SavingSpinner } from "@/components/ui/saving-spinner";

export function NuevoMovimiento({ defaultDate }: { defaultDate: string }) {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<"INGRESO" | "EGRESO">("EGRESO");
  const [state, action, pending] = useActionState<EntryState, FormData>(
    createFinanceEntryAction,
    null,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state && "ok" in state && state.ok) {
      formRef.current?.reset();
      setOpen(false);
    }
  }, [state]);

  const fieldErrors = state && "error" in state ? state.fieldErrors : undefined;
  // Día 1 del mes en curso como fecha por defecto (defaultDate viene como YYYY-MM).
  const defaultDay = /^\d{4}-\d{2}$/.test(defaultDate) ? `${defaultDate}-01` : "";

  if (!open) {
    return (
      <div className="mb-6">
        <button type="button" className="btn btn-primary" onClick={() => setOpen(true)}>
          Nuevo movimiento
        </button>
      </div>
    );
  }

  return (
    <form action={action} ref={formRef} className="card flex flex-col gap-4 mb-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Nuevo movimiento</h3>
        <button type="button" className="btn btn-ghost text-sm" onClick={() => setOpen(false)} disabled={pending}>
          Cancelar
        </button>
      </div>

      <input type="hidden" name="kind" value={kind} />
      <div>
        <span className="label">Tipo</span>
        <div className="flex gap-2 mt-1">
          <button
            type="button"
            onClick={() => setKind("INGRESO")}
            className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
              kind === "INGRESO"
                ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                : "border-[var(--border)] hover:bg-[var(--muted)]"
            }`}
          >
            Ingreso
          </button>
          <button
            type="button"
            onClick={() => setKind("EGRESO")}
            className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
              kind === "EGRESO"
                ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                : "border-[var(--border)] hover:bg-[var(--muted)]"
            }`}
          >
            Egreso
          </button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="fe-date" className="label">Fecha</label>
          <input id="fe-date" name="date" type="date" defaultValue={defaultDay} className="input" />
          {fieldErrors?.date && <p className="text-sm text-[var(--destructive)] mt-1">{fieldErrors.date}</p>}
        </div>
        <div>
          <label htmlFor="fe-amount" className="label">Monto (pesos)</label>
          <input
            id="fe-amount"
            name="amount"
            type="number"
            min={0}
            step="0.01"
            onFocus={(e) => e.target.select()}
            className="input"
          />
          {fieldErrors?.amount && <p className="text-sm text-[var(--destructive)] mt-1">{fieldErrors.amount}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="fe-category" className="label">Rubro</label>
        <input
          id="fe-category"
          name="category"
          placeholder="Insumos, Alquiler, Donación…"
          className="input"
          maxLength={120}
        />
        {fieldErrors?.category && <p className="text-sm text-[var(--destructive)] mt-1">{fieldErrors.category}</p>}
      </div>

      <div>
        <label htmlFor="fe-description" className="label">Descripción</label>
        <input id="fe-description" name="description" className="input" maxLength={500} />
        {fieldErrors?.description && (
          <p className="text-sm text-[var(--destructive)] mt-1">{fieldErrors.description}</p>
        )}
      </div>

      <button type="submit" className="btn btn-primary inline-flex items-center gap-2" disabled={pending}>
        {pending && <SavingSpinner />}
        Guardar
      </button>
    </form>
  );
}
