"use client";

import { useState, useTransition } from "react";
import { promoverASocioAction } from "./actions";
import { SavingSpinner } from "@/components/saving-spinner";

export function PromoteForm({
  socios,
}: {
  socios: { id: string; name: string; email: string }[];
}) {
  const [pending, startTransition] = useTransition();
  const [value, setValue] = useState("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!value) return;
    const fd = new FormData();
    fd.set("id", value);
    startTransition(async () => {
      await promoverASocioAction(fd);
      setValue("");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="card">
      <label htmlFor="socio-id" className="label">
        Seleccionar socio
      </label>
      <div className="flex gap-2">
        <select
          id="socio-id"
          name="id"
          required
          className="input flex-1"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        >
          <option value="" disabled>
            Elegir socio
          </option>
          {socios.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} — {s.email}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="btn btn-primary text-sm inline-flex items-center gap-2"
          disabled={pending || !value}
        >
          {pending && <SavingSpinner />}
          Promover
        </button>
      </div>
      <p className="text-xs text-[var(--muted-foreground)] mt-2">
        Arranca sin permisos. Asignalos en la sección de arriba.
      </p>
    </form>
  );
}
