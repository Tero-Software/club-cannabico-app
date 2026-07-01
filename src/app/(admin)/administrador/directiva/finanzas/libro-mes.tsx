"use client";

import { useState, useTransition } from "react";
import { deleteFinanceEntryAction } from "./actions";
import { formatMoney } from "@/lib/billing";
import { SavingSpinner } from "@/components/ui/saving-spinner";

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

  return (
    <div className="space-y-4">
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--muted)] text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium">Rubro</th>
                <th className="px-4 py-3 font-medium">Descripción</th>
                <th className="px-4 py-3 font-medium text-right">Debe</th>
                <th className="px-4 py-3 font-medium text-right">Haber</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id} className="border-t border-[var(--border)]">
                  <td className="px-4 py-2.5 whitespace-nowrap text-[var(--muted-foreground)]">
                    {fmtDate(e.date)}
                  </td>
                  <td className="px-4 py-2.5">{e.category}</td>
                  <td className="px-4 py-2.5">
                    {e.description}
                    {e.fromWithdrawal && (
                      <span className="ml-2 badge badge-completado text-xs">Retiro</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums">
                    {e.kind === "EGRESO" ? formatMoney(e.amount) : "—"}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums">
                    {e.kind === "INGRESO" ? formatMoney(e.amount) : "—"}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {!e.fromWithdrawal && <DeleteButton id={e.id} />}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-[var(--border)] font-medium">
                <td className="px-4 py-3" colSpan={3}>
                  Totales del mes
                </td>
                <td className="px-4 py-3 text-right tabular-nums">{formatMoney(totalEgresos)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{formatMoney(totalIngresos)}</td>
                <td className="px-4 py-3" />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

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
