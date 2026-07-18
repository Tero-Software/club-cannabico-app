"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import {
  createPlanAction,
  updatePlanAction,
  deletePlanAction,
  type PlanState,
} from "./membresias-actions";
import { setDefaultPlanAction, updateClubFieldAction, type DefaultPlanState } from "./actions";
import { SavingSpinner } from "@/components/ui/saving-spinner";
import { PencilIcon } from "@/components/ui/icons";
import { formatMoney } from "@/lib/billing";

type Tier = { fromGrams: number; price: number };

// Franjas fijas por gramos que se pueden cargar (todas opcionales).
const FRANJAS_GRAMOS = [1, 10, 20, 40];

type Plan = {
  id: string;
  name: string;
  isDefault: boolean;
  active: boolean;
  membersCount: number;
  tiers: Tier[];
};

export function MembresiasManager({
  plans,
  defaultPlanId,
  cobroExcedente,
}: {
  plans: Plan[];
  defaultPlanId: string | null;
  cobroExcedente: "PROPORCIONAL" | "FRANJA_MAS_EXCEDENTE";
}) {
  // Id del plan que está en edición inline, o "new" al crear, o null.
  const [editing, setEditing] = useState<string | "new" | null>(null);

  return (
    <div className="space-y-6">
      <DefaultPlanCard
        plans={plans}
        defaultPlanId={defaultPlanId}
        cobroExcedente={cobroExcedente}
      />

      {/* Planes: título + botón "Nuevo plan" como primera fila, y cada plan como
          fila, todo en una sola card dividida por líneas finitas. */}
      <div className="card p-0 [&>*+*]:border-t [&>*+*]:border-[var(--border-subtle)]">
        <div className="flex items-start justify-between gap-3 px-5 py-3">
          <div>
            <h3 className="text-sm font-medium">Planes</h3>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
              Cada plan define cuánto se le cobra al socio por lo que retira. Sirven
              cuando hay producto de distintas calidades o socios preferentes.
            </p>
          </div>
          {editing !== "new" && (
            <button
              type="button"
              className="btn btn-secondary text-sm shrink-0"
              onClick={() => setEditing("new")}
              disabled={editing !== null}
            >
              + Nuevo plan
            </button>
          )}
        </div>

        {editing === "new" && (
          <PlanForm
            mode="create"
            onDone={() => setEditing(null)}
            onCancel={() => setEditing(null)}
          />
        )}

        {plans.length === 0 && editing !== "new" ? (
          <div className="px-5 py-8 text-center text-sm text-[var(--muted-foreground)]">
            Todavía no hay planes. Creá el primero para empezar a cobrar.
          </div>
        ) : (
          plans.map((p) =>
            editing === p.id ? (
              <PlanForm
                key={p.id}
                mode="edit"
                plan={p}
                onDone={() => setEditing(null)}
                onCancel={() => setEditing(null)}
              />
            ) : (
              <PlanCard
                key={p.id}
                plan={p}
                onEdit={() => setEditing(p.id)}
                disabled={editing !== null}
              />
            ),
          )
        )}
      </div>
    </div>
  );
}

