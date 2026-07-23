"use client";

import { useTransition } from "react";
import { cancelarRetiroAction } from "./actions";
import { SavingSpinner } from "@/components/ui/saving-spinner";

export function CancelButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm("¿Cancelar este retiro?")) return;
    const fd = new FormData();
    fd.set("id", id);
    startTransition(() => cancelarRetiroAction(fd));
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="btn btn-ghost text-sm text-[var(--destructive)] disabled:opacity-50 inline-flex items-center gap-2"
    >
      {pending && <SavingSpinner />}
      Cancelar
    </button>
  );
}
