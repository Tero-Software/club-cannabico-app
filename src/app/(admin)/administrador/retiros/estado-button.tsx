"use client";

import { useState, useTransition } from "react";
import { updateWithdrawalStatusAction } from "./actions";
import { SavingSpinner } from "@/components/saving-spinner";

export function EstadoButton({
  id,
  status,
  label,
  variant,
}: {
  id: string;
  status: string;
  label: string;
  variant: "primary" | "secondary" | "destructive";
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    const fd = new FormData();
    fd.set("id", id);
    fd.set("estado", status);
    startTransition(async () => {
      const res = await updateWithdrawalStatusAction(fd);
      if (res && "error" in res && res.error) setError(res.error);
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className={`btn btn-${variant} text-sm inline-flex items-center gap-2`}
      >
        {pending && <SavingSpinner />}
        {label}
      </button>
      {error && (
        <span className="text-xs text-[var(--destructive)]">{error}</span>
      )}
    </div>
  );
}
