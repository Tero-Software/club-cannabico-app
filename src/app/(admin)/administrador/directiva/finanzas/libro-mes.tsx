"use client";

import { useState, useTransition } from "react";
import { deleteFinanceEntryAction } from "./actions";
import { formatMoney } from "@/lib/billing";
import { SavingSpinner } from "@/components/ui/saving-spinner";
import { DataTable, type Column } from "@/components/ui/data-table";

export type LibroEntry = {
  id: string;
  date: string;
  kind: "INGRESO" | "EGRESO";
  category: string;
  description: string;
  amount: number;
  fromWithdrawal: boolean;
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-UY", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function LibroMes({ entries }: { entries: LibroEntry[] }) {
  const totalIngresos = entries
    .filter((e) => e.kind === "INGRESO")
    .reduce((s, e) => s + e.amount, 0);
  const totalEgresos = entries
    .filter((e) => e.kind === "EGRESO")
    .reduce((s, e) => s + e.amount, 0);
  const saldo = totalIngresos - totalEgresos;

  if (entries.length === 0) {
    return (
      <div className="card text-center text-[var(--muted-foreground)] py-12">
        No hay movimientos en este mes.
      </div>
    );
  }

  const columns: Column<LibroEntry>[] = [
    {
      label: "Fecha",
      muted: true,
      cellClassName: "whitespace-nowrap",
      cell: (e) => fmtDate(e.date),
    },
    { label: "Rubro", cell: (e) => e.category },
    {
      label: "Descripción",
      cell: (e) => (
        <>
          {e.description}
          {e.fromWithdrawal && (
            <span className="ml-2 badge badge-completado text-xs">Retiro</span>
          )}
        </>
      ),
    },
    {
      label: "Debe",
      align: "right",
      cellClassName: "tabular-nums",
      cell: (e) => (e.kind === "EGRESO" ? formatMoney(e.amount) : "—"),
    },
    {
      label: "Haber",
      align: "right",
      cellClassName: "tabular-nums",
      cell: (e) => (e.kind === "INGRESO" ? formatMoney(e.amount) : "—"),
    },
    {
      label: "",
      align: "right",
      width: "3rem",
      cell: (e) => (!e.fromWithdrawal ? <DeleteButton id={e.id} /> : null),
    },
  ];

  return (
    <div className="space-y-4">
      <DataTable
        columns={columns}
        rows={entries}
        getRowKey={(e) => e.id}
        footer={
          <tr className="border-t-2 border-[var(--border)] font-medium">
            <td className="px-4 py-3" colSpan={3}>
              Totales del mes
            </td>
            <td className="px-4 py-3 text-right tabular-nums">{formatMoney(totalEgresos)}</td>
            <td className="px-4 py-3 text-right tabular-nums">{formatMoney(totalIngresos)}</td>
            <td className="px-4 py-3" />
          </tr>
        }
      />

      <div className="card flex items-center justify-between">
        <span className="font-medium">Saldo del mes</span>
        <span
          className={`text-lg font-semibold tabular-nums ${
            saldo < 0 ? "text-[var(--destructive)]" : ""
          }`}
        >
          {formatMoney(saldo)}
        </span>
      </div>
    </div>
  );
}

function DeleteButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    if (!confirm("¿Eliminar este movimiento?")) return;
    setError(null);
    const fd = new FormData();
    fd.set("id", id);
    startTransition(async () => {
      const res = await deleteFinanceEntryAction(fd);
      if (res && "error" in res && res.error) setError(res.error);
    });
  }

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleDelete}
        disabled={pending}
        className="text-[var(--destructive)] text-sm inline-flex items-center gap-1"
        aria-label="Eliminar movimiento"
      >
        {pending ? <SavingSpinner /> : "✕"}
      </button>
      {error && <span className="text-xs text-[var(--destructive)] max-w-[12rem]">{error}</span>}
    </span>
  );
}
