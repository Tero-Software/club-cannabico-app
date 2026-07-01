"use client";

import { useActionState, useEffect, useState } from "react";
import { setDefaultPlanAction, type DefaultPlanState } from "./actions";
import { SavingSpinner } from "@/components/ui/saving-spinner";
import { formatMoney } from "@/lib/billing";

type Tier = { fromGrams: number; price: number };
type Plan = {
  id: string;
  name: string;
  monthlyPrice: number;
  tiers: Tier[];
};

export function CobroForm({
  plans,
  defaultPlanId,
}: {
  plans: Plan[];
  defaultPlanId: string | null;
}) {
  const [state, action, pending] = useActionState<DefaultPlanState, FormData>(
    setDefaultPlanAction,
    null,
  );
  const [value, setValue] = useState(defaultPlanId ?? "");
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    if (state && "ok" in state && state.ok) {
      setJustSaved(true);
      const t = setTimeout(() => setJustSaved(false), 2500);
      return () => clearTimeout(t);
    }
  }, [state]);

  const selected = plans.find((p) => p.id === value) ?? null;
  const error = state && "error" in state ? state.error : undefined;

  return (
    <form action={action} className="card flex flex-col gap-4">
      <div>
        <h3 className="text-sm font-medium">Membresía por defecto</h3>
        <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
          La que el club aplica a todo socio que no tenga una propia.
        </p>
      </div>

      {plans.length === 0 ? (
        <p className="text-sm text-[var(--muted-foreground)]">
          Todavía no hay membresías. Creá la primera abajo para poder fijar el cobro por defecto.
        </p>
      ) : (
        <>
          <div>
            <label htmlFor="default-plan" className="label">
              Plan por defecto
            </label>
            <select
              id="default-plan"
              name="planId"
              className="input"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            >
              <option value="">Sin cobro por defecto</option>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {formatMoney(p.monthlyPrice)}/mes
                </option>
              ))}
            </select>
          </div>

          {selected && (
            <div className="text-sm text-[var(--muted-foreground)] border border-[var(--border)] rounded-md p-3 space-y-0.5">
              <div>Cuota mensual: {formatMoney(selected.monthlyPrice)}</div>
              {selected.tiers
                .slice()
                .sort((a, b) => a.fromGrams - b.fromGrams)
                .map((t, i) => (
                  <div key={i}>
                    {t.fromGrams} g = {formatMoney(t.price)}
                    {t.fromGrams > 0 && ` (${formatMoney(t.price / t.fromGrams)}/g)`}
                  </div>
                ))}
            </div>
          )}

          {error && <p className="text-sm text-[var(--destructive)]">{error}</p>}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="btn btn-primary inline-flex items-center gap-2"
              disabled={pending}
            >
              {pending && <SavingSpinner />}
              Guardar
            </button>
            {justSaved && (
              <span className="text-sm text-[var(--muted-foreground)]">Guardado</span>
            )}
          </div>
        </>
      )}
    </form>
  );
}
