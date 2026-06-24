"use client";

import { useState, useTransition } from "react";
import {
  PERMISSIONS,
  PERMISSION_LABELS,
  type Permission,
} from "@/lib/permissions";
import {
  actualizarPermisosAction,
  degradarAdminAction,
  otorgarOwnerAction,
} from "./actions";
import { SavingSpinner } from "@/components/ui/saving-spinner";

export function AdminCard({
  id,
  name,
  email,
  permissions,
  esTuyo,
  isOwner,
  viewerIsOwner,
  viewerPermissions,
}: {
  id: string;
  name: string;
  email: string;
  permissions: string[];
  esTuyo: boolean;
  isOwner: boolean;
  viewerIsOwner: boolean;
  viewerPermissions: string[];
}) {
  const locked = isOwner && !esTuyo;
  const canGrantOwner = viewerIsOwner && !isOwner && !esTuyo;
  const visiblePermissions: readonly Permission[] = viewerIsOwner
    ? PERMISSIONS
    : PERMISSIONS.filter((p) => viewerPermissions.includes(p));
  const [selected, setSelected] = useState<Set<string>>(new Set(permissions));
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function togglePerm(p: Permission, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(p);
      else next.delete(p);
      return next;
    });
    setSaved(false);
  }

  function handleSave() {
    const fd = new FormData();
    fd.set("id", id);
    for (const p of visiblePermissions) {
      if (selected.has(p)) fd.append("permissions", p);
    }
    startTransition(async () => {
      await actualizarPermisosAction(fd);
      setSaved(true);
    });
  }

  function handleDemote() {
    if (!confirm(`¿Quitar rol admin a ${name}?`)) return;
    const fd = new FormData();
    fd.set("id", id);
    startTransition(() => {
      degradarAdminAction(fd);
    });
  }

  function handleGrantOwner() {
    if (!confirm(`¿Otorgar rol owner a ${name}?`)) return;
    const fd = new FormData();
    fd.set("id", id);
    startTransition(() => {
      otorgarOwnerAction(fd);
    });
  }

  return (
    <div className="card">
      <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
        <div>
          <div className="font-medium">{name}</div>
          <div className="text-sm text-[var(--muted-foreground)]">{email}</div>
        </div>
        <div className="flex items-center gap-3">
          {isOwner && (
            <span className="text-[10px] uppercase tracking-wider bg-[var(--accent-yellow)] text-black px-1.5 py-0.5 rounded font-semibold">
              owner
            </span>
          )}
          {canGrantOwner && (
            <button
              type="button"
              onClick={handleGrantOwner}
              disabled={pending}
              className="text-xs text-[var(--primary-hover)] hover:underline disabled:opacity-50 inline-flex items-center gap-2"
            >
              {pending && <SavingSpinner />}
              Hacer owner
            </button>
          )}
          {!esTuyo && !locked && (
            <button
              type="button"
              onClick={handleDemote}
              disabled={pending}
              className="text-xs text-[var(--destructive)] hover:underline disabled:opacity-50 inline-flex items-center gap-2"
            >
              {pending && <SavingSpinner />}
              Quitar rol admin
            </button>
          )}
        </div>
      </div>
      <div className="border-t border-[var(--border-subtle)] -mx-6" />
      <div className={`grid sm:grid-cols-2 gap-2 pt-5 ${!esTuyo && !locked ? "pb-5" : ""}`}>
        {visiblePermissions.map((p) => (
          <label key={p} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={selected.has(p)}
              disabled={esTuyo || locked}
              onChange={(e) => togglePerm(p, e.target.checked)}
            />
            <span>{PERMISSION_LABELS[p]}</span>
          </label>
        ))}
      </div>
      {!esTuyo && !locked && (
        <div className="flex items-center justify-end gap-3">
          {saved && !pending && (
            <span className="text-xs text-[var(--muted-foreground)]">
              Guardado
            </span>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={pending}
            className="btn btn-primary text-sm inline-flex items-center gap-2"
          >
            {pending && <SavingSpinner />}
            Guardar permisos
          </button>
        </div>
      )}
      {locked && (
        <p className="text-xs text-[var(--muted-foreground)]">
          Los permisos del owner solo puede editarlos él mismo.
        </p>
      )}
    </div>
  );
}
