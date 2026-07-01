"use client";

import { useState, useTransition } from "react";
import { approveWithdrawalAction, updatePaymentAction } from "./actions";
import { SavingSpinner } from "@/components/ui/saving-spinner";

type PlanOption = { id: string; name: string };

// Panel de forma de pago de un retiro. Dos modos:
//  - "aprobar": retiro PENDING → el admin verifica pago y plan y aprueba.
//  - "editar": retiro ya APPROVED/COMPLETED → corrige pago y plan (recalcula
//    el monto). Vacío en el plan = se usa el que le corresponde al socio.
export function AprobarCobro({
  id,
  plans,
  mode = "aprobar",
  initialPaid = true,
  initialPlanId = "",
}: {
  id: string;
  plans: PlanOption[];
  mode?: "aprobar" | "editar";
  initialPaid?: boolean;
  initialPlanId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [paid, setPaid] = useState(initialPaid);
  const [planId, setPlanId] = useState(initialPlanId);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isEdit = mode === "editar";

  function submit() {
    setError(null);
    const fd = new FormData();
    fd.set("id", id);
    fd.set("paid", paid ? "true" : "false");
    fd.set("planId", planId);
    startTransition(async () => {
      const res = isEdit
        ? await updatePaymentAction(fd)
        : await approveWithdrawalAction(fd);
      if (res && "error" in res && res.error) setError(res.error);
      else setOpen(false);
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        className={`btn text-sm ${isEdit ? "btn-ghost" : "btn-primary"}`}
        onClick={() => setOpen(true)}
      >
        {isEdit ? "Editar pago" : "Aprobar"}
      </button>
    );
  }

  const confirmLabel = isEdit ? "Guardar" : "Aprobar";

  return (
    <div className="w-full border-t border-[var(--border)] pt-3 mt-1 flex flex-col gap-3">
      <div>
        <span className="label">Forma de pago</span>
        <div className="flex gap-2 mt-1">
          <button
            type="button"
            onClick={() => setPaid(true)}
            className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
              paid
                ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                : "border-[var(--border)] hover:bg-[var(--muted)]"
            }`}
          >
            Pagó
          </button>
          <button
            type="button"
            onClick={() => setPaid(false)}
            className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
              !paid
                ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                : "border-[var(--border)] hover:bg-[var(--muted)]"
            }`}
          >
            No pagó
          </button>
        </div>
      </div>

      <div>
        <label className="label">Plan que se cobra</label>
        <select className="input" value={planId} onChange={(e) => setPlanId(e.target.value)}>
          <option value="">Plan del socio (por defecto)</option>
          {plans.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="text-sm text-[var(--destructive)]">{error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          className="btn btn-primary text-sm inline-flex items-center gap-2"
          onClick={submit}
          disabled={pending}
        >
          {pending && <SavingSpinner />}
          {confirmLabel}
        </button>
        <button type="button" className="btn btn-ghost text-sm" onClick={() => setOpen(false)} disabled={pending}>
          Cancelar
        </button>
      </div>
    </div>
  );
}
