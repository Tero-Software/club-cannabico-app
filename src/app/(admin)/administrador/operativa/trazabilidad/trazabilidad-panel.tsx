"use client";

import { useState, useTransition, useRef } from "react";
import { SubmitWithSpinner } from "@/components/ui/submit-with-spinner";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { PencilIcon } from "@/components/ui/icons";
import {
  createHarvest,
  createPlant,
  updatePlant,
  deletePlant,
  deleteHarvest,
} from "./actions";

type Strain = { id: string; name: string };
type Plant = {
  id: string;
  number: number;
  strainId: string | null;
  strainName: string | null;
  harvestId: string | null;
  germinatedAt: string | null;
  pottedAt: string | null;
  bedAt: string | null;
  floweredAt: string | null;
  harvestedAt: string | null;
  yield: number | null;
  notes: string | null;
  notProspered: boolean;
};
type Harvest = {
  id: string;
  date: string;
  declarada: boolean;
  plants: Plant[];
};

// Las etapas del ciclo, en el orden y con el nombre de la planilla del IRCCA.
const STAGES = [
  { key: "germinatedAt", label: "Germinación" },
  { key: "pottedAt", label: "Maceta" },
  { key: "bedAt", label: "Bancal" },
  { key: "floweredAt", label: "Flora" },
  { key: "harvestedAt", label: "Cosecha" },
] as const;
type StageKey = (typeof STAGES)[number]["key"];

function toInputDate(iso: string | null): string {
  return iso ? iso.slice(0, 10) : "";
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("es-UY", { dateStyle: "short" }).format(
    new Date(iso),
  );
}

function fmtDateLong(iso: string): string {
  return new Intl.DateTimeFormat("es-UY", { dateStyle: "long" }).format(
    new Date(iso),
  );
}

export function TrazabilidadPanel({
  harvests,
  strains,
}: {
  harvests: Harvest[];
  strains: Strain[];
}) {
  return (
    <div className="space-y-8">
      <NewHarvest />

      {harvests.map((h) => (
        <HarvestGroup key={h.id} harvest={h} strains={strains} />
      ))}
    </div>
  );
}