/** Sección "Membresía por defecto": selector con autosave + botón "Nuevo plan". */
function DefaultPlanCard({
  plans,
  defaultPlanId,
  cobroExcedente,
}: {
  plans: Plan[];
  defaultPlanId: string | null;
  cobroExcedente: "PROPORCIONAL" | "FRANJA_MAS_EXCEDENTE";
}) {
  const [state, action, pending] = useActionState<DefaultPlanState, FormData>(
    setDefaultPlanAction,
    null,
  );
  const [, startTransition] = useTransition();
  const [value, setValue] = useState(defaultPlanId ?? "");
  const [justSaved, setJustSaved] = useState(false);
  const [modo, setModo] = useState(cobroExcedente);

  useEffect(() => {
    if (state && "ok" in state && state.ok) {
      setJustSaved(true);
      const t = setTimeout(() => setJustSaved(false), 2500);
      return () => clearTimeout(t);
    }
  }, [state]);

  const error = state && "error" in state ? state.error : undefined;

  return (
    <div style={{ padding: "1.5rem" }} className="card flex flex-col gap-4">
      <div>
        <h3 className="text-sm font-medium">Membresía por defecto</h3>
        <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
          La que el club aplica a todo socio que no tenga una propia.
        </p>
      </div>

      {plans.length > 0 && (
        <div>
          <select
            id="default-plan"
            name="planId"
            className="input"
            value={value}
            onChange={(e) => {
              const v = e.target.value;
              setValue(v);
              const fd = new FormData();
              fd.set("planId", v);
              startTransition(() => action(fd));
            }}
          >
            <option value="">Sin membresía por defecto</option>
            {plans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          {error && <p className="text-sm text-[var(--destructive)] mt-1">{error}</p>}
        </div>
      )}

      {/* Cómo se cobra cuando el pedido cae entre dos franjas. */}
      <div className="border-t border-[var(--border-subtle)] pt-4">
        <div className="flex items-center gap-2 mb-0.5">
          <h3 className="text-sm font-medium">Cobro entre franjas</h3>
          {pending && <SavingSpinner />}
          {justSaved && (
            <span className="text-sm text-[var(--muted-foreground)]">Guardado</span>
          )}
        </div>
        <p className="text-xs text-[var(--muted-foreground)] mb-2">
          Cuando un socio pide una cantidad que supera una franja pero no llega a la
          siguiente (por ejemplo 23 g), ¿cómo lo cobrás?
        </p>
        <select
          id="cobro-excedente"
          className="input"
          value={modo}
          onChange={(e) => {
            const v = e.target.value as typeof modo;
            setModo(v);
            const fd = new FormData();
            fd.set("field", "cobroExcedente");
            fd.set("value", v);
            startTransition(() => {
              updateClubFieldAction(null, fd);
            });
          }}
        >
          <option value="PROPORCIONAL">
            Todo al precio por gramo de la franja alcanzada
          </option>
          <option value="FRANJA_MAS_EXCEDENTE">
            La franja alcanzada + los gramos de más al precio unitario
          </option>
        </select>
      </div>
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
    <div className={`px-5 py-4${plan.active ? "" : " opacity-60"}`}>
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-x-6 gap-y-1 flex-wrap">
            <span className="font-medium">{plan.name}</span>
            {!plan.active && <span className="badge badge-rechazado">Inactivo</span>}
            {plan.tiers
              .slice()
              .sort((a, b) => a.fromGrams - b.fromGrams)
              .map((t, i) => (
                <span key={i} className="text-sm text-[var(--muted-foreground)]">
                  {t.fromGrams} g → {formatMoney(t.price)}
                </span>
              ))}
          </div>
          {plan.membersCount > 0 && (
            <div className="text-xs text-[var(--muted-foreground)] mt-2">
              {plan.membersCount} socio{plan.membersCount === 1 ? "" : "s"} con esta membresía
            </div>
          )}
        </div>
        <div className="flex items-center gap-5 shrink-0">
          {plan.isDefault && <span className="badge badge-aprobado">Por defecto</span>}
          <button
            type="button"
            aria-label={`Editar ${plan.name}`}
            className="inline-flex items-center justify-center h-7 w-7 rounded-md text-[var(--muted-foreground)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)] transition-colors disabled:opacity-40"
            onClick={onEdit}
            disabled={disabled}
          >
            <PencilIcon />
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

  // Franjas fijas por gramos. Cada una es opcional: precio vacío = no se agrega.
  // El precio se guarda como string para permitir el campo vacío en el input.
  const [prices, setPrices] = useState<Record<number, string>>(() => {
    const map: Record<number, string> = {};
    for (const g of FRANJAS_GRAMOS) {
      const existing = plan?.tiers.find((t) => t.fromGrams === g);
      map[g] = existing ? String(existing.price) : "";
    }
    return map;
  });

  // Se envían solo las franjas con precio cargado (> 0).
  const tiers: Tier[] = FRANJAS_GRAMOS
    .filter((g) => prices[g] !== "" && Number(prices[g]) > 0)
    .map((g) => ({ fromGrams: g, price: Number(prices[g]) }));

  useEffect(() => {
    if (state && "ok" in state && state.ok) onDone();
  }, [state, onDone]);

  const fieldErrors = state && "error" in state ? state.fieldErrors : undefined;
  const generalError = state && "error" in state ? state.error : undefined;

  const setPrice = (g: number, v: string) =>
    setPrices((prev) => ({ ...prev, [g]: v }));

  return (
    <form action={action} className="px-5 py-4 flex flex-col gap-5">
      <h3 className="text-lg font-semibold">
        {mode === "create" ? "Nuevo plan" : "Editar plan"}
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
        <span className="label mb-0">
          Franjas por gramos
          <span className="font-normal text-[var(--muted-foreground)]">
            {" "}— ¿Tenés distintos tipos de cobro si tus socios no llevan la mensualidad completa?
          </span>
        </span>
        <p className="text-xs text-[var(--muted-foreground)] mt-0.5 mb-3">
          Podés agregar franjas opcionales. Si la dejás vacía, simplemente no se agrega.
        </p>
        <div className="space-y-2">
          {FRANJAS_GRAMOS.map((g) => {
            const raw = prices[g] ?? "";
            const perGram = raw !== "" && Number(raw) > 0 ? Number(raw) / g : null;
            return (
              <div key={g} className="flex items-center gap-2">
                <span className="text-sm tabular-nums w-12 shrink-0">{g} g</span>
                <span className="text-sm text-[var(--muted-foreground)]">→ $</span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={raw}
                  placeholder="—"
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setPrice(g, e.target.value)}
                  className="input w-32"
                />
                {perGram != null && (
                  <span className="text-xs text-[var(--muted-foreground)] whitespace-nowrap">
                    = {formatMoney(perGram)}/g
                  </span>
                )}
              </div>
            );
          })}
        </div>
        {fieldErrors?.tiers && <p className="text-sm text-[var(--destructive)] mt-1">{fieldErrors.tiers}</p>}
      </div>

      {generalError && !fieldErrors && (
        <p className="text-sm text-[var(--destructive)]">{generalError}</p>
      )}

      <div className="flex justify-end gap-2">
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={pending}>
          Cancelar
        </button>
        <button type="submit" className="btn btn-primary inline-flex items-center gap-2" disabled={pending}>
          {pending && <SavingSpinner />}
          Guardar
        </button>
      </div>
    </form>
  );
}
