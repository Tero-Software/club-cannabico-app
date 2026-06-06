"use client";

import { useState, useTransition } from "react";
import { formatGramos } from "@/lib/format";
import {
  addContainerItemAction,
  addMovementAction,
  deleteContainerItemAction,
  toggleContainerActiveAction,
  updateContainerAction,
} from "./actions";
import { SavingSpinner } from "@/components/saving-spinner";

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
  reservedAmount: number;
  movements: Movement[];
};

export type Container = {
  id: string;
  number: number;
  notes: string | null;
  active: boolean;
  items: Item[];
};

export type Strain = { id: string; name: string };

function formatPlant(raw: string | null): string | null {
  if (!raw) return null;
  const n = raw.replace(/^p/i, "").trim();
  return n ? `Planta ${n}` : null;
}

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

  return (
    <div className="flex flex-col gap-px">
      <div className="hidden sm:grid sm:grid-cols-[3.5rem_1fr_7rem_7rem_7rem_5rem] gap-3 px-4 py-2 text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">
        <span>#</span>
        <span>Contenido</span>
        <span className="text-right">Reservado</span>
        <span className="text-right">Actual</span>
        <span className="text-right">Inicial</span>
        <span className="text-right">Estado</span>
      </div>
      {filtered.length === 0 ? (
        <div className="px-4 py-6 text-sm text-[var(--muted-foreground)] text-center border border-[var(--border)] bg-[var(--card)]">
          Sin resultados para "{query}".
        </div>
      ) : (
        filtered.map((c) => (
          <ContainerRow
            key={c.id}
            container={c}
            strains={strains}
            expanded={expandedId === c.id}
            onToggle={() => setExpandedId((prev) => (prev === c.id ? null : c.id))}
          />
        ))
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
  const [pending, startTransition] = useTransition();
  const currentTotal = c.items.reduce((s, i) => s + i.currentWeight, 0);
  const initialTotal = c.items.reduce((s, i) => s + i.initialWeight, 0);
  const reservedTotal = c.items.reduce((s, i) => s + i.reservedAmount, 0);
  const freeTotal = Math.max(0, currentTotal - reservedTotal);
  const locked = c.active && reservedTotal > 0 && freeTotal <= 0;
  const contents = c.items.map((i) => {
    const plant = formatPlant(i.plantNumber);
    return plant ? `${i.strainName} · ${plant}` : i.strainName;
  });

  function handleToggleActive(e: React.MouseEvent) {
    e.stopPropagation();
    const fd = new FormData();
    fd.set("id", c.id);
    fd.set("active", String(c.active));
    startTransition(() => toggleContainerActiveAction(fd));
  }

  return (
    <div
      className={`bg-[var(--card)] border ${
        locked
          ? "border-[var(--destructive)]"
          : "border-[var(--border)]"
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        className={`w-full grid sm:grid-cols-[3.5rem_1fr_7rem_7rem_7rem_5rem] gap-1 sm:gap-3 px-4 py-3 hover:bg-[var(--muted)] transition-colors text-left ${
          !c.active ? "opacity-60" : ""
        }`}
      >
        <span className="font-bold tabular-nums">{c.number}</span>
        <span className="text-sm truncate">
          {contents.length > 0 ? contents.join(", ") : "Vacío"}
          {locked && (
            <span className="ml-2 text-xs text-[var(--destructive)] font-semibold">
              ⚠ No tocar
            </span>
          )}
        </span>
        <span
          className={`text-sm text-right tabular-nums hidden sm:block ${
            reservedTotal > 0
              ? locked
                ? "text-[var(--destructive)] font-semibold"
                : "text-[var(--foreground)]"
              : "text-[var(--muted-foreground)]"
          }`}
        >
          {reservedTotal > 0 ? formatGramos(reservedTotal) : "—"}
        </span>
        <span className="text-sm font-medium text-right tabular-nums">
          {formatGramos(currentTotal)}
        </span>
        <span className="text-sm text-[var(--muted-foreground)] text-right tabular-nums hidden sm:block">
          {formatGramos(initialTotal)}
        </span>
        <span className="text-right">
          {c.active ? (
            <span className="text-xs text-[var(--primary)]">Activo</span>
          ) : (
            <span className="text-xs text-[var(--muted-foreground)]">Inactivo</span>
          )}
        </span>
      </button>

      {expanded && (
        <div className="border-t border-[var(--border)] px-4 py-4 bg-[var(--muted)]">
          <div className="flex items-center gap-2 flex-wrap mb-4">
            <button
              type="button"
              onClick={handleToggleActive}
              className="btn btn-secondary text-xs inline-flex items-center gap-2"
              disabled={pending}
            >
              {pending && <SavingSpinner />}
              {c.active ? "Desactivar" : "Activar"}
            </button>
            <NotesEditor containerId={c.id} initialNotes={c.notes} />
          </div>

          {c.items.length === 0 ? (
            <p className="text-sm text-[var(--muted-foreground)] mb-3">
              Sin items.
            </p>
          ) : (
            <div className="flex flex-col gap-px mb-3">
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

  return (
    <div className="bg-[var(--card)] border border-[var(--border)] px-3 py-2">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 text-sm flex-wrap">
          <span className="font-medium">{item.strainName}</span>
          {formatPlant(item.plantNumber) && (
            <span className="text-xs text-[var(--muted-foreground)]">
              {formatPlant(item.plantNumber)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="font-semibold tabular-nums">
            {formatGramos(item.currentWeight)}
          </span>
          <span className="text-xs text-[var(--muted-foreground)] tabular-nums">
            / {formatGramos(item.initialWeight)}
          </span>
        </div>
      </div>
      {item.reservedAmount > 0 && (
        <div className="text-xs text-[var(--destructive)] mt-1">
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
