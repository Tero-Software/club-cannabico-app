"use client";

import { useState, useTransition } from "react";
import { setSocioPlanAction } from "../actions";
import { SavingSpinner } from "@/components/ui/saving-spinner";

type PlanOption = { id: string; name: string };

export function PlanSelector({
  socioId,
  planId,
  defaultPlanName,
  plans,
}: {
  socioId: string;
  planId: string | null;
  defaultPlanName: string | null;
  plans: PlanOption[];
}) {
  const [value, setValue] = useState(planId ?? "");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function save(next: string) {
    setValue(next);
    setError(null);
    setSaved(false);
    const fd = new FormData();
    fd.set("id", socioId);
    fd.set("planId", next);
    startTransition(async () => {
      const res = await setSocioPlanAction(fd);
      if (res && "error" in res && res.error) setError(res.error);
      else {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    });
  }

  return (
    <div className="card mb-8">
      <div className="flex items-center justify-between gap-3 mb-2">
        <h2 className="text-xl font-semibold">Membresía</h2>
        {pending && <SavingSpinner />}
        {saved && !pending && <span className="text-xs text-[var(--muted-foreground)]">Guardado</span>}
      </div>
      <p className="text-sm text-[var(--muted-foreground)] mb-3">
        Plan propio del socio. Si está en{" "}
        <span className="font-medium">Plan por defecto del club</span>, se aplica el del club
        {defaultPlanName ? ` (${defaultPlanName})` : " (todavía sin definir)"}.
      </p>
      <select
        className="input"
        value={value}
        onChange={(e) => save(e.target.value)}
        disabled={pending}
      >
        <option value="">Plan por defecto del club</option>
        {plans.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      {error && <p className="text-sm text-[var(--destructive)] mt-2">{error}</p>}
    </div>
  );
}
