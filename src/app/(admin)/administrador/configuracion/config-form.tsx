"use client";

import { useState, useTransition } from "react";
import { updateClubFieldAction } from "./actions";
import { SavingSpinner } from "@/components/ui/saving-spinner";
import { PencilIcon } from "@/components/ui/icons";
import { TimeSlotsEditor } from "./time-slots-editor";

const DIAS = [
  { value: 1, label: "Lun" },
  { value: 2, label: "Mar" },
  { value: 3, label: "Mié" },
  { value: 4, label: "Jue" },
  { value: 5, label: "Vie" },
  { value: 6, label: "Sáb" },
  { value: 0, label: "Dom" },
];

type Field =
  | "city"
  | "tagline"
  | "description"
  | "maxGramsPerMonth"
  | "minGramsPerWithdrawal"
  | "minGramsPerStrain"
  | "gramsStep";

export function ConfigForm({
  initial,
}: {
  initial: {
    city: string | null;
    tagline: string | null;
    description: string | null;
    workingDays: number[];
    timeSlots: string[];
    maxGramsPerMonth: number;
    minGramsPerWithdrawal: number;
    minGramsPerStrain: number;
    gramsStep: number;
  };
}) {
  return (
    <div className="space-y-8">
      {/* Presentación pública */}
      <section>
        <div className="mb-3">
          <h3 className="text-sm font-medium">Presentación pública</h3>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
            Lo que se muestra en la portada del club.
          </p>
        </div>
        <div className="card p-0 [&>*+*]:border-t [&>*+*]:border-[var(--border-subtle)]">
          <EditableRow
            field="city"
            label="Ciudad"
            value={initial.city ?? ""}
            placeholder="Montevideo"
          />
          <EditableRow
            field="tagline"
            label="Frase de portada"
            value={initial.tagline ?? ""}
            placeholder="Cultivo colectivo y responsable"
          />
          <EditableRow
            field="description"
            label="Descripción"
            value={initial.description ?? ""}
            placeholder="Quiénes somos, cómo funciona el club, etc."
            multiline
          />
        </div>
      </section>

      {/* Días hábiles y franjas horarias */}
      <section>
        <div className="mb-3">
          <h3 className="text-sm font-medium">Días y horarios de retiro</h3>
        </div>
        <div className="card p-0 [&>*+*]:border-t [&>*+*]:border-[var(--border-subtle)]">
          <div className="px-5 py-4">
            <WorkingDays initial={initial.workingDays} />
          </div>
          <div className="px-5 py-4">
            <TimeSlotsEditor initial={initial.timeSlots} />
          </div>
        </div>
      </section>

      {/* Límites de cupo */}
      <section>
        <div className="mb-3">
          <h3 className="text-sm font-medium">Límites de retiro</h3>
        </div>
        <div className="card p-0 [&>*+*]:border-t [&>*+*]:border-[var(--border-subtle)]">
          <EditableRow
            field="maxGramsPerMonth"
            label="Cupo mensual por socio (g)"
            value={String(initial.maxGramsPerMonth)}
            numeric
          />
          <EditableRow
            field="minGramsPerWithdrawal"
            label="Mínimo por retiro (g)"
            value={String(initial.minGramsPerWithdrawal)}
            numeric
          />
          <EditableRow
            field="minGramsPerStrain"
            label="Mínimo por variedad (g)"
            value={String(initial.minGramsPerStrain)}
            numeric
          />
          <EditableRow
            field="gramsStep"
            label="Múltiplo de gramos"
            hint="¿De a cuánto pueden agregar tus socios al pedir? Con 10, solo cantidades redondas (10, 20, 30…), con 1, cualquier cantidad."
            value={String(initial.gramsStep)}
            numeric
          />
        </div>
      </section>
    </div>
  );
}

/**
 * Fila de un parámetro: muestra el valor con un lápiz a la derecha; al tocarlo
 * aparece el campo editable con guardar/cancelar. Guarda solo ese campo.
 */
function EditableRow({
  field,
  label,
  hint,
  value: initialValue,
  placeholder,
  multiline,
  numeric,
}: {
  field: Field;
  label: string;
  hint?: string;
  value: string;
  placeholder?: string;
  multiline?: boolean;
  numeric?: boolean;
}) {
  const [value, setValue] = useState(initialValue);
  const [draft, setDraft] = useState(initialValue);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function open() {
    setDraft(value);
    setError(null);
    setEditing(true);
  }

  function save() {
    start(async () => {
      setError(null);
      const fd = new FormData();
      fd.set("field", field);
      fd.set("value", draft);
      const res = await updateClubFieldAction(null, fd);
      if (res && "error" in res && res.error) {
        setError(res.error);
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
            <div className="text-sm font-medium">
              {label}
              {hint && (
                <span className="font-normal text-[var(--muted-foreground)]">
                  {" "}— {hint}
                </span>
              )}
            </div>
            <div
              className={`text-sm mt-0.5 ${
                value
                  ? "text-[var(--muted-foreground)] whitespace-pre-wrap"
                  : "text-[var(--fg-quaternary)] italic"
              }`}
            >
              {value || "Sin definir"}
            </div>
          </div>
          <button
            type="button"
            aria-label={`Editar ${label}`}
            onClick={open}
            className="inline-flex items-center justify-center h-7 w-7 rounded-md text-[var(--muted-foreground)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)] transition-colors shrink-0"
          >
            <PencilIcon />
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">{label}</label>
          {multiline ? (
            <textarea
              autoFocus
              rows={4}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={placeholder}
              className="input"
            />
          ) : (
            <input
              autoFocus
              type={numeric ? "number" : "text"}
              min={numeric ? 1 : undefined}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={placeholder}
              className="input"
            />
          )}
          {error && <p className="text-sm text-[var(--destructive)]">{error}</p>}
          <div className="flex gap-2">
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

/** Días hábiles: toggles que guardan al instante (edición individual). */
function WorkingDays({ initial }: { initial: number[] }) {
  const [days, setDays] = useState<number[]>(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function toggle(d: number) {
    const next = days.includes(d) ? days.filter((x) => x !== d) : [...days, d];
    setDays(next);
    start(async () => {
      setError(null);
      const fd = new FormData();
      fd.set("field", "workingDays");
      for (const v of next) fd.append("value", String(v));
      const res = await updateClubFieldAction(null, fd);
      if (res && "error" in res && res.error) {
        setError(res.error);
        setDays(days); // revertir en caso de error
      }
    });
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm font-medium">Días hábiles de retiro</span>
        {pending && <SavingSpinner />}
      </div>
      <div className="flex flex-wrap gap-2">
        {DIAS.map((d) => {
          const activo = days.includes(d.value);
          return (
            <button
              key={d.value}
              type="button"
              onClick={() => toggle(d.value)}
              disabled={pending}
              className={`px-4 py-2 rounded-full border text-sm transition-all ${
                activo
                  ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                  : "border-[var(--border)] hover:border-[var(--primary)] hover:bg-[var(--muted)]"
              }`}
            >
              {d.label}
            </button>
          );
        })}
      </div>
      {error && <p className="text-sm text-[var(--destructive)] mt-1">{error}</p>}
    </div>
  );
}
