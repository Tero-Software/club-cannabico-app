"use client";

import { useState, useTransition } from "react";
import { SubmitWithSpinner } from "@/components/ui/submit-with-spinner";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { PencilIcon } from "@/components/ui/icons";
import { createTreatment, updateTreatment, deleteTreatment } from "./actions";

type PlantOption = { id: string; number: number };
type Treatment = {
  id: string;
  date: string;
  description: string;
  plantId: string | null;
  target: string;
};

function fmtDate(iso: string): string {
  return new Intl.DateTimeFormat("es-UY", { dateStyle: "medium" }).format(
    new Date(iso),
  );
}

function toInputDate(iso: string): string {
  return iso.slice(0, 10);
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
        <div className="card p-0">
          <table className="w-full text-sm border-separate border-spacing-0">
            <thead>
              <tr className="text-left text-[var(--muted-foreground)] [&>th]:sticky [&>th]:top-0 [&>th]:z-10 [&>th]:bg-[var(--surface-3)] [&>th]:pt-3 [&>th]:pb-5">
                <th className="px-3 font-medium">Fecha</th>
                <th className="px-3 font-medium">Aplica a</th>
                <th className="px-3 font-medium">Tratamiento</th>
                <th className="px-3" />
              </tr>
            </thead>
            <tbody>
              {treatments.map((t) => (
                <TreatmentRow key={t.id} treatment={t} plants={plants} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function TreatmentRow({
  treatment,
  plants,
}: {
  treatment: Treatment;
  plants: PlantOption[];
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <TreatmentEditRow
        treatment={treatment}
        plants={plants}
        onDone={() => setEditing(false)}
      />
    );
  }

  return (
    <tr className="align-middle [&>td]:border-t [&>td]:border-[var(--border-subtle)] [&:first-child>td]:border-t-0">
      <td className="px-3 py-3.5 whitespace-nowrap">{fmtDate(treatment.date)}</td>
      <td className="px-3 py-3.5 whitespace-nowrap">{treatment.target}</td>
      <td className="px-3 py-3.5">{treatment.description}</td>
      <td className="px-3 py-3.5 text-right">
        <button
          type="button"
          aria-label="Editar tratamiento"
          onClick={() => setEditing(true)}
          className="inline-flex items-center justify-center h-7 w-7 rounded-md text-[var(--muted-foreground)] hover:bg-[var(--surface-3)] hover:text-[var(--foreground)] transition-colors"
        >
          <PencilIcon />
        </button>
      </td>
    </tr>
  );
}

// Fila en modo edición: al tocar el lápiz, se expande en un bloque a lo ancho
// (colSpan) con la fecha, a qué plantas aplica y la descripción editables juntos.
// Borrar vive acá dentro. Sin <form> con <td>: FormData armado a mano.
function TreatmentEditRow({
  treatment,
  plants,
  onDone,
}: {
  treatment: Treatment;
  plants: PlantOption[];
  onDone: () => void;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <tr className="bg-[var(--muted)]/30">
      <td
        colSpan={4}
        className="border-t border-[var(--border-subtle)] px-3 py-3"
      >
        <form
          action={(fd) =>
            start(async () => {
              setError(null);
              fd.set("id", treatment.id);
              const res = await updateTreatment(fd);
              if (res?.error) setError(res.error);
              else onDone();
            })
          }
          className="space-y-3"
        >
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="label">Fecha</label>
              <input
                type="date"
                name="date"
                defaultValue={toInputDate(treatment.date)}
                className="input"
              />
            </div>
            <div>
              <label className="label">Aplica a</label>
              <select
                name="plantId"
                defaultValue={treatment.plantId ?? ""}
                className="input"
              >
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
                defaultValue={treatment.description}
                className="input w-full"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DeleteTreatment id={treatment.id} />
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
            <p className="text-sm text-[var(--destructive)]">{error}</p>
          )}
        </form>
      </td>
    </tr>
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
