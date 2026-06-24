"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  crearRetiroAdminAction,
  type CrearRetiroAdminState,
} from "./actions";
import { SavingSpinner } from "@/components/ui/saving-spinner";

type Socio = { id: string; name: string; email: string };
type Strain = { id: string; name: string };

export function NuevoRetiroHeader({
  title,
  subtitle,
  socios,
  strains,
  horarios,
}: {
  title: string;
  subtitle?: string;
  socios: Socio[];
  strains: Strain[];
  horarios: string[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mb-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold mb-1">{title}</h1>
          {subtitle && (
            <p className="text-[var(--muted-foreground)]">{subtitle}</p>
          )}
        </div>
        {!open && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="btn btn-secondary text-base px-5 py-2.5"
          >
            + Nuevo retiro
          </button>
        )}
      </div>

      {open && (
        <div className="border border-[var(--border)] bg-[var(--card)] p-4 mt-4 w-full">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Nuevo retiro</h2>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="btn btn-ghost text-sm"
            >
              Cancelar
            </button>
          </div>
          <NuevoRetiroForm
            socios={socios}
            strains={strains}
            horarios={horarios}
            onCreated={() => setOpen(false)}
          />
        </div>
      )}
    </div>
  );
}

type Item = { strainId: string; amount: number };

function normalizar(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function SocioCombobox({
  socios,
  error,
}: {
  socios: Socio[];
  error?: string;
}) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const q = normalizar(query.trim());
  const filtered = q
    ? socios.filter(
        (s) =>
          normalizar(s.name).includes(q) || normalizar(s.email).includes(q),
      )
    : socios;

  const select = (s: Socio) => {
    setSelectedId(s.id);
    setQuery(`${s.name} — ${s.email}`);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <input type="hidden" name="userId" value={selectedId} />
      <input
        id="nr-user-search"
        type="text"
        autoComplete="off"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setSelectedId("");
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Buscar socio por nombre o email…"
        className="input"
      />
      {open && filtered.length > 0 && (
        <ul className="absolute z-20 left-0 right-0 mt-1 max-h-60 overflow-auto border border-[var(--border)] bg-[var(--card)] shadow-lg">
          {filtered.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => select(s)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-[var(--muted)]"
              >
                <span className="font-medium">{s.name}</span>
                <span className="text-[var(--muted-foreground)]"> — {s.email}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {open && filtered.length === 0 && (
        <div className="absolute z-20 left-0 right-0 mt-1 border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--muted-foreground)]">
          Sin coincidencias
        </div>
      )}
      {error && (
        <p className="text-sm text-[var(--destructive)] mt-1">{error}</p>
      )}
    </div>
  );
}

function NuevoRetiroForm({
  socios,
  strains,
  horarios,
  onCreated,
}: {
  socios: Socio[];
  strains: Strain[];
  horarios: string[];
  onCreated?: () => void;
}) {
  const [state, formAction, pending] = useActionState<
    CrearRetiroAdminState,
    FormData
  >(crearRetiroAdminAction, null);
  const formRef = useRef<HTMLFormElement>(null);
  const [items, setItems] = useState<Item[]>([{ strainId: "", amount: 10 }]);

  useEffect(() => {
    if (state?.ok) {
      formRef.current?.reset();
      setItems([{ strainId: "", amount: 10 }]);
      onCreated?.();
    }
  }, [state, onCreated]);

  const addItem = () => setItems((v) => [...v, { strainId: "", amount: 10 }]);
  const removeItem = (i: number) =>
    setItems((v) => v.filter((_, idx) => idx !== i));
  const updateItem = (i: number, patch: Partial<Item>) =>
    setItems((v) => v.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));

  const total = items.reduce((s, i) => s + (i.amount || 0), 0);

  return (
    <form action={formAction} ref={formRef} className="flex flex-col gap-3">
      <input type="hidden" name="items" value={JSON.stringify(items)} />

      <div>
        <label htmlFor="nr-user-search" className="label">Socio</label>
        <SocioCombobox
          socios={socios}
          error={state?.fieldErrors?.userId}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="nr-fecha" className="label">Fecha</label>
          <input
            id="nr-fecha"
            name="fecha"
            type="date"
            required
            className="input"
            onClick={(e) => {
              const el = e.currentTarget as HTMLInputElement & {
                showPicker?: () => void;
              };
              el.showPicker?.();
            }}
            onFocus={(e) => {
              const el = e.currentTarget as HTMLInputElement & {
                showPicker?: () => void;
              };
              el.showPicker?.();
            }}
          />
          {state?.fieldErrors?.date && (
            <p className="text-sm text-[var(--destructive)] mt-1">
              {state.fieldErrors.date}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="nr-horario" className="label">Horario</label>
          <select
            id="nr-horario"
            name="horario"
            required
            className="input"
            defaultValue=""
          >
            <option value="" disabled>
              Seleccioná un horario
            </option>
            {horarios.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
          {state?.fieldErrors?.timeSlot && (
            <p className="text-sm text-[var(--destructive)] mt-1">
              {state.fieldErrors.timeSlot}
            </p>
          )}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="label mb-0">Variedades</span>
          <span className="text-sm text-[var(--muted-foreground)]">
            Total: {total} g
          </span>
        </div>
        <div className="flex flex-col gap-2">
          {items.map((it, i) => (
            <div key={i} className="flex gap-2 items-start">
              <select
                value={it.strainId}
                onChange={(e) => updateItem(i, { strainId: e.target.value })}
                required
                className="input flex-1"
              >
                <option value="" disabled>
                  Genética
                </option>
                {strains.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <select
                value={it.amount}
                onChange={(e) =>
                  updateItem(i, { amount: Number(e.target.value) })
                }
                className="input w-24"
              >
                {[10, 20, 30, 40].map((n) => (
                  <option key={n} value={n}>
                    {n} g
                  </option>
                ))}
              </select>
              {items.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeItem(i)}
                  className="btn btn-ghost text-sm"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addItem}
          className="btn btn-ghost text-sm mt-2"
        >
          + Agregar variedad
        </button>
      </div>

      <div>
        <label htmlFor="nr-notas" className="label">Notas</label>
        <textarea id="nr-notas" name="notas" rows={2} className="input" />
      </div>

      {state?.error && (
        <p className="text-sm text-[var(--destructive)]">{state.error}</p>
      )}
      {state?.ok && (
        <p className="text-sm text-[var(--success)]">✓ Retiro creado</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="btn btn-primary inline-flex items-center justify-center gap-2"
      >
        {pending && <SavingSpinner />}
        Crear retiro
      </button>
    </form>
  );
}
