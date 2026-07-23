"use client";

import { useState, useTransition } from "react";
import { SubmitWithSpinner } from "@/components/ui/submit-with-spinner";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { PencilIcon } from "@/components/ui/icons";
import { MESES } from "@/lib/plan-cultivo";
import { createPlanEntry, updatePlanEntry, deletePlanEntry } from "./actions";

// Un hito aproximado: mes (null = sin definir), semanas del mes y la etiqueta
// ya armada por el server ("Marzo, semanas 3 y 4").
export type PlanHito = { month: number | null; weeks: number[]; label: string };

export type PlanEntry = {
  id: string;
  number: number;
  germination: PlanHito;
  potting: PlanHito;
  bed: PlanHito;
  // Meses (1-12) de la ventana de cosecha, ya derivados de la regla.
  harvestMonths: number[];
  harvestLabel: string;
  notes: string | null;
  harvestsCount: number;
};

// Hitos aproximados del ciclo, con los mismos nombres que la trazabilidad.
const HITOS = [
  { key: "germination", label: "Germinación" },
  { key: "potting", label: "Maceta" },
  { key: "bed", label: "Bancal" },
] as const;

export function PlanPanel({ entries }: { entries: PlanEntry[] }) {
  return (
    <div className="space-y-8">
      <NewEntry entries={entries} />

      {entries.length > 0 && (
        <section className="card p-0">
          <table className="w-full text-sm border-separate border-spacing-0">
            <thead>
              <tr className="text-left text-[var(--muted-foreground)] [&>th]:pt-4 [&>th]:pb-2">
                <th className="px-5 font-medium">Siembra</th>
                {HITOS.map((h) => (
                  <th key={h.key} className="px-3 font-medium text-center">
                    {h.label}
                  </th>
                ))}
                <th className="px-3 font-medium text-center">Cosecha estimada</th>
                <th className="px-3 font-medium text-right">Notas</th>
                <th className="px-3" />
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <EntryRow key={e.id} entry={e} />
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}

function EntryRow({ entry }: { entry: PlanEntry }) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return <EntryEditRow entry={entry} onDone={() => setEditing(false)} />;
  }

  return (
    <tr className="align-middle [&>td]:border-t [&>td]:border-[var(--border-subtle)]">
      <td className="px-5 py-3.5 font-medium whitespace-nowrap">
        N.º {entry.number}
        {entry.harvestsCount > 0 && (
          <span className="ml-2 text-xs font-normal text-[var(--muted-foreground)]">
            en trazabilidad
          </span>
        )}
      </td>
      {HITOS.map((h) => (
        <td key={h.key} className="px-3 py-3.5 text-center text-[var(--muted-foreground)]">
          {entry[h.key].label}
        </td>
      ))}
      <td className="px-3 py-3.5 text-center whitespace-nowrap">
        {entry.harvestLabel}
      </td>
      <td className="px-3 py-3.5 text-right text-[var(--muted-foreground)]">
        {entry.notes || "—"}
      </td>
      <td className="px-3 py-3.5 text-right whitespace-nowrap">
        <button
          type="button"
          aria-label={`Editar siembra N.º ${entry.number}`}
          onClick={() => setEditing(true)}
          className="inline-flex items-center justify-center h-7 w-7 rounded-md text-[var(--muted-foreground)] hover:bg-[var(--surface-3)] hover:text-[var(--foreground)] transition-colors"
        >
          <PencilIcon />
        </button>
      </td>
    </tr>
  );
}

// Un hito en edición: selector de mes + toggles de semanas (1-4). Viaja en el
// form como "<key>Month" y varios "<key>Weeks".
function HitoField({
  hitoKey,
  label,
  initial,
}: {
  hitoKey: string;
  label: string;
  initial?: PlanHito;
}) {
  const [month, setMonth] = useState<number | "">(initial?.month ?? "");
  const [weeks, setWeeks] = useState<number[]>(initial?.weeks ?? []);

  return (
    <div>
      <label className="label">{label} (aprox.)</label>
      <div className="flex items-center gap-2">
        <select
          name={`${hitoKey}Month`}
          value={month}
          onChange={(e) => {
            const v = e.target.value;
            setMonth(v === "" ? "" : Number(v));
            if (v === "") setWeeks([]);
          }}
          className="input"
        >
          <option value="">Sin definir</option>
          {MESES.map((nombre, i) => (
            <option key={i + 1} value={i + 1}>
              {nombre}
            </option>
          ))}
        </select>
        {weeks.map((w) => (
          <input key={w} type="hidden" name={`${hitoKey}Weeks`} value={w} />
        ))}
        {month !== "" && (
          <div className="flex gap-1">
            {[1, 2, 3, 4].map((w) => {
              const activa = weeks.includes(w);
              return (
                <button
                  key={w}
                  type="button"
                  title={`Semana ${w}`}
                  onClick={() =>
                    setWeeks((prev) =>
                      prev.includes(w)
                        ? prev.filter((x) => x !== w)
                        : [...prev, w].sort(),
                    )
                  }
                  className={`w-8 h-8 rounded-full border text-sm transition-all ${
                    activa
                      ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                      : "border-[var(--border)] hover:border-[var(--primary)] hover:bg-[var(--muted)]"
                  }`}
                >
                  {w}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// Campos compartidos entre alta y edición. Los meses de cosecha se eligen con
// toggles (igual que los días hábiles en configuración) y viajan como varios
// values "months" del form.
function EntryFields({
  entry,
  numberDefault,
}: {
  entry?: PlanEntry;
  numberDefault?: number;
}) {
  const [months, setMonths] = useState<number[]>(entry?.harvestMonths ?? []);

  return (
    <>
      <div className="flex flex-wrap items-end gap-4 w-full">
        <div>
          <label className="label">N.º de siembra</label>
          <input
            type="number"
            name="number"
            min={1}
            defaultValue={entry?.number ?? numberDefault ?? ""}
            className="input w-24"
          />
        </div>
        {HITOS.map((h) => (
          <HitoField
            key={h.key}
            hitoKey={h.key}
            label={h.label}
            initial={entry?.[h.key]}
          />
        ))}
      </div>

      <div className="w-full">
        <span className="label">Meses de cosecha estimada</span>
        {months.map((m) => (
          <input key={m} type="hidden" name="months" value={m} />
        ))}
        <div className="flex flex-wrap gap-2 mt-1">
          {MESES.map((nombre, i) => {
            const mes = i + 1;
            const activo = months.includes(mes);
            return (
              <button
                key={mes}
                type="button"
                onClick={() =>
                  setMonths((prev) =>
                    prev.includes(mes)
                      ? prev.filter((x) => x !== mes)
                      : [...prev, mes].sort((a, b) => a - b),
                  )
                }
                className={`px-3 py-1.5 rounded-full border text-sm transition-all ${
                  activo
                    ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                    : "border-[var(--border)] hover:border-[var(--primary)] hover:bg-[var(--muted)]"
                }`}
              >
                {nombre.slice(0, 3)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 min-w-[10rem]">
        <label className="label">Notas</label>
        <input
          type="text"
          name="notes"
          defaultValue={entry?.notes ?? ""}
          className="input w-full"
          placeholder="Opcional"
        />
      </div>
    </>
  );
}

function NewEntry({ entries }: { entries: PlanEntry[] }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const nextNumber =
    entries.reduce((max, e) => Math.max(max, e.number), 0) + 1;

  if (!open) {
    return (
      <button className="btn btn-primary text-sm" onClick={() => setOpen(true)}>
        Agregar siembra
      </button>
    );
  }

  return (
    <form
      action={(fd) =>
        start(async () => {
          setError(null);
          const res = await createPlanEntry(fd);
          if ("error" in res && res.error) setError(res.error);
          else setOpen(false);
        })
      }
      className="card flex flex-wrap items-end gap-4"
    >
      <EntryFields numberDefault={nextNumber} />
      <div className="flex gap-2">
        <SubmitWithSpinner className="btn btn-primary text-sm">
          Agregar
        </SubmitWithSpinner>
        <button
          type="button"
          className="btn btn-ghost text-sm"
          onClick={() => setOpen(false)}
          disabled={pending}
        >
          Cancelar
        </button>
      </div>
      {error && (
        <p className="text-sm text-[var(--destructive)] w-full">{error}</p>
      )}
    </form>
  );
}

function EntryEditRow({ entry, onDone }: { entry: PlanEntry; onDone: () => void }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <tr className="bg-[var(--muted)]/30">
      <td
        colSpan={HITOS.length + 4}
        className="border-t border-[var(--border-subtle)] px-5 py-3"
      >
        <form
          action={(fd) =>
            start(async () => {
              setError(null);
              fd.set("id", entry.id);
              const res = await updatePlanEntry(fd);
              if ("error" in res && res.error) setError(res.error);
              else onDone();
            })
          }
          className="flex flex-wrap items-end gap-4"
        >
          <EntryFields entry={entry} />
          <div className="flex items-center gap-2 w-full">
            <DeleteEntry entry={entry} />
            <button
              type="button"
              className="btn btn-ghost text-sm ml-auto"
              onClick={onDone}
              disabled={pending}
            >
              Cancelar
            </button>
            <SubmitWithSpinner className="btn btn-primary text-sm">
              Guardar
            </SubmitWithSpinner>
          </div>
          {error && (
            <p className="text-sm text-[var(--destructive)] w-full">{error}</p>
          )}
        </form>
      </td>
    </tr>
  );
}

function DeleteEntry({ entry }: { entry: PlanEntry }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <>
      <ConfirmButton
        pending={pending}
        confirmLabel={`¿Borrar la siembra N.º ${entry.number}?`}
        onConfirm={() =>
          start(async () => {
            setError(null);
            const fd = new FormData();
            fd.set("id", entry.id);
            const res = await deletePlanEntry(fd);
            if (res && "error" in res && res.error) setError(res.error);
          })
        }
      >
        Borrar
      </ConfirmButton>
      {error && <p className="text-sm text-[var(--destructive)]">{error}</p>}
    </>
  );
}
