"use client";

import { useState } from "react";
import { NuevaGeneticaForm } from "./nuevo-form";
import { createProductoAction } from "./actions";

export function GeneticasHeader() {
  const [open, setOpen] = useState(false);

  return (
    <div className="mb-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <h1 className="text-3xl font-bold">Genéticas</h1>
        {!open && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="btn btn-secondary text-sm"
          >
            + Nueva genética
          </button>
        )}
      </div>

      {open && (
        <div className="border border-[var(--border)] bg-[var(--card)] p-4 mt-4 w-full">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Nueva genética</h2>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="btn btn-ghost text-sm"
            >
              Cancelar
            </button>
          </div>
          <NuevaGeneticaForm
            action={createProductoAction}
            onCreated={() => setOpen(false)}
          />
        </div>
      )}
    </div>
  );
}
