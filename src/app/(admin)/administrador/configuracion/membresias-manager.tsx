"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import {
  createPlanAction,
  updatePlanAction,
  deletePlanAction,
  type PlanState,
} from "./membresias-actions";
import { setDefaultPlanAction, updateClubFieldAction } from "./actions";
import { SavingSpinner } from "@/components/ui/saving-spinner";
import { CheckIcon, PencilIcon } from "@/components/ui/icons";
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
          // Grilla compartida por todas las tarjetas: la columna del nombre es
          // max-content, así el nombre más largo empareja dónde arranca el
          // contenido (franjas) de todos los planes.
          <div className="grid grid-cols-[max-content_1fr_auto] gap-x-6 [&>*+*]:border-t [&>*+*]:border-[var(--border-subtle)]">
            {plans.map((p) =>
              editing === p.id ? (
                <div key={p.id} className="col-span-full">
                  <PlanForm
                    mode="edit"
                    plan={p}
                    onDone={() => setEditing(null)}
                    onCancel={() => setEditing(null)}
                  />
                </div>
              ) : (
                <PlanCard
                  key={p.id}
                  plan={p}
                  onEdit={() => setEditing(p.id)}
                  disabled={editing !== null}
                />
              ),
            )}
          </div>
        )}
      </div>

      <DefaultPlanCard
        plans={plans}
        defaultPlanId={defaultPlanId}
        cobroExcedente={cobroExcedente}
      />
    </div>
  );
}

const COBRO_OPTIONS = [
  { value: "PROPORCIONAL", label: "Todo al precio por gramo de la franja alcanzada" },
  {
    value: "FRANJA_MAS_EXCEDENTE",
    label: "La franja alcanzada + los gramos de más al precio unitario",
  },
];

/** Sección "Membresía por defecto" y "Cobro entre franjas": valor fijo + lápiz. */
function DefaultPlanCard({
  plans,
  defaultPlanId,
  cobroExcedente,
}: {
  plans: Plan[];
  defaultPlanId: string | null;
  cobroExcedente: "PROPORCIONAL" | "FRANJA_MAS_EXCEDENTE";
}) {
  return (
    <div className="card p-0 [&>*+*]:border-t [&>*+*]:border-[var(--border-subtle)]">
      {plans.length > 0 && (
        <OpcionesRow
          label="Membresía por defecto"
          hint="La que el club aplica a todo socio que no tenga una propia."
          options={[
            { value: "", label: "Sin membresía por defecto" },
            ...plans.map((p) => ({ value: p.id, label: p.name })),
          ]}
          initialValue={defaultPlanId ?? ""}
          onSave={async (v) => {
            const fd = new FormData();
            fd.set("planId", v);
            const res = await setDefaultPlanAction(null, fd);
            return res && "error" in res ? res.error : undefined;
          }}
        />
      )}
      <OpcionesRow
        label="Cobro entre franjas"
        hint="Cuando un socio pide una cantidad que supera una franja pero no llega a la siguiente (por ejemplo 23 g), ¿cómo lo cobrás?"
        options={COBRO_OPTIONS}
        initialValue={cobroExcedente}
        onSave={async (v) => {
          const fd = new FormData();
          fd.set("field", "cobroExcedente");
          fd.set("value", v);
          const res = await updateClubFieldAction(null, fd);
          return res && "error" in res ? res.error : undefined;
        }}
      />
    </div>
  );
}

/**
 * Fila de una opción con valor fijo y lápiz: al editar se listan las opciones
 * disponibles y la elegida se marca con un tilde.
 */
function OpcionesRow({
  label,
  hint,
  options,
  initialValue,
  onSave,
}: {
  label: string;
  hint?: string;
  options: { value: string; label: string }[];
  initialValue: string;
  onSave: (value: string) => Promise<string | undefined>;
}) {
  const [value, setValue] = useState(initialValue);
  const [draft, setDraft] = useState(initialValue);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const current = options.find((o) => o.value === value);

  function open() {
    setDraft(value);
    setError(null);
    setEditing(true);
  }

  function save() {
    start(async () => {
      setError(null);
      const err = await onSave(draft);
      if (err) {
        setError(err);
      } else {
        setValue(draft);
        setEditing(false);
      }
    });
  }

  return (
    <div className="px-5 py-3">
      {!editing ? (
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-medium">{label}</div>
            {hint && (
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{hint}</p>
            )}
          </div>
          <div className="flex items-center gap-8 shrink-0 max-w-[60%]">
            <span
              className={`text-sm text-right ${
                current ? "font-medium" : "text-[var(--fg-quaternary)] italic"
              }`}
            >
              {current?.label ?? "Sin definir"}
            </span>
            <button
              type="button"
              aria-label={`Editar ${label}`}
              onClick={open}
              className="inline-flex items-center justify-center h-7 w-7 rounded-md text-[var(--muted-foreground)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)] transition-colors shrink-0"
            >
              <PencilIcon />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div>
            <div className="text-sm font-medium">{label}</div>
            {hint && (
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{hint}</p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            {options.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => setDraft(o.value)}
                className={`flex items-center justify-between gap-3 px-3 py-2 rounded-md border text-sm text-left transition-colors ${
                  draft === o.value
                    ? "border-[var(--primary)] bg-[var(--muted)]"
                    : "border-[var(--border)] hover:border-[var(--primary)] hover:bg-[var(--muted)]"
                }`}
              >
                <span>{o.label}</span>
                {draft === o.value && (
                  <CheckIcon className="text-[var(--primary)] shrink-0" />
                )}
              </button>
            ))}
          </div>
          {error && <p className="text-sm text-[var(--destructive)]">{error}</p>}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={save}
              disabled={pending}
              className="btn btn-primary text-sm inline-flex items-center gap-2"
            >
              {pending && <SavingSpinner />}
              Guardar
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="btn btn-ghost text-sm"
            >
              Cancelar
            </button>
          </div>
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
    // Fila de la grilla compartida (subgrid): nombre | franjas | acciones. La
    // columna del nombre la dimensiona el más largo de la lista, así el
    // contenido de todos los planes arranca a la misma altura.
    <div
      className={`col-span-full grid grid-cols-subgrid items-start px-5 py-4${plan.active ? "" : " opacity-60"}`}
    >
      <div className="flex items-center gap-x-3 min-w-0">
        <span className="font-medium">{plan.name}</span>
        {!plan.active && <span className="badge badge-rechazado">Inactivo</span>}
      </div>
      {/* Franjas: una por línea */}
      <div className="flex flex-col gap-1 min-w-0">
        {plan.tiers
          .slice()
          .sort((a, b) => a.fromGrams - b.fromGrams)
          .map((t, i) => (
            <span key={i} className="text-sm text-[var(--muted-foreground)]">
              {t.fromGrams} g → {formatMoney(t.price)}
            </span>
          ))}
      </div>
      <div className="flex items-center justify-end gap-8 shrink-0">
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
      {plan.membersCount > 0 && (
        <div className="col-span-full text-xs text-[var(--muted-foreground)] mt-2">
          {plan.membersCount} socio{plan.membersCount === 1 ? "" : "s"} con esta membresía
        </div>
      )}
      {error && <p className="col-span-full text-xs text-[var(--destructive)] mt-2">{error}</p>}
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
