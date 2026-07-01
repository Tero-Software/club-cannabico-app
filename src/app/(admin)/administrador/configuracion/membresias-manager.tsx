"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import {
  createPlanAction,
  updatePlanAction,
  deletePlanAction,
  type PlanState,
} from "./membresias-actions";
import { SavingSpinner } from "@/components/ui/saving-spinner";
import { formatMoney } from "@/lib/billing";

type Tier = { fromGrams: number; price: number };

type Plan = {
  id: string;
  name: string;
  monthlyPrice: number;
  isDefault: boolean;
  active: boolean;
  membersCount: number;
  tiers: Tier[];
};

export function MembresiasManager({ plans }: { plans: Plan[] }) {
  const [editing, setEditing] = useState<Plan | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <div className="space-y-6">
      {!creating && !editing && (
        <div className="flex justify-end">
          <button type="button" className="btn btn-primary" onClick={() => setCreating(true)}>
            Nueva membresía
          </button>
        </div>
      )}

      {creating && (
        <PlanForm mode="create" onDone={() => setCreating(false)} onCancel={() => setCreating(false)} />
      )}

      {editing && (
        <PlanForm
          mode="edit"
          plan={editing}
          onDone={() => setEditing(null)}
          onCancel={() => setEditing(null)}
        />
      )}

      {plans.length === 0 && !creating ? (
        <div className="card text-center text-[var(--muted-foreground)] py-12">
          Todavía no hay membresías. Creá la primera para empezar a cobrar.
        </div>
      ) : (
        <div className="space-y-3">
          {plans.map((p) => (
            <PlanCard key={p.id} plan={p} onEdit={() => setEditing(p)} disabled={!!editing || creating} />
          ))}
        </div>
      )}
    </div>
  );
}

function PlanCard({ plan, onEdit, disabled }: { plan: Plan; onEdit: () => void; disabled: boolean }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    const inUse = plan.membersCount > 0;
    const msg = inUse
      ? `"${plan.name}" tiene socios asignados o retiros cobrados. Se desactivará (no se elimina). ¿Continuar?`
      : `¿Eliminar la membresía "${plan.name}"?`;
    if (!confirm(msg)) return;
    setError(null);
    const fd = new FormData();
    fd.set("id", plan.id);
    startTransition(async () => {
      const res = await deletePlanAction(fd);
      if (res && "error" in res && res.error) setError(res.error);
    });
  }

  return (
    <div className={`card${plan.active ? "" : " opacity-60"}`}>
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-medium">{plan.name}</span>
            {plan.isDefault && <span className="badge badge-aprobado">Por defecto</span>}
            {!plan.active && <span className="badge badge-rechazado">Inactivo</span>}
          </div>
          <div className="text-sm text-[var(--muted-foreground)]">
            Cuota mensual: {formatMoney(plan.monthlyPrice)}
          </div>
          {plan.tiers.length > 0 && (
            <ul className="text-sm space-y-0.5 mt-1">
              {plan.tiers
                .slice()
                .sort((a, b) => a.fromGrams - b.fromGrams)
                .map((t, i) => (
                  <li key={i}>
                    {t.fromGrams} g = {formatMoney(t.price)}
                    {t.fromGrams > 0 && (
                      <span className="text-[var(--muted-foreground)]">
                        {" "}({formatMoney(t.price / t.fromGrams)}/g)
                      </span>
                    )}
                  </li>
                ))}
            </ul>
          )}
          {plan.membersCount > 0 && (
            <div className="text-xs text-[var(--muted-foreground)] mt-2">
              {plan.membersCount} socio{plan.membersCount === 1 ? "" : "s"} con esta membresía
            </div>
          )}
        </div>
        <div className="flex gap-2 shrink-0">
          <button type="button" className="btn btn-secondary text-sm" onClick={onEdit} disabled={disabled}>
            Editar
          </button>
          <button
            type="button"
            className="btn btn-destructive text-sm inline-flex items-center gap-2"
            onClick={handleDelete}
            disabled={pending || disabled}
          >
            {pending && <SavingSpinner />}
            {plan.membersCount > 0 ? "Desactivar" : "Eliminar"}
          </button>
        </div>
      </div>
      {error && <p className="text-xs text-[var(--destructive)] mt-2">{error}</p>}
    </div>
  );
}

