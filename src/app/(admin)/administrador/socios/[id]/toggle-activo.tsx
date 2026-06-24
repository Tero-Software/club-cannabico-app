"use client";

import { useTransition } from "react";
import { toggleSocioActivoAction } from "../actions";
import { SavingSpinner } from "@/components/ui/saving-spinner";

export function ToggleActivoSection({
  id,
  active,
}: {
  id: string;
  active: boolean;
}) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    const msg = active
      ? "¿Desactivar este socio? No podrá loguearse."
      : "¿Activar este socio?";
    if (!confirm(msg)) return;
    const fd = new FormData();
    fd.set("id", id);
    startTransition(() => toggleSocioActivoAction(fd));
  }

  return (
    <section className="mt-12 pt-6 border-t border-[var(--border)]">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="font-medium mb-1">
            {active ? "Desactivar socio" : "Activar socio"}
          </div>
          <p className="text-sm text-[var(--muted-foreground)]">
            {active
              ? "Bloquea el acceso al panel. El socio no podrá loguearse."
              : "Permite que el socio vuelva a loguearse."}
          </p>
        </div>
        <button
          type="button"
          onClick={handleClick}
          disabled={pending}
          className={`${active ? "btn btn-destructive" : "btn btn-primary"} inline-flex items-center gap-2`}
        >
          {pending && <SavingSpinner />}
          {active ? "Desactivar socio" : "Activar socio"}
        </button>
      </div>
    </section>
  );
}
