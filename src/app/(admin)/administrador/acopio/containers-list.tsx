"use client";

import { useState, useTransition } from "react";
import { formatGramos } from "@/lib/format";
import {
  addContainerItemAction,
  addMovementAction,
  deleteContainerItemAction,
  toggleContainerItemActiveAction,
  updateContainerAction,
} from "./actions";
import { SavingSpinner } from "@/components/ui/saving-spinner";
import { PencilIcon } from "@/components/ui/icons";

export type Movement = {
  id: string;
  type: string;
  amount: number;
  notes: string | null;
  createdAt: string;
};

export type Item = {
  id: string;
  strainName: string;
  strainId: string | null;
  plantNumber: string | null;
  initialWeight: number;
  currentWeight: number;
  active: boolean;
  reservedAmount: number;
  movements: Movement[];
};

export type Container = {
  id: string;
  number: number;
  notes: string | null;
  harvestId: string | null;
  harvestDate: string | null;
  items: Item[];
};

export type Strain = { id: string; name: string };

export function ContainersList({
  containers,
  strains,
  query = "",
}: {
  containers: Container[];
  strains: Strain[];
  query?: string;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const q = query.trim().toLowerCase();
  const filtered = q
    ? containers.filter((c) => {
        if (String(c.number).includes(q)) return true;
        return c.items.some((it) =>
          it.strainName.toLowerCase().includes(q),
        );
      })
    : containers;

  // Un bloque por cosecha (rotulado con su fecha), más reciente arriba. Los
  // contenedores sueltos (sin cosecha) van todos juntos en un bloque al final.
  const byHarvest = new Map<string, Container[]>();
  const sueltos: Container[] = [];
  for (const c of filtered) {
    if (!c.harvestId) {
      sueltos.push(c);
      continue;
    }
    const list = byHarvest.get(c.harvestId);
    if (list) list.push(c);
    else byHarvest.set(c.harvestId, [c]);
  }
  // Cosechas ordenadas por fecha descendente.
  const cosechas = [...byHarvest.entries()].sort((a, b) => {
    const da = a[1][0].harvestDate ?? "";
    const db = b[1][0].harvestDate ?? "";
    return db.localeCompare(da);
  });

  if (filtered.length === 0) {
    return (
      <div className="card px-5 py-6 text-sm text-[var(--muted-foreground)] text-center">
        Sin resultados para "{query}".
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-[var(--muted-foreground)] px-1">
        Cosechas
      </h2>

      {cosechas.map(([harvestId, list]) => (
        <Block
          key={harvestId}
          label={formatHarvestDate(list[0].harvestDate)}
          containers={list}
          strains={strains}
          expandedId={expandedId}
          setExpandedId={setExpandedId}
        />
      ))}
      {sueltos.length > 0 && (
        <Block
          label="Sin cosecha"
          containers={sueltos}
          strains={strains}
          expandedId={expandedId}
          setExpandedId={setExpandedId}
        />
      )}
    </div>
  );
}

/** Flecha estilo tree: apunta a la derecha y rota 90° hacia abajo al abrir. */
function TreeChevron({ open }: { open: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={`text-[var(--muted-foreground)] shrink-0 transition-transform duration-150 ${
        open ? "rotate-90" : ""
      }`}
    >
      <polyline points="9 6 15 12 9 18" />
    </svg>
  );
}

function formatHarvestDate(iso: string | null): string {
  if (!iso) return "Sin cosecha";
  return `Cosecha del ${new Intl.DateTimeFormat("es-UY", {
    dateStyle: "long",
  }).format(new Date(iso))}`;
}

function Block({
  label,
  containers,
  strains,
  expandedId,
  setExpandedId,
}: {
  label: string;
  containers: Container[];
  strains: Strain[];
  expandedId: string | null;
  setExpandedId: React.Dispatch<React.SetStateAction<string | null>>;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className="card p-0">
      {/* Header del bloque (fecha + nombres de columna) anclado arriba mientras
          la cosecha esté en pantalla; el bloque se lo lleva al terminar. */}
      <div className="sticky top-0 z-10 bg-[var(--surface-3)]">
        {/* Título del bloque: la fecha de la cosecha, con flecha tree que
            despliega/pliega sus contenedores. */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-[var(--surface-2)] transition-colors"
        >
          <span className="text-sm font-medium">{label}</span>
          <span className="ml-auto mr-3 text-xs text-[var(--muted-foreground)]">
            {containers.length} {containers.length === 1 ? "contenedor" : "contenedores"}
          </span>
          <span className="w-[1.3rem] flex justify-end shrink-0">
            <TreeChevron open={open} />
          </span>
        </button>

        {open && (
          <div className="hidden sm:grid sm:grid-cols-[4.0rem_1fr_7rem_7rem_7rem_7rem_5rem] gap-3 px-5 py-2 text-[0.7rem] font-normal text-[var(--fg-quaternary)] uppercase tracking-wide">
            <span>#</span>
            <span>Contenido</span>
            <span className="text-right">Reservado</span>
            <span className="text-right">Actual</span>
            <span className="text-right">Inicial</span>
            <span className="text-right">Estado</span>
            <span aria-hidden />
          </div>
        )}
      </div>

      {open && (
        <div>
          {containers.map((c) => (
            <ContainerRow
              key={c.id}
              container={c}
              strains={strains}
              expanded={expandedId === c.id}
              onToggle={() =>
                setExpandedId((prev) => (prev === c.id ? null : c.id))
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ContainerRow({
  container: c,
  strains,
  expanded,
  onToggle,
}: {
  container: Container;
  strains: Strain[];
  expanded: boolean;
  onToggle: () => void;
}) {
  const single = c.items.length <= 1;

  function itemLocked(item: Item) {
    const free = Math.max(0, item.currentWeight - item.reservedAmount);
    return item.active && item.reservedAmount > 0 && free <= 0;
  }

  return (
    <div className="border-t border-[var(--border-subtle)] first-of-type:border-t-0">
      <div className="relative">
        {(single ? c.items.slice(0, 1) : c.items).length === 0 ? (
          <div className="grid sm:grid-cols-[3.5rem_1fr_7rem_7rem_7rem_5rem_2.5rem] gap-1 sm:gap-3 items-center px-5 py-3">
            <span className="font-bold tabular-nums">{c.number}</span>
            <span className="text-sm text-[var(--muted-foreground)]">Vacío</span>
          </div>
        ) : (
          c.items.map((item, idx) => {
            const locked = itemLocked(item);
            return (
              <div
                key={item.id}
                className={`grid sm:grid-cols-[4.0rem_1fr_7rem_7rem_7rem_7rem_5rem] gap-1 sm:gap-3 items-center px-5 py-3 ${
                  !item.active ? "opacity-60" : ""
                } ${locked ? "bg-[color-mix(in_oklab,var(--destructive)_8%,transparent)]" : ""} ${
                  idx > 0 ? "border-t border-[var(--border-subtle)] sm:[border-image:linear-gradient(to_right,transparent_3.5rem,var(--border-subtle)_3.5rem,var(--border-subtle)_calc(100%-5rem),transparent_calc(100%-5rem))_1]" : ""
                }`}
              >
                <span className="font-bold tabular-nums">
                  {idx === 0 ? c.number : ""}
                </span>
                <span className="text-sm truncate">
                  {item.strainName}
                  {locked && (
                    <span className="ml-2 text-xs text-[var(--destructive)] font-semibold">
                      ⚠ No tocar
                    </span>
                  )}
                </span>
                <WeightCols
                  reserved={item.reservedAmount}
                  current={item.currentWeight}
                  initial={item.initialWeight}
                  locked={locked}
                />
                <span className="text-right">
                  <ContainerState active={item.active} />
                </span>
                {/* Botón de editar solo en la primera fila del contenedor. */}
                <span className="hidden sm:flex justify-end">
                  {idx === 0 && (
                    <EditButton expanded={expanded} onClick={onToggle} />
                  )}
                </span>
              </div>
            );
          })
        )}
        {/* En mobile el botón de editar va absoluto en la esquina. */}
        <div className="sm:hidden absolute top-2 right-3">
          <EditButton expanded={expanded} onClick={onToggle} />
        </div>
      </div>

      {expanded && (
        <div className="border-t border-[var(--border-subtle)] px-5 py-4 bg-[var(--surface-2)]">
          <div className="flex items-center gap-2 flex-wrap mb-4">
            <NotesEditor containerId={c.id} initialNotes={c.notes} />
          </div>

          {c.items.length === 0 ? (
            <p className="text-sm text-[var(--muted-foreground)] mb-3">
              Sin items.
            </p>
          ) : (
            <div className="card p-0 overflow-hidden mb-3">
              {c.items.map((item) => (
                <ItemRow key={item.id} item={item} />
              ))}
            </div>
          )}

          <AddItem containerId={c.id} strains={strains} />
        </div>
      )}
    </div>
  );
}

function WeightCols({
  reserved,
  current,
  initial,
  locked,
}: {
  reserved: number;
  current: number;
  initial: number;
  locked: boolean;
}) {
  return (
    <>
      <span
        className={`text-sm text-right tabular-nums hidden sm:block ${
          reserved > 0
            ? locked
              ? "text-[var(--destructive)] font-semibold"
              : "text-[var(--foreground)]"
            : "text-[var(--muted-foreground)]"
        }`}
      >
        {reserved > 0 ? formatGramos(reserved) : "—"}
      </span>
      <span className="text-sm font-medium text-right tabular-nums">
        {formatGramos(current)}
      </span>
      <span className="text-sm text-[var(--muted-foreground)] text-right tabular-nums hidden sm:block">
        {formatGramos(initial)}
      </span>
    </>
  );
}

function ContainerState({ active }: { active: boolean }) {
  return active ? (
    <span className="text-xs text-[var(--primary)]">Activo</span>
  ) : (
    <span className="text-xs text-[var(--muted-foreground)]">Inactivo</span>
  );
}

/** Botón de lápiz que abre/cierra el panel de edición del contenedor. */
function EditButton({
  expanded,
  onClick,
}: {
  expanded: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={expanded ? "Cerrar edición" : "Editar contenedor"}
      aria-expanded={expanded}
      className={`inline-flex items-center justify-center h-7 w-7 rounded-md transition-colors ${
        expanded
          ? "bg-[var(--surface-3)] text-[var(--foreground)]"
          : "text-[var(--muted-foreground)] hover:bg-[var(--surface-3)] hover:text-[var(--foreground)]"
      }`}
    >
      <PencilIcon />
    </button>
  );
}

function NotesEditor({
  containerId,
  initialNotes,
}: {
  containerId: string;
  initialNotes: string | null;
}) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="btn btn-ghost text-xs"
      >
        {initialNotes ? "Editar notas" : "+ Notas"}
      </button>
    );
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("id", containerId);
    fd.set("active", "on");
    startTransition(async () => {
      await updateContainerAction(fd);
      setEditing(false);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 flex-wrap">
      <input
        name="notes"
        type="text"
        defaultValue={initialNotes ?? ""}
        className="input text-sm py-1 w-64"
        placeholder="Notas del contenedor"
        autoFocus
      />
      <button
        type="submit"
        className="btn btn-primary text-xs inline-flex items-center gap-2"
        disabled={pending}
      >
        {pending && <SavingSpinner />}
        Guardar
      </button>
      <button type="button" onClick={() => setEditing(false)} className="btn btn-ghost text-xs">
        Cancelar
      </button>
    </form>
  );
}

function ItemRow({ item }: { item: Item }) {
  const [showAdjust, setShowAdjust] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const pct = item.initialWeight > 0 ? (item.currentWeight / item.initialWeight) * 100 : 0;

  function handleAdjust(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    fd.set("containerItemId", item.id);
    startTransition(async () => {
      const result = await addMovementAction(fd);
      if (result?.error) setError(result.error);
      else setShowAdjust(false);
    });
  }

  function handleDelete() {
    if (!confirm("¿Eliminar este item y sus movimientos?")) return;
    const fd = new FormData();
    fd.set("id", item.id);
    startTransition(() => deleteContainerItemAction(fd));
  }

  function handleToggleActive() {
    const fd = new FormData();
    fd.set("id", item.id);
    fd.set("active", String(item.active));
    startTransition(() => toggleContainerItemActiveAction(fd));
  }

  return (
    <div className="px-5 py-2.5 border-t border-[var(--border-subtle)] first-of-type:border-t-0">
      <div className="grid sm:grid-cols-[3.5rem_1fr_7rem_7rem_7rem_5rem] gap-1 sm:gap-3 items-center">
        <span className="hidden sm:block" aria-hidden />
        <span className="flex items-center gap-2 text-sm flex-wrap min-w-0">
          <span className="font-medium truncate">{item.strainName}</span>
        </span>
        <span
          className={`text-sm text-right tabular-nums hidden sm:block ${
            item.reservedAmount > 0
              ? "text-[var(--destructive)] font-medium"
              : "text-[var(--muted-foreground)]"
          }`}
        >
          {item.reservedAmount > 0 ? formatGramos(item.reservedAmount) : "—"}
        </span>
        <span className="text-sm font-semibold text-right tabular-nums">
          {formatGramos(item.currentWeight)}
        </span>
        <span className="text-sm text-[var(--muted-foreground)] text-right tabular-nums hidden sm:block">
          {formatGramos(item.initialWeight)}
        </span>
        <span className="hidden sm:block" aria-hidden />
      </div>
      {item.reservedAmount > 0 && (
        <div className="text-xs text-[var(--destructive)] mt-1 sm:hidden">
          Reservado: {formatGramos(item.reservedAmount)} · libre{" "}
          {formatGramos(Math.max(0, item.currentWeight - item.reservedAmount))}
        </div>
      )}
      <div className="w-full bg-[var(--muted)] h-1 mt-2">
        <div
          className="h-1 transition-all"
          style={{
            width: `${Math.max(pct, 1)}%`,
            background:
              pct > 50
                ? "var(--primary)"
                : pct > 20
                  ? "var(--warning)"
                  : "var(--destructive)",
          }}
        />
      </div>
      <div className="flex gap-2 mt-2 flex-wrap">
        <button
          onClick={handleToggleActive}
          className="btn btn-ghost text-xs px-2 py-0.5 inline-flex items-center gap-2"
          disabled={pending}
        >
          {pending && <SavingSpinner />}
          {item.active ? "Desactivar" : "Activar"}
        </button>
        <button
          onClick={() => { setShowAdjust(!showAdjust); setShowHistory(false); }}
          className="btn btn-ghost text-xs px-2 py-0.5"
        >
          Ajustar
        </button>
        <button
          onClick={() => { setShowHistory(!showHistory); setShowAdjust(false); }}
          className="btn btn-ghost text-xs px-2 py-0.5"
        >
          Movimientos ({item.movements.length})
        </button>
        <button
          onClick={handleDelete}
          className="btn btn-ghost text-xs px-2 py-0.5 text-[var(--destructive)] inline-flex items-center gap-2"
          disabled={pending}
        >
          {pending && <SavingSpinner />}
          Eliminar
        </button>
      </div>

      {showAdjust && (
        <form onSubmit={handleAdjust} className="flex items-end gap-2 flex-wrap mt-2 pt-2 border-t border-[var(--border)]">
          <div>
            <label className="label text-xs">Tipo</label>
            <select name="type" className="input w-24 text-sm py-1">
              <option value="OUT">Salida</option>
              <option value="IN">Entrada</option>
            </select>
          </div>
          <div>
            <label className="label text-xs">Cantidad (g)</label>
            <input name="amount" type="number" step="0.01" className="input w-24 text-sm py-1" required autoFocus />
          </div>
          <div>
            <label className="label text-xs">Notas</label>
            <input name="notes" type="text" className="input w-40 text-sm py-1" />
          </div>
          <button
            type="submit"
            className="btn btn-primary text-xs inline-flex items-center gap-2"
            disabled={pending}
          >
            {pending && <SavingSpinner />}
            Registrar
          </button>
          {error && <p className="text-xs text-[var(--destructive)] w-full">{error}</p>}
        </form>
      )}

      {showHistory && item.movements.length > 0 && (
        <div className="mt-2 pt-2 border-t border-[var(--border)]">
          <table className="w-full text-xs table-fixed">
            <colgroup>
              <col style={{ width: "20%" }} />
              <col style={{ width: "20%" }} />
              <col style={{ width: "20%" }} />
              <col style={{ width: "40%" }} />
            </colgroup>
            <thead>
              <tr className="text-[var(--muted-foreground)] text-left">
                <th className="pb-1">Fecha</th>
                <th className="pb-1">Tipo</th>
                <th className="pb-1">Cantidad</th>
                <th className="pb-1 text-right">Notas</th>
              </tr>
            </thead>
            <tbody>
              {item.movements.map((m) => (
                <tr key={m.id} className="border-t border-[var(--border)]">
                  <td className="py-1">
                    {new Date(m.createdAt).toLocaleDateString("es-AR", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="py-1">
                    <span className={m.type === "IN" ? "text-[var(--primary)]" : "text-[var(--destructive)]"}>
                      {m.type === "IN" ? "Entrada" : "Salida"}
                    </span>
                  </td>
                  <td className="py-1">{formatGramos(m.amount)}</td>
                  <td className="py-1 text-right text-[var(--muted-foreground)]">{m.notes ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function AddItem({ containerId, strains }: { containerId: string; strains: Strain[] }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn btn-secondary text-xs">
        + Agregar item
      </button>
    );
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    fd.set("containerId", containerId);
    startTransition(async () => {
      const result = await addContainerItemAction(fd);
      if (result?.error) setError(result.error);
      else setOpen(false);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2 flex-wrap bg-[var(--card)] border border-[var(--border)] p-3">
      <div>
        <label className="label text-xs">Genética</label>
        <select name="strainId" className="input w-40 text-sm py-1">
          <option value="">Sin genética</option>
          {strains.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label text-xs">Nro. planta</label>
        <input name="plantNumber" type="text" className="input w-24 text-sm py-1" />
      </div>
      <div>
        <label className="label text-xs">Peso (g)</label>
        <input name="weight" type="number" step="0.01" className="input w-24 text-sm py-1" required autoFocus />
      </div>
      <button
        type="submit"
        className="btn btn-primary text-xs inline-flex items-center gap-2"
        disabled={pending}
      >
        {pending && <SavingSpinner />}
        Agregar
      </button>
      <button type="button" onClick={() => setOpen(false)} className="btn btn-ghost text-xs">
        Cancelar
      </button>
      {error && <p className="text-xs text-[var(--destructive)] w-full">{error}</p>}
    </form>
  );
}
