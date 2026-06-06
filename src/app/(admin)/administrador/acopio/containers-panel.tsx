"use client";

import { useState } from "react";
import { Link } from "@/components/progress/link";
import { NewContainerForm } from "./new-container-form";
import { ContainersList, type Container, type Strain } from "./containers-list";

export function ContainersPanel({
  containers,
  strains,
  stats,
}: {
  containers: Container[];
  strains: Strain[];
  stats?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h1 className="text-3xl font-bold">Acopio</h1>
          <Link
            href="/administrador/geneticas"
            className="btn btn-secondary text-sm"
          >
            Editar genéticas
          </Link>
        </div>
        <p className="text-[var(--muted-foreground)]">
          Inventario de la cosecha — contenedores y existencias.
        </p>
      </div>

      {stats && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">{stats}</div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="relative flex-1 sm:max-w-md">
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)] pointer-events-none"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por genética o número…"
            className="input w-full pr-10 text-left"
          />
        </div>
        {!open && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="btn btn-secondary text-sm"
          >
            + Nuevo contenedor
          </button>
        )}
      </div>

      <NewContainerForm
        strains={strains}
        open={open}
        onClose={() => setOpen(false)}
      />

      {containers.length === 0 ? (
        <div className="text-center text-[var(--muted-foreground)] py-12 border border-[var(--border)] bg-[var(--card)]">
          No hay contenedores cargados.
        </div>
      ) : (
        <ContainersList
          containers={containers}
          strains={strains}
          query={query}
        />
      )}
    </div>
  );
}
