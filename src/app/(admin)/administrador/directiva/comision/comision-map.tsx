"use client";

import { useState, useTransition } from "react";
import { assignCargo } from "./actions";

type Socio = { id: string; name: string };
type Row = { cargo: string; label: string; socio: Socio | null };

export function ComisionMap({
  rows,
  socios,
}: {
  rows: Row[];
  socios: Socio[];
}) {
  return (
    <div className="card p-0 overflow-hidden divide-y divide-[var(--border-subtle)]">
      {rows.map((row) => (
        <CargoRow key={row.cargo} row={row} socios={socios} />
      ))}
    </div>
  );
}

function CargoRow({ row, socios }: { row: Row; socios: Socio[] }) {
  const [editing, setEditing] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function save(userId: string) {
    start(async () => {
      setError(null);
      const fd = new FormData();
      fd.set("cargo", row.cargo);
      fd.set("userId", userId);
      const res = await assignCargo(fd);
      if (res?.error) setError(res.error);
      else setEditing(false);
    });
  }

  if (editing) {
    return (
      <div className="flex items-center justify-between gap-3 px-5 py-3">
        <span className="text-sm font-medium shrink-0">{row.label}</span>
        <div className="flex flex-col items-end gap-1">
          <select
            className="input text-sm min-w-[12rem]"
            defaultValue={row.socio?.id ?? ""}
            disabled={pending}
            autoFocus
            onChange={(e) => save(e.target.value)}
          >
            <option value="">— Vacante —</option>
            {socios.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          {error && (
            <span className="text-xs text-[var(--destructive)]">{error}</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="group flex items-center justify-between gap-3 px-5 py-3">
      <span className="text-sm font-medium shrink-0">{row.label}</span>
      <div className="flex items-center gap-2 min-w-0">
        <span
          className={`text-sm truncate ${
            row.socio ? "" : "text-[var(--muted-foreground)] italic"
          }`}
        >
          {row.socio?.name ?? "Vacante"}
        </span>
        <button
          type="button"
          aria-label={`Editar ${row.label}`}
          className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity shrink-0"
          onClick={() => setEditing(true)}
        >
          <PencilIcon />
        </button>
      </div>
    </div>
  );
}

function PencilIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z" />
    </svg>
  );
}
