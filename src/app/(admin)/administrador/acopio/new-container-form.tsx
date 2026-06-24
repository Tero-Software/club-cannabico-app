"use client";

import { useState, useTransition } from "react";
import { createContainerAction } from "./actions";
import type { Strain } from "./containers-list";
import { SavingSpinner } from "@/components/ui/saving-spinner";

type DraftItem = {
  strainId: string;
  plantNumber: string;
  weight: string;
};

function emptyItem(): DraftItem {
  return { strainId: "", plantNumber: "", weight: "" };
}

export function NewContainerForm({
  strains,
  open,
  onClose,
}: {
  strains: Strain[];
  open: boolean;
  onClose: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [number, setNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<DraftItem[]>([emptyItem()]);

  function reset() {
    setNumber("");
    setNotes("");
    setItems([emptyItem()]);
    setError(null);
  }

  function close() {
    reset();
    onClose();
  }

  function updateItem(idx: number, patch: Partial<DraftItem>) {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }

  function addItem() {
    setItems((prev) => [...prev, emptyItem()]);
  }

  function removeItem(idx: number) {
    setItems((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== idx)));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const cleanItems = items
      .map((it) => ({
        strainId: it.strainId || null,
        plantNumber: it.plantNumber.trim() || null,
        weight: parseFloat(it.weight),
      }))
      .filter((it) => !isNaN(it.weight) && it.weight > 0);

    const fd = new FormData();
    fd.set("number", number);
    fd.set("notes", notes);
    fd.set("items", JSON.stringify(cleanItems));

    startTransition(async () => {
      const result = await createContainerAction(fd);
      if (result?.error) setError(result.error);
      else close();
    });
  }

  if (!open) return null;

  return (
    <form
      onSubmit={handleSubmit}
      className="border border-[var(--border)] bg-[var(--card)] p-4 space-y-4 w-full"
    >
      <div className="flex items-end gap-3 flex-wrap">
        <div>
          <label className="label">Número</label>
          <input
            type="number"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            className="input w-24"
            required
            autoFocus
          />
        </div>
        <div className="flex-1 min-w-[12rem]">
          <label className="label">Notas</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="input w-full"
            placeholder="Opcional"
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="label mb-0">Contenido</span>
          <button
            type="button"
            onClick={addItem}
            className="btn btn-secondary text-xs"
          >
            + Agregar genética
          </button>
        </div>
        <div className="flex flex-col gap-2">
          {items.map((it, idx) => (
            <div
              key={idx}
              className="flex items-end gap-2 flex-wrap border border-[var(--border)] bg-[var(--background)] p-3"
            >
              <div className="flex-1 min-w-[10rem]">
                <label className="label text-xs">Genética</label>
                <select
                  value={it.strainId}
                  onChange={(e) =>
                    updateItem(idx, { strainId: e.target.value })
                  }
                  className="input w-full text-sm py-1"
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
                <label className="label text-xs">Nro. planta</label>
                <input
                  type="text"
                  value={it.plantNumber}
                  onChange={(e) =>
                    updateItem(idx, { plantNumber: e.target.value })
                  }
                  className="input w-24 text-sm py-1"
                />
              </div>
              <div>
                <label className="label text-xs">Peso (g)</label>
                <input
                  type="number"
                  step="0.01"
                  value={it.weight}
                  onChange={(e) =>
                    updateItem(idx, { weight: e.target.value })
                  }
                  className="input w-24 text-sm py-1"
                />
              </div>
              {items.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeItem(idx)}
                  className="btn btn-ghost text-xs text-[var(--destructive)]"
                >
                  Quitar
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="submit"
          className="btn btn-primary text-sm inline-flex items-center gap-2"
          disabled={pending}
        >
          {pending && <SavingSpinner />}
          Crear contenedor
        </button>
        <button type="button" onClick={close} className="btn btn-ghost text-sm">
          Cancelar
        </button>
        {error && (
          <p className="text-sm text-[var(--destructive)] w-full">{error}</p>
        )}
      </div>
    </form>
  );
}