// Grupo de una cosecha: encabezado con su fecha de inicio y estado, y debajo la
// tabla de sus plantas con los labels sticky al hacer scroll.
function HarvestGroup({
  harvest,
  strains,
}: {
  harvest: Harvest;
  strains: Strain[];
}) {
  return (
    <section className="card p-0">
      {/* Barra de la cosecha: sticky arriba de todo. La fecha (título) y el botón
          de agregar planta quedan pegados al hacer scroll, y los labels de la
          tabla se anclan justo debajo. */}
      <div className="sticky top-0 z-20 flex flex-wrap items-center gap-3 bg-[var(--surface-3)] px-3 h-16">
        <h2 className="text-base font-semibold text-[var(--foreground)]">
          Cosecha del {fmtDateLong(harvest.date)}
        </h2>
        <span className="rounded-full bg-[var(--surface-2)] px-2 py-0.5 text-xs text-[var(--muted-foreground)]">
          {harvest.declarada ? "Declarada" : "En preparación"}
        </span>
        <span className="text-xs text-[var(--muted-foreground)]">
          {harvest.plants.length}{" "}
          {harvest.plants.length === 1 ? "planta" : "plantas"}
        </span>
        <div className="ml-auto flex items-center gap-1">
          <NewPlant harvestId={harvest.id} strains={strains} />
          {!harvest.declarada && harvest.plants.length === 0 && (
            <DeleteHarvest id={harvest.id} />
          )}
        </div>
      </div>

      {harvest.plants.length > 0 && (
        <table className="w-full text-sm border-separate border-spacing-0">
          <thead>
            <tr className="text-left text-[var(--muted-foreground)] [&>th]:sticky [&>th]:top-16 [&>th]:z-10 [&>th]:bg-[var(--surface-3)] [&>th]:pt-3 [&>th]:pb-5">
              <th className="px-3 font-medium">Nº</th>
              <th className="px-3 font-medium">Genética</th>
              {STAGES.map((s) => (
                <th key={s.key} className="px-3 font-medium text-center">
                  {s.label}
                </th>
              ))}
              <th className="px-3 font-medium text-center">Rend. (g)</th>
              <th className="px-3 font-medium text-right">Observaciones</th>
              <th className="px-3" />
            </tr>
          </thead>
          <tbody>
            {harvest.plants.map((p) => (
              <PlantRow key={p.id} plant={p} strains={strains} />
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

function NewHarvest() {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <button className="btn btn-primary text-sm" onClick={() => setOpen(true)}>
        Nueva cosecha
      </button>
    );
  }

  return (
    <form
      action={(fd) =>
        start(async () => {
          setError(null);
          const res = await createHarvest(fd);
          if ("error" in res && res.error) setError(res.error);
          else setOpen(false);
        })
      }
      className="card flex flex-wrap items-end gap-3"
    >
      <div>
        <label className="label">Fecha de inicio</label>
        <input type="date" name="date" className="input" autoFocus />
      </div>
      <div className="flex-1 min-w-[10rem]">
        <label className="label">Observaciones</label>
        <input
          type="text"
          name="notes"
          className="input w-full"
          placeholder="Opcional"
        />
      </div>
      <SubmitWithSpinner className="btn btn-primary text-sm">
        Crear cosecha
      </SubmitWithSpinner>
      <button
        type="button"
        className="btn btn-ghost text-sm"
        onClick={() => setOpen(false)}
        disabled={pending}
      >
        Cancelar
      </button>
      {error && (
        <p className="text-sm text-[var(--destructive)] w-full">{error}</p>
      )}
    </form>
  );
}

function NewPlant({
  harvestId,
  strains,
}: {
  harvestId: string;
  strains: Strain[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <button className="btn btn-primary text-sm" onClick={() => setOpen(true)}>
        Agregar planta
      </button>
    );
  }

  return (
    <form
      action={(fd) =>
        start(async () => {
          setError(null);
          fd.set("harvestId", harvestId);
          const res = await createPlant(fd);
          if ("error" in res && res.error) setError(res.error);
          else setOpen(false);
        })
      }
      className="card flex flex-wrap items-end gap-3 w-full"
    >
      <div>
        <label className="label">Nº planta</label>
        <input
          type="number"
          name="number"
          min={1}
          className="input w-24"
          autoFocus
        />
      </div>
      <div>
        <label className="label">Genética</label>
        <select name="strainId" className="input">
          <option value="">Sin genética</option>
          {strains.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label">Germinación</label>
        <input type="date" name="germinatedAt" className="input" />
      </div>
      <div className="flex-1 min-w-[10rem]">
        <label className="label">Observaciones</label>
        <input
          type="text"
          name="notes"
          className="input w-full"
          placeholder="Opcional"
        />
      </div>
      <SubmitWithSpinner className="btn btn-primary text-sm">
        Crear
      </SubmitWithSpinner>
      <button
        type="button"
        className="btn btn-ghost text-sm"
        onClick={() => setOpen(false)}
        disabled={pending}
      >
        Cancelar
      </button>
      {error && (
        <p className="text-sm text-[var(--destructive)] w-full">{error}</p>
      )}
    </form>
  );
}

function PlantRow({ plant, strains }: { plant: Plant; strains: Strain[] }) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <PlantEditRow
        plant={plant}
        strains={strains}
        onDone={() => setEditing(false)}
      />
    );
  }

  return (
    <tr
      className={`align-middle [&>td]:border-t [&>td]:border-[var(--border-subtle)] first:[&>td]:border-t-0 ${
        plant.notProspered ? "opacity-50" : ""
      }`}
    >
      <td className="px-3 py-3.5 font-medium whitespace-nowrap">
        {plant.number}
        {plant.notProspered && (
          <span className="ml-2 text-xs font-normal text-[var(--muted-foreground)]">
            No prosperó
          </span>
        )}
      </td>
      <td className="px-3 py-3.5">{plant.strainName ?? "—"}</td>
      {STAGES.map((s) => (
        <td key={s.key} className="px-3 py-3.5 text-center">
          {fmtDate(plant[s.key])}
        </td>
      ))}
      <td className="px-3 py-3.5 text-center">
        {plant.yield != null
          ? plant.yield.toLocaleString("es-AR", { maximumFractionDigits: 2 })
          : "—"}
      </td>
      <td className="px-3 py-3.5 text-right text-[var(--muted-foreground)]">
        {plant.notes || "—"}
      </td>
      <td className="px-3 py-3.5 text-right whitespace-nowrap">
        <button
          type="button"
          aria-label="Editar planta"
          onClick={() => setEditing(true)}
          className="inline-flex items-center justify-center h-7 w-7 rounded-md text-[var(--muted-foreground)] hover:bg-[var(--surface-3)] hover:text-[var(--foreground)] transition-colors"
        >
          <PencilIcon />
        </button>
      </td>
    </tr>
  );
}

// Fila en modo edición: al tocar el lápiz, la fila se expande en un bloque que
// abarca todo el ancho (colSpan) con todos los campos editables juntos en una
// grilla que envuelve, para no deformar las columnas de la tabla. Sin <form>
// real (no puede envolver <td>): el FormData se arma a mano desde los refs.
function PlantEditRow({
  plant,
  strains,
  onDone,
}: {
  plant: Plant;
  strains: Strain[];
  onDone: () => void;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const strainRef = useRef<HTMLSelectElement>(null);
  const stageRefs = useRef<Record<StageKey, HTMLInputElement | null>>({
    germinatedAt: null,
    pottedAt: null,
    bedAt: null,
    floweredAt: null,
    harvestedAt: null,
  });
  const yieldRef = useRef<HTMLInputElement>(null);
  const notesRef = useRef<HTMLInputElement>(null);
  const notProsperedRef = useRef<HTMLInputElement>(null);

  function save() {
    start(async () => {
      setError(null);
      const fd = new FormData();
      fd.set("id", plant.id);
      fd.set("strainId", strainRef.current?.value ?? "");
      fd.set("yield", yieldRef.current?.value ?? "");
      fd.set("notes", notesRef.current?.value ?? "");
      if (notProsperedRef.current?.checked) fd.set("notProspered", "on");
      for (const s of STAGES) {
        fd.set(s.key, stageRefs.current[s.key]?.value ?? "");
      }
      const res = await updatePlant(fd);
      if ("error" in res && res.error) setError(res.error);
      else onDone();
    });
  }

  return (
    <tr className="bg-[var(--muted)]/30">
      <td
        colSpan={STAGES.length + 5}
        className="border-t border-[var(--border-subtle)] px-3 py-3"
      >
        <div className="space-y-3">
          <div className="text-sm font-medium">Planta {plant.number}</div>

          <div className="grid grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-3">
            <label className="block">
              <span className="label">Genética</span>
              <select
                ref={strainRef}
                defaultValue={plant.strainId ?? ""}
                className="input w-full"
              >
                <option value="">Sin genética</option>
                {strains.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>

            {STAGES.map((s) => (
              <label key={s.key} className="block">
                <span className="label">{s.label}</span>
                <input
                  ref={(el) => {
                    stageRefs.current[s.key] = el;
                  }}
                  type="date"
                  defaultValue={toInputDate(plant[s.key])}
                  className="input w-full"
                />
              </label>
            ))}

            <label className="block">
              <span className="label">Rendimiento (g)</span>
              <input
                ref={yieldRef}
                type="number"
                min={0}
                step="0.01"
                defaultValue={plant.yield ?? ""}
                className="input w-full"
              />
            </label>

            <label className="block col-span-full">
              <span className="label">Observaciones</span>
              <input
                ref={notesRef}
                type="text"
                defaultValue={plant.notes ?? ""}
                className="input w-full"
              />
            </label>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              ref={notProsperedRef}
              type="checkbox"
              defaultChecked={plant.notProspered}
              className="h-4 w-4"
            />
            No prosperó (murió antes de completar el ciclo)
          </label>

          <div className="flex items-center gap-2">
            <DeletePlant id={plant.id} />
            <button
              type="button"
              className="btn btn-ghost text-sm ml-auto"
              onClick={onDone}
              disabled={pending}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn-primary text-sm"
              onClick={save}
              disabled={pending}
            >
              Guardar
            </button>
          </div>

          {error && (
            <p className="text-sm text-[var(--destructive)]">{error}</p>
          )}
        </div>
      </td>
    </tr>
  );
}

function DeletePlant({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return (
    <ConfirmButton
      pending={pending}
      confirmLabel="¿Borrar planta?"
      onConfirm={() =>
        start(async () => {
          const fd = new FormData();
          fd.set("id", id);
          await deletePlant(fd);
        })
      }
    >
      Borrar
    </ConfirmButton>
  );
}

function DeleteHarvest({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return (
    <ConfirmButton
      pending={pending}
      confirmLabel="¿Borrar cosecha?"
      onConfirm={() =>
        start(async () => {
          const fd = new FormData();
          fd.set("id", id);
          await deleteHarvest(fd);
        })
      }
    >
      Borrar cosecha
    </ConfirmButton>
  );
}