function PlanForm({
  mode,
  plan,
  onDone,
  onCancel,
}: {
  mode: "create" | "edit";
  plan?: Plan;
  onDone: () => void;
  onCancel: () => void;
}) {
  const serverAction = mode === "create" ? createPlanAction : updatePlanAction;
  const [state, action, pending] = useActionState<PlanState, FormData>(serverAction, null);

  const [tiers, setTiers] = useState<Tier[]>(plan?.tiers ?? [{ fromGrams: 1, price: 0 }]);

  useEffect(() => {
    if (state && "ok" in state && state.ok) onDone();
  }, [state, onDone]);

  const fieldErrors = state && "error" in state ? state.fieldErrors : undefined;
  const generalError = state && "error" in state ? state.error : undefined;

  const setTier = (i: number, key: keyof Tier, value: number) =>
    setTiers((prev) => prev.map((t, idx) => (idx === i ? { ...t, [key]: value } : t)));
  const addTier = () => setTiers((prev) => [...prev, { fromGrams: 0, price: 0 }]);
  const removeTier = (i: number) => setTiers((prev) => prev.filter((_, idx) => idx !== i));

  return (
    <form action={action} className="card flex flex-col gap-5">
      <h3 className="text-lg font-semibold">
        {mode === "create" ? "Nueva membresía" : "Editar membresía"}
      </h3>

      {plan && <input type="hidden" name="id" value={plan.id} />}
      <input type="hidden" name="tiers" value={JSON.stringify(tiers)} />

      <div>
        <label htmlFor="name" className="label">Nombre</label>
        <input
          id="name"
          name="name"
          defaultValue={plan?.name ?? ""}
          placeholder="Membresía normal"
          className="input"
          maxLength={120}
        />
        {fieldErrors?.name && <p className="text-sm text-[var(--destructive)] mt-1">{fieldErrors.name}</p>}
      </div>

      <div>
        <label htmlFor="monthlyPrice" className="label">Cuota mensual (pesos)</label>
        <p className="text-xs text-[var(--muted-foreground)] mb-1">
          Lo que paga el socio cuando retira el cupo completo del mes.
        </p>
        <input
          id="monthlyPrice"
          name="monthlyPrice"
          type="number"
          min={0}
          step="0.01"
          defaultValue={plan?.monthlyPrice ?? ""}
          onFocus={(e) => e.target.select()}
          className="input"
        />
        {fieldErrors?.monthlyPrice && (
          <p className="text-sm text-[var(--destructive)] mt-1">{fieldErrors.monthlyPrice}</p>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="label mb-0">Franjas por gramos</span>
          <button type="button" className="btn btn-secondary text-sm" onClick={addTier}>
            Agregar franja
          </button>
        </div>
        <p className="text-xs text-[var(--muted-foreground)] mb-2">
          Para retiros menores al cupo del mes. Cada franja fija un precio de referencia
          para una cantidad de gramos; el cobro es proporcional (precio por gramo × gramos
          retirados), según la franja que el retiro supere. Al llegar al cupo se cobra la
          cuota mensual.
        </p>
        <div className="space-y-2">
          {tiers.map((t, i) => {
            const perGram =
              t.fromGrams > 0 ? t.price / t.fromGrams : null;
            return (
            <div key={i} className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={0}
                  step="any"
                  value={t.fromGrams}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setTier(i, "fromGrams", Number(e.target.value))}
                  className="input w-24"
                />
                <span className="text-sm text-[var(--muted-foreground)]">g</span>
              </div>
              <span className="text-sm text-[var(--muted-foreground)]">→ $</span>
              <input
                type="number"
                min={0}
                step="0.01"
                value={t.price}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setTier(i, "price", Number(e.target.value))}
                className="input w-32"
              />
              {perGram != null && perGram > 0 && (
                <span className="text-xs text-[var(--muted-foreground)] whitespace-nowrap">
                  = {formatMoney(perGram)}/g
                </span>
              )}
              <button
                type="button"
                className="text-[var(--destructive)] text-sm px-2"
                onClick={() => removeTier(i)}
                aria-label="Quitar franja"
              >
                ✕
              </button>
            </div>
            );
          })}
        </div>
        {fieldErrors?.tiers && <p className="text-sm text-[var(--destructive)] mt-1">{fieldErrors.tiers}</p>}
      </div>

      <p className="text-xs text-[var(--muted-foreground)]">
        La membresía por defecto del club se elige arriba.
      </p>

      {generalError && !fieldErrors && (
        <p className="text-sm text-[var(--destructive)]">{generalError}</p>
      )}

      <div className="flex gap-2">
        <button type="submit" className="btn btn-primary inline-flex items-center gap-2" disabled={pending}>
          {pending && <SavingSpinner />}
          Guardar
        </button>
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={pending}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
