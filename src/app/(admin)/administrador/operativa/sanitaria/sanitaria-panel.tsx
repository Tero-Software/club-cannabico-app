"use client";

import { useState, useTransition } from "react";
import { SubmitWithSpinner } from "@/components/ui/submit-with-spinner";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { createTreatment, deleteTreatment } from "./actions";

type PlantOption = { id: string; number: number };
type Treatment = {
  id: string;
  date: string;
  description: string;
  target: string;
};

function fmtDate(iso: string): string {
  return new Intl.DateTimeFormat("es-UY", { dateStyle: "medium" }).format(
    new Date(iso),
  );
}

export function SanitariaPanel({
  treatments,
  plants,
}: {
  treatments: Treatment[];
  plants: PlantOption[];
}) {
  return (
    <div className="space-y-6">
      <NewTreatment plants={plants} />

      {treatments.length > 0 && (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] text-left text-[var(--muted-foreground)]">
                <th className="px-3 py-2 font-medium">Fecha</th>
                <th className="px-3 py-2 font-medium">Aplica a</th>
                <th className="px-3 py-2 font-medium">Tratamiento</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {treatments.map((t) => (
                <tr
                  key={t.id}
                  className="border-b border-[var(--border-subtle)] last:border-0"
                >
                  <td className="px-3 py-2 whitespace-nowrap">
                    {fmtDate(t.date)}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">{t.target}</td>
                  <td className="px-3 py-2">{t.description}</td>
                  <td className="px-3 py-2 text-right">
                    <DeleteTreatment id={t.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function NewTreatment({ plants }: { plants: PlantOption[] }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <button className="btn btn-primary text-sm" onClick={() => setOpen(true)}>
        Nuevo tratamiento
      </button>
    );
  }

  return (
    <form
      action={(fd) =>
        start(async () => {
          setError(null);
          const res = await createTreatment(fd);
          if (res?.error) setError(res.error);
          else setOpen(false);
        })
      }
      className="card flex flex-wrap items-end gap-3"
    >
      <div>
        <label className="label">Fecha</label>
        <input type="date" name="date" className="input" autoFocus />
      </div>
      <div>
        <label className="label">Aplica a</label>
        <select name="plantId" className="input">
          <option value="">Todas</option>
          {plants.map((p) => (
            <option key={p.id} value={p.id}>
              Planta {p.number}
            </option>
          ))}
        </select>
      </div>
      <div className="flex-1 min-w-[16rem]">
        <label className="label">Tratamiento</label>
        <input
          type="text"
          name="description"
          className="input w-full"
          placeholder="Ej.: preventivo de jabón potásico y azufre líquido"
        />
      </div>
      <SubmitWithSpinner className="btn btn-primary text-sm">
        Registrar
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

function DeleteTreatment({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return (
    <ConfirmButton
      pending={pending}
      confirmLabel="¿Borrar?"
      onConfirm={() =>
        start(async () => {
          const fd = new FormData();
          fd.set("id", id);
          await deleteTreatment(fd);
        })
      }
    >
      Borrar
    </ConfirmButton>
  );
}
