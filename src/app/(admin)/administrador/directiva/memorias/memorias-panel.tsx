"use client";

import { useState, useTransition } from "react";
import { SubmitWithSpinner } from "@/components/ui/submit-with-spinner";
import { ConfirmButton } from "@/components/ui/confirm-button";
import {
  createMemoria,
  updateMemoriaSummary,
  addMemoriaMilestone,
  updateMemoriaMilestone,
  deleteMemoriaMilestone,
  closeMemoria,
  reopenMemoria,
  deleteMemoria,
} from "./actions";

type Milestone = {
  id: string;
  title: string;
  body: string;
  // true = hito calculado (movimiento de socios); no editable ni borrable.
  derived: boolean;
};
type Entry = {
  id: string | null;
  month: number;
  milestones: Milestone[];
};
type Memoria = {
  id: string;
  year: number;
  periodStart: string;
  periodEnd: string;
  summary: string;
  status: "DRAFT" | "CLOSED";
  entries: Entry[];
};

const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

function fmtPeriod(startIso: string, endIso: string): string {
  const f = new Intl.DateTimeFormat("es-UY", { dateStyle: "short" });
  return `${f.format(new Date(startIso))} al ${f.format(new Date(endIso))}`;
}

export function MemoriasPanel({ memorias }: { memorias: Memoria[] }) {
  return (
    <div className="space-y-8">
      <NewMemoria />

      {memorias.length > 0 && (
        <div className="space-y-6">
          {memorias.map((m) => (
            <MemoriaCard key={m.id} memoria={m} />
          ))}
        </div>
      )}
    </div>
  );
}

