"use client";

import { useState } from "react";
import Link from "next/link";
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
  const [query, setQuery] = useState("");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-3xl font-bold">Acopio</h1>
        <Link
          href="/administrador/operativa/geneticas"
          className="btn btn-secondary text-sm"
        >
          Editar genéticas
        </Link>
      </div>

      {stats}

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
