"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatGramos } from "@/lib/format";
import { PencilIcon } from "@/components/ui/icons";

type CosechaStock = {
  id: string;
  harvestDate: string | null;
  stock: number;
};

type GeneticaStock = {
  id: string;
  name: string;
  photo: string | null;
  description: string | null;
  disponible: number;
};

function formatHarvestLabel(iso: string | null): string {
  if (!iso) return "Sin cosecha";
  return `Cosecha del ${new Intl.DateTimeFormat("es-UY", {
    dateStyle: "long",
  }).format(new Date(iso))}`;
}

/**
 * Filas de resumen del acopio, cada una desplegable a un detalle:
 * stock actual → disponible por cosecha; genéticas → cada genética disponible
 * con su foto y lo que queda.
 */
export function AcopioStats({
  stockTotal,
  geneticasCount,
  cosechaStock,
  geneticaStock,
}: {
  stockTotal: number;
  geneticasCount: number;
  cosechaStock: CosechaStock[];
  geneticaStock: GeneticaStock[];
}) {
  return (
    <div className="card p-0 overflow-hidden">
      <StatRow
        label="Stock actual"
        value={formatGramos(stockTotal)}
        detail={
          <>
            {cosechaStock.map((c) => (
              <DetailRow
                key={c.id}
                left={formatHarvestLabel(c.harvestDate)}
                right={formatGramos(c.stock)}
              />
            ))}
          </>
        }
      />
      <StatRow
        label="Genéticas disponibles"
        value={`${geneticasCount}`}
        detail={
          <>
            {geneticaStock.map((g) => (
              <div key={g.id} className="flex items-center gap-3 px-5 py-2.5">
                {g.photo ? (
                  <Image
                    src={g.photo}
                    alt=""
                    width={40}
                    height={40}
                    className="h-10 w-10 rounded-[var(--radius-md)] object-cover shrink-0 border border-[var(--border)]"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-[var(--radius-md)] bg-[var(--surface-1)] border border-[var(--border)] shrink-0" />
                )}
                <div className="flex items-baseline gap-2 flex-1 min-w-0">
                  <span className="text-sm shrink-0">{g.name}</span>
                  {g.description && (
                    // Comienzo de la descripción, en la misma línea, con
                    // desvanecido al final donde se corta (máscara de gradiente).
                    <span className="text-[0.6875rem] leading-tight text-[var(--muted-foreground)] whitespace-nowrap overflow-hidden [mask-image:linear-gradient(to_right,black_70%,transparent)]">
                      {g.description}
                    </span>
                  )}
                </div>
                <span className="text-sm font-medium tabular-nums shrink-0 mr-2">
                  {formatGramos(g.disponible)}
                </span>
                <Link
                  href={`/administrador/operativa/geneticas?editar=${g.id}`}
                  aria-label={`Editar ${g.name}`}
                  className="inline-flex items-center justify-center h-7 w-7 rounded-md text-[var(--muted-foreground)] hover:bg-[var(--surface-3)] hover:text-[var(--foreground)] transition-colors shrink-0"
                >
                  <PencilIcon />
                </Link>
              </div>
            ))}
          </>
        }
      />
    </div>
  );
}

/** Fila de resumen desplegable: chevron tipo tree que rota al abrir. */
function StatRow({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-t border-[var(--border-subtle)] first-of-type:border-t-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-3 px-5 py-3 text-left hover:bg-[var(--surface-2)] transition-colors"
      >
        <span className="text-sm text-[var(--muted-foreground)]">{label}</span>
        <span className="flex items-center">
          <span className="text-lg font-semibold mr-6">{value}</span>
          <ChevronIcon open={open} />
        </span>
      </button>
      {open && (
        <div className="bg-[var(--surface-2)] border-t border-[var(--border-subtle)] [&>*+*]:border-t [&>*+*]:border-[var(--border-subtle)]">
          {detail}
        </div>
      )}
    </div>
  );
}

function DetailRow({ left, right }: { left: string; right: string }) {
  return (
    <div className="flex items-center justify-between gap-3 px-5 h-10">
      <span className="text-sm text-[var(--muted-foreground)] truncate">{left}</span>
      <span className="text-sm font-medium tabular-nums shrink-0">{right}</span>
    </div>
  );
}

/** Chevron estilo tree: apunta a la derecha y rota 90° hacia abajo al abrir. */
function ChevronIcon({ open }: { open: boolean }) {
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
