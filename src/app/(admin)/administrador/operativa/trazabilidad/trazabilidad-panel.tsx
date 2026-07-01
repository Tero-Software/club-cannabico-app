"use client";

import { useState, useTransition } from "react";
import { SubmitWithSpinner } from "@/components/ui/submit-with-spinner";
import { ConfirmButton } from "@/components/ui/confirm-button";
import {
  createPlant,
  setPlantStage,
  updatePlant,
  deletePlant,
} from "./actions";

type Strain = { id: string; name: string };
type HarvestOption = { id: string; label: string };
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

export function TrazabilidadPanel({
  plants,
  strains,
  harvests,
}: {
  plants: Plant[];
  strains: Strain[];
  harvests: HarvestOption[];
}) {
  return (
    <div className="space-y-6">
      <NewPlant strains={strains} harvests={harvests} />

      {plants.length > 0 && (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] text-left text-[var(--muted-foreground)]">
                <th className="px-3 py-2 font-medium">Nº</th>
                <th className="px-3 py-2 font-medium">Genética</th>
                {STAGES.map((s) => (
                  <th key={s.key} className="px-3 py-2 font-medium">
                    {s.label}
                  </th>
                ))}
                <th className="px-3 py-2 font-medium text-right">Rend. (g)</th>
                <th className="px-3 py-2 font-medium">Observaciones</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {plants.map((p) => (
                <PlantRow
                  key={p.id}
                  plant={p}
                  strains={strains}
                  harvests={harvests}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function NewPlant({
  strains,
  harvests,
}: {
  strains: Strain[];
  harvests: HarvestOption[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <button className="btn btn-primary text-sm" onClick={() => setOpen(true)}>
        Nueva planta
      </button>
    );
  }

  return (
    <form
      action={(fd) =>
        start(async () => {
          setError(null);
          const res = await createPlant(fd);
          if (res?.error) setError(res.error);
          else setOpen(false);
        })
      }
      className="card flex flex-wrap items-end gap-3"
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
        <label className="label">Cosecha</label>
        <select name="harvestId" className="input">
          <option value="">Sin cosecha</option>
          {harvests.map((h) => (
            <option key={h.id} value={h.id}>
              {h.label}
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
      >
        Cancelar
      </button>
      {error && (
        <p className="text-sm text-[var(--destructive)] w-full">{error}</p>
      )}
    </form>
  );
}

function PlantRow({
  plant,
  strains,
  harvests,
}: {
  plant: Plant;
  strains: Strain[];
  harvests: HarvestOption[];
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <PlantEditRow
        plant={plant}
        strains={strains}
        harvests={harvests}
        onDone={() => setEditing(false)}
      />
    );
  }

  return (
    <tr className="border-b border-[var(--border-subtle)] last:border-0 align-top">
      <td className="px-3 py-2 font-medium">{plant.number}</td>
      <td className="px-3 py-2">{plant.strainName ?? "—"}</td>
      {STAGES.map((s) => (
        <StageCell key={s.key} plant={plant} stage={s.key} />
      ))}
      <td className="px-3 py-2 text-right">
        {plant.yield != null
          ? plant.yield.toLocaleString("es-AR", { maximumFractionDigits: 2 })
          : "—"}
      </td>
      <td className="px-3 py-2 text-[var(--muted-foreground)]">
        {plant.notes || "—"}
      </td>
      <td className="px-3 py-2 text-right whitespace-nowrap">
        <button
          className="btn btn-ghost text-xs"
          onClick={() => setEditing(true)}
        >
          Editar
        </button>
        <DeletePlant id={plant.id} />
      </td>
    </tr>
  );
}

// Celda de etapa: muestra la fecha; al hacer clic abre un date input que guarda
// al confirmar. Cada etapa se registra de forma independiente.
function StageCell({ plant, stage }: { plant: Plant; stage: StageKey }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const value = plant[stage];

  function save(date: string) {
    start(async () => {
      const fd = new FormData();
      fd.set("id", plant.id);
      fd.set("stage", stage);
      fd.set("date", date);
      await setPlantStage(fd);
      setOpen(false);
    });
  }

  if (open) {
    return (
      <td className="px-3 py-2">
        <input
          type="date"
          defaultValue={toInputDate(value)}
          className="input py-1 text-xs"
          disabled={pending}
          autoFocus
          onBlur={(e) => save(e.target.value)}
        />
      </td>
    );
  }

  return (
    <td className="px-3 py-2">
      <button
        className="hover:underline disabled:opacity-50"
        disabled={pending}
        onClick={() => setOpen(true)}
        title="Editar fecha"
      >
        {fmtDate(value)}
      </button>
    </td>
  );
}

function PlantEditRow({
  plant,
  strains,
  harvests,
  onDone,
}: {
  plant: Plant;
  strains: Strain[];
  harvests: HarvestOption[];
  onDone: () => void;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <tr className="border-b border-[var(--border-subtle)] bg-[var(--muted)]/30">
      <td colSpan={STAGES.length + 5} className="px-3 py-3">
        <form
          action={(fd) =>
            start(async () => {
              setError(null);
              fd.set("id", plant.id);
              const res = await updatePlant(fd);
              if (res?.error) setError(res.error);
              else onDone();
            })
          }
          className="flex flex-wrap items-end gap-3"
        >
          <div className="font-medium self-center">
            Planta {plant.number}
          </div>
          <div>
            <label className="label">Genética</label>
            <select
              name="strainId"
              defaultValue={plant.strainId ?? ""}
              className="input"
            >
              <option value="">Sin genética</option>
              {strains.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Cosecha</label>
            <select
              name="harvestId"
              defaultValue={plant.harvestId ?? ""}
              className="input"
            >
              <option value="">Sin cosecha</option>
              {harvests.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Rendimiento (g)</label>
            <input
              type="number"
              name="yield"
              min={0}
              step="0.01"
              defaultValue={plant.yield ?? ""}
              className="input w-28"
            />
          </div>
          <div className="flex-1 min-w-[12rem]">
            <label className="label">Observaciones</label>
            <input
              type="text"
              name="notes"
              defaultValue={plant.notes ?? ""}
              className="input w-full"
            />
          </div>
          <SubmitWithSpinner className="btn btn-primary text-sm">
            Guardar
          </SubmitWithSpinner>
          <button
            type="button"
            className="btn btn-ghost text-sm"
            onClick={onDone}
            disabled={pending}
          >
            Cancelar
          </button>
          {error && (
            <p className="text-sm text-[var(--destructive)] w-full">{error}</p>
          )}
        </form>
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
