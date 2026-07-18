"use client";

import { useMemo, useRef, useState, useTransition } from "react";
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

  // Dentro de la cosecha: los contenedores con algún item activo arriba del
  // todo; dentro de cada grupo, por número ascendente.
  const ordered = useMemo(() => {
    const hasActive = (c: Container) => c.items.some((it) => it.active);
    return [...containers].sort((a, b) => {
      const aa = hasActive(a);
      const ba = hasActive(b);
      if (aa !== ba) return aa ? -1 : 1;
      return a.number - b.number;
    });
  }, [containers]);

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
          {ordered.map((c) => (
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
  const notesRef = useRef<HTMLInputElement>(null);
  const currentRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [saving, startSaving] = useTransition();
  // Estado activo/inactivo editado localmente: el botón lo alterna sin tocar la
  // DB; se persiste recién al Guardar.
  const [activeDraft, setActiveDraft] = useState<Record<string, boolean>>({});
  const isActive = (item: Item) => activeDraft[item.id] ?? item.active;

  function itemLocked(item: Item) {
    const free = Math.max(0, item.currentWeight - item.reservedAmount);
    return isActive(item) && item.reservedAmount > 0 && free <= 0;
  }

  function handleSave() {
    startSaving(async () => {
      // Actual editado de cada item: la diferencia contra el peso actual se
      // aplica como un movimiento (IN si subió, OUT si bajó).
      for (const item of c.items) {
        const raw = currentRefs.current[item.id]?.value ?? "";
        const next = parseFloat(raw);
        if (isNaN(next)) continue;
        const diff = next - item.currentWeight;
        if (Math.abs(diff) < 1e-6) continue;
        const mv = new FormData();
        mv.set("containerItemId", item.id);
        mv.set("type", diff > 0 ? "IN" : "OUT");
        mv.set("amount", String(Math.abs(diff)));
        await addMovementAction(mv);
      }

      // Active editado: solo los que cambiaron respecto al valor original.
      for (const item of c.items) {
        if (isActive(item) === item.active) continue;
        const fd = new FormData();
        fd.set("id", item.id);
        fd.set("active", String(item.active));
        await toggleContainerItemActiveAction(fd);
      }

      const fd = new FormData();
      fd.set("id", c.id);
      fd.set("notes", notesRef.current?.value ?? "");
      await updateContainerAction(fd);
      onToggle();
    });
  }

  function toggleActive(item: Item) {
    setActiveDraft((prev) => ({ ...prev, [item.id]: !isActive(item) }));
  }

  function deleteItem(item: Item) {
    if (!confirm("¿Eliminar este item y sus movimientos?")) return;
    const fd = new FormData();
    fd.set("id", item.id);
    startSaving(() => deleteContainerItemAction(fd));
  }

  return (
    <div className={`border-t border-[var(--border-subtle)] first-of-type:border-t-0 ${expanded ? "bg-[var(--surface-2)]" : ""}`}>
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
                  !isActive(item) ? "opacity-60" : ""
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
                  editing={expanded}
                  inputRef={(el) => {
                    currentRefs.current[item.id] = el;
                  }}
                />
                {expanded ? (
                  <button
                    onClick={() => toggleActive(item)}
                    className={`text-xs text-right hover:underline whitespace-nowrap ${
                      isActive(item)
                        ? "text-[var(--destructive)]"
                        : "text-[var(--primary)]"
                    }`}
                  >
                    {isActive(item) ? "Desactivar" : "Activar"}
                  </button>
                ) : (
                  <span className="text-right">
                    <ContainerState active={item.active} />
                  </span>
                )}
                {/* Botón de editar solo en la primera fila del contenedor. */}
                <span className="hidden sm:flex justify-end">
                  {!expanded && idx === 0 && (
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
          <div className="mb-4">
            <label className="label text-xs">Notas</label>
            <input
              ref={notesRef}
              name="notes"
              type="text"
              defaultValue={c.notes ?? ""}
              className="input text-sm py-1 w-64"
              placeholder="Notas del contenedor"
            />
          </div>

          <div className="flex items-center gap-2">
            <AddItem containerId={c.id} strains={strains} />
            <div className="ml-auto flex items-center gap-2">
              <button type="button" onClick={onToggle} className="btn btn-ghost text-xs">
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="btn btn-primary text-xs inline-flex items-center gap-2"
              >
                {saving && <SavingSpinner />}
                Guardar
              </button>
            </div>
          </div>
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
  editing = false,
  inputRef,
}: {
  reserved: number;
  current: number;
  initial: number;
  locked: boolean;
  editing?: boolean;
  inputRef?: (el: HTMLInputElement | null) => void;
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
      {editing ? (
        <span className="flex items-center justify-end gap-1">
          <input
            ref={inputRef}
            type="number"
            step="0.01"
            min={0}
            defaultValue={current}
            className="input text-sm py-1 !text-right tabular-nums !w-16 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span className="text-sm text-[var(--muted-foreground)]">g</span>
        </span>
      ) : (
        <span className="text-sm font-medium text-right tabular-nums">
          {formatGramos(current)}
        </span>
      )}
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
