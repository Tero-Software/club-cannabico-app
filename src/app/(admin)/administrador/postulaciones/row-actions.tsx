"use client";

import { useState, useTransition } from "react";
import {
  aprobarPostulacionAction,
  rechazarPostulacionAction,
  eliminarPostulacionAction,
} from "./actions";
import { SavingSpinner } from "@/components/ui/saving-spinner";

export function AprobarButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  const [password, setPassword] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (password) {
    return (
      <div className="mt-3 p-3 rounded-lg bg-[color-mix(in_oklab,var(--primary)_12%,transparent)] text-sm">
        <div className="font-medium mb-1">Socio creado</div>
        <div className="text-[var(--muted-foreground)] mb-2">
          Contraseña temporal — copiala y enviala al socio:
        </div>
        <code className="block bg-[var(--card)] border border-[var(--border)] p-2 rounded font-mono text-sm select-all">
          {password}
        </code>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        disabled={pending}
        className="btn btn-primary text-sm inline-flex items-center gap-2"
        onClick={() => {
          setError(null);
          const fd = new FormData();
          fd.set("id", id);
          startTransition(async () => {
            const res = await aprobarPostulacionAction(fd);
            if (res.error) setError(res.error);
            else if (res.passwordTemporal)
              setPassword(res.passwordTemporal);
          });
        }}
      >
        {pending && <SavingSpinner />}
        Aprobar y crear socio
      </button>
      {error && (
        <p className="text-sm text-[var(--destructive)] mt-2">{error}</p>
      )}
    </div>
  );
}

export function RechazarForm({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        const fd = new FormData();
        fd.set("id", id);
        startTransition(() => rechazarPostulacionAction(fd));
      }}
      className="btn btn-ghost text-sm inline-flex items-center gap-2"
    >
      {pending && <SavingSpinner />}
      Rechazar
    </button>
  );
}

export function EliminarForm({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!confirm("¿Eliminar esta postulación?")) return;
        const fd = new FormData();
        fd.set("id", id);
        startTransition(() => eliminarPostulacionAction(fd));
      }}
      className="text-xs text-[var(--destructive)] hover:underline disabled:opacity-50 inline-flex items-center gap-2"
    >
      {pending && <SavingSpinner />}
      Eliminar
    </button>
  );
}