function NewMemoria() {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <button className="btn btn-primary text-sm" onClick={() => setOpen(true)}>
        Nueva memoria
      </button>
    );
  }

  return (
    <form
      action={(fd) =>
        start(async () => {
          setError(null);
          const res = await createMemoria(fd);
          if (res?.error) setError(res.error);
          else setOpen(false);
        })
      }
      className="card flex items-end gap-3 flex-wrap"
    >
      <div>
        <label className="label">Año del ejercicio</label>
        <input
          type="number"
          name="year"
          min={2000}
          max={2100}
          defaultValue={new Date().getFullYear()}
          className="input w-32"
          autoFocus
        />
        <p className="text-xs text-[var(--muted-foreground)] mt-1">
          Período 01/04 al 31/03 del año siguiente.
        </p>
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

function MemoriaCard({ memoria }: { memoria: Memoria }) {
  const editable = memoria.status === "DRAFT";
  // Solo se muestran los meses con contenido (algún hito). Los vacíos no
  // aparecen. Para cargar en un mes sin hitos se usa el selector de "Agregar hito".
  const visibleMonths = memoria.entries.filter(
    (e) => e.milestones.length > 0,
  );

  return (
    <article className="card space-y-5">
      <header className="flex items-baseline justify-between gap-3 flex-wrap">
        <div>
          <h3 className="font-semibold text-lg">Ejercicio {memoria.year}</h3>
          <p className="text-sm text-[var(--muted-foreground)]">
            Período {fmtPeriod(memoria.periodStart, memoria.periodEnd)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={
              editable
                ? "text-sm text-[var(--primary)]"
                : "text-sm text-[var(--muted-foreground)]"
            }
          >
            {editable ? "borrador" : "cerrada"}
          </span>
          <MemoriaActions memoria={memoria} />
        </div>
      </header>

      <Summary memoria={memoria} editable={editable} />

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <h4 className="text-sm font-medium text-[var(--muted-foreground)]">
            Detalle mensual
          </h4>
          {editable && <AddMilestone memoriaId={memoria.id} />}
        </div>
        {visibleMonths.length > 0 ? (
          <div className="divide-y divide-[var(--border-subtle)]">
            {visibleMonths.map((e) => (
              <MonthRow
                key={e.month}
                month={e.month}
                entry={e}
                editable={editable}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--muted-foreground)]">
            Sin hitos en este ejercicio.
          </p>
        )}
      </div>
    </article>
  );
}

function Summary({
  memoria,
  editable,
}: {
  memoria: Memoria;
  editable: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!editing) {
    return (
      <div>
        <div className="flex items-center justify-between gap-3">
          <h4 className="text-sm font-medium text-[var(--muted-foreground)]">
            Resumen del ejercicio
          </h4>
          {editable && (
            <button
              className="btn btn-ghost text-xs"
              onClick={() => setEditing(true)}
            >
              {memoria.summary ? "Editar" : "Escribir"}
            </button>
          )}
        </div>
        <p className="text-sm whitespace-pre-wrap mt-1">
          {memoria.summary || (
            <span className="text-[var(--muted-foreground)]">
              Sin resumen todavía.
            </span>
          )}
        </p>
      </div>
    );
  }

  return (
    <form
      action={(fd) =>
        start(async () => {
          setError(null);
          fd.set("id", memoria.id);
          const res = await updateMemoriaSummary(fd);
          if (res?.error) setError(res.error);
          else setEditing(false);
        })
      }
      className="space-y-2"
    >
      <label className="label">Resumen del ejercicio</label>
      <textarea
        name="summary"
        defaultValue={memoria.summary}
        rows={4}
        className="input w-full"
        autoFocus
      />
      <div className="flex items-center gap-2">
        <SubmitWithSpinner className="btn btn-primary text-sm">
          Guardar
        </SubmitWithSpinner>
        <button
          type="button"
          className="btn btn-ghost text-sm"
          onClick={() => setEditing(false)}
          disabled={pending}
        >
          Cancelar
        </button>
      </div>
      {error && <p className="text-sm text-[var(--destructive)]">{error}</p>}
    </form>
  );
}

function MonthRow({
  month,
  entry,
  editable,
}: {
  month: number;
  entry: Entry;
  editable: boolean;
}) {
  return (
    <div className="py-3 space-y-2">
      <div className="text-sm font-medium">{MESES[month - 1]}</div>
      <ul className="space-y-1">
        {entry.milestones.map((h) => (
          <MilestoneItem key={h.id} milestone={h} editable={editable} />
        ))}
      </ul>
    </div>
  );
}

// Alta de hito a nivel memoria: se elige el mes y se cargan tema + desarrollo.
// Los meses del ejercicio van en orden cronológico (abril → marzo).
function AddMilestone({ memoriaId }: { memoriaId: string }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <button
        className="btn btn-ghost text-xs shrink-0"
        onClick={() => setOpen(true)}
      >
        Agregar hito
      </button>
    );
  }

  return (
    <form
      action={(fd) =>
        start(async () => {
          setError(null);
          fd.set("memoriaId", memoriaId);
          const res = await addMemoriaMilestone(fd);
          if (res?.error) setError(res.error);
          else setOpen(false);
        })
      }
      className="w-full space-y-2 border-l-2 border-[var(--border-subtle)] pl-3"
    >
      <div>
        <label className="label">Mes</label>
        <select name="month" className="input" defaultValue="4">
          {[4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3].map((m) => (
            <option key={m} value={m}>
              {MESES[m - 1]}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label">Tema</label>
        <input
          type="text"
          name="title"
          className="input w-full"
          placeholder="Título del hito"
        />
      </div>
      <div>
        <label className="label">Desarrollo</label>
        <textarea
          name="body"
          rows={3}
          className="input w-full"
          placeholder="Detalle del hito"
        />
      </div>
      <div className="flex items-center gap-2">
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
      {error && <p className="text-sm text-[var(--destructive)]">{error}</p>}
    </form>
  );
}

// Un hito ya cargado: se muestra tema + desarrollo; editable/borrable en borrador.
function MilestoneItem({
  milestone,
  editable,
}: {
  milestone: Milestone;
  editable: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (editing) {
    return (
      <li>
        <form
          action={(fd) =>
            start(async () => {
              setError(null);
              fd.set("id", milestone.id);
              const res = await updateMemoriaMilestone(fd);
              if (res?.error) setError(res.error);
              else setEditing(false);
            })
          }
          className="space-y-2 border-l-2 border-[var(--border-subtle)] pl-3"
        >
          <div>
            <label className="label">Tema</label>
            <input
              type="text"
              name="title"
              defaultValue={milestone.title}
              className="input w-full"
              autoFocus
            />
          </div>
          <div>
            <label className="label">Desarrollo</label>
            <textarea
              name="body"
              rows={3}
              defaultValue={milestone.body}
              className="input w-full"
            />
          </div>
          <div className="flex items-center gap-2">
            <SubmitWithSpinner className="btn btn-primary text-sm">
              Guardar
            </SubmitWithSpinner>
            <button
              type="button"
              className="btn btn-ghost text-sm"
              onClick={() => setEditing(false)}
              disabled={pending}
            >
              Cancelar
            </button>
            <DeleteMilestone id={milestone.id} />
          </div>
          {error && (
            <p className="text-sm text-[var(--destructive)]">{error}</p>
          )}
        </form>
      </li>
    );
  }

  return (
    <li className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="text-sm font-medium">{milestone.title}</div>
        {milestone.body && (
          <p className="text-sm text-[var(--muted-foreground)] whitespace-pre-wrap">
            {milestone.body}
          </p>
        )}
      </div>
      {/* Los hitos calculados (movimiento de socios) no se editan: salen de los
          datos de los socios. Solo los eventos cargados son editables. */}
      {editable && !milestone.derived && (
        <button
          className="btn btn-ghost text-xs shrink-0"
          onClick={() => setEditing(true)}
        >
          Editar
        </button>
      )}
    </li>
  );
}

function DeleteMilestone({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return (
    <ConfirmButton
      pending={pending}
      confirmLabel="¿Borrar hito?"
      onConfirm={() =>
        start(async () => {
          const fd = new FormData();
          fd.set("id", id);
          await deleteMemoriaMilestone(fd);
        })
      }
    >
      Borrar
    </ConfirmButton>
  );
}

function MemoriaActions({ memoria }: { memoria: Memoria }) {
  const [pending, start] = useTransition();

  function run(fn: (fd: FormData) => Promise<{ error?: string } | void>) {
    start(async () => {
      const fd = new FormData();
      fd.set("id", memoria.id);
      await fn(fd);
    });
  }

  return (
    <div className="flex items-center gap-2">
      {memoria.status === "DRAFT" ? (
        <button
          className="btn btn-secondary text-xs"
          disabled={pending}
          onClick={() => run(closeMemoria)}
        >
          Cerrar
        </button>
      ) : (
        <button
          className="btn btn-secondary text-xs"
          disabled={pending}
          onClick={() => run(reopenMemoria)}
        >
          Reabrir
        </button>
      )}
      <ConfirmButton
        pending={pending}
        confirmLabel="¿Borrar memoria?"
        onConfirm={() => run(deleteMemoria)}
      >
        Borrar
      </ConfirmButton>
    </div>
  );
}
