"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import {
  createSocioAction,
  createVisitorInviteAction,
  type CreateSocioState,
  type CreateVisitorInviteState,
} from "./actions";
import { BadgeCount } from "@/components/ui/badge-count";
import { SavingSpinner } from "@/components/ui/saving-spinner";

export function NuevoSocioHeader({
  title,
  subtitle,
  pendingPostulaciones = 0,
}: {
  title: string;
  subtitle?: string;
  pendingPostulaciones?: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mb-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold mb-1">{title}</h1>
          {subtitle && (
            <p className="text-[var(--muted-foreground)]">{subtitle}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          {!open && (
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="btn btn-secondary text-base px-5 py-2.5"
            >
              + Nuevo socio
            </button>
          )}
          <Link
            href="/administrador/postulaciones"
            className="relative btn btn-ghost text-sm"
          >
            Postulaciones
            <BadgeCount count={pendingPostulaciones} />
          </Link>
        </div>
      </div>

      {open && (
        <div className="border border-[var(--border)] bg-[var(--card)] p-4 mt-4 w-full">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Nuevo socio</h2>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="btn btn-ghost text-sm"
            >
              Cancelar
            </button>
          </div>
          <NuevoSocioForm onCreated={() => setOpen(false)} />
          <div className="border-t border-[var(--border)] mt-6 pt-4">
            <VisitorInviteSection />
          </div>
        </div>
      )}
    </div>
  );
}

function VisitorInviteSection() {
  const [state, formAction, pending] = useActionState<
    CreateVisitorInviteState,
    FormData
  >(createVisitorInviteAction, null);
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!state?.url) return;
    try {
      await navigator.clipboard.writeText(state.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  }

  return (
    <div>
      <h3 className="font-semibold mb-1">Acceso de visitante</h3>
      <p className="text-sm text-[var(--muted-foreground)] mb-3">
        Generá un link de acceso temporal. Caduca en 24 h o al primer uso, lo que pase primero.
      </p>
      <form action={formAction}>
        <button
          type="submit"
          disabled={pending}
          className="btn btn-ghost text-sm inline-flex items-center gap-2"
        >
          {pending && <SavingSpinner />}
          Generar link de visita
        </button>
      </form>
      {state?.error && (
        <p className="text-sm text-[var(--destructive)] mt-2">{state.error}</p>
      )}
      {state?.ok && state.url && (
        <div className="mt-3 flex flex-col gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <input
              readOnly
              value={state.url}
              className="input flex-1 min-w-0 text-sm font-mono"
              onFocus={(e) => e.currentTarget.select()}
            />
            <button
              type="button"
              onClick={handleCopy}
              className="btn btn-secondary text-sm"
            >
              {copied ? "Copiado" : "Copiar"}
            </button>
          </div>
          {state.expiresAt && (
            <p className="text-xs text-[var(--muted-foreground)]">
              Vence: {new Date(state.expiresAt).toLocaleString("es-AR")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function NuevoSocioForm({ onCreated }: { onCreated?: () => void }) {
  const [state, formAction, pending] = useActionState<CreateSocioState, FormData>(
    createSocioAction,
    null,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) {
      formRef.current?.reset();
      onCreated?.();
    }
  }, [state, onCreated]);

  return (
    <form action={formAction} ref={formRef} className="flex flex-col gap-3">
      <div>
        <label htmlFor="ns-name" className="label">Nombre</label>
        <input
          id="ns-name"
          name="name"
          required
          className="input"
          placeholder="Nombre y apellido"
        />
        {state?.fieldErrors?.name && (
          <p className="text-sm text-[var(--destructive)] mt-1">
            {state.fieldErrors.name}
          </p>
        )}
      </div>
      <div>
        <label htmlFor="ns-email" className="label">Email</label>
        <input
          id="ns-email"
          name="email"
          type="email"
          required
          className="input"
          placeholder="socio@ejemplo.com"
        />
        {state?.fieldErrors?.email && (
          <p className="text-sm text-[var(--destructive)] mt-1">
            {state.fieldErrors.email}
          </p>
        )}
      </div>
      <div>
        <label htmlFor="ns-phone" className="label">Teléfono</label>
        <input
          id="ns-phone"
          name="phone"
          className="input"
          placeholder="+598 9x xxx xxx"
        />
        {state?.fieldErrors?.phone && (
          <p className="text-sm text-[var(--destructive)] mt-1">
            {state.fieldErrors.phone}
          </p>
        )}
      </div>
      <div>
        <label htmlFor="ns-password" className="label">Contraseña</label>
        <input
          id="ns-password"
          name="password"
          type="text"
          required
          className="input"
          autoComplete="new-password"
        />
        {state?.fieldErrors?.password && (
          <p className="text-sm text-[var(--destructive)] mt-1">
            {state.fieldErrors.password}
          </p>
        )}
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="mustChangePassword" defaultChecked />
        Forzar cambio de contraseña al primer login
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="active" defaultChecked />
        Activo
      </label>
      {state?.error && (
        <p className="text-sm text-[var(--destructive)]">{state.error}</p>
      )}
      {state?.ok && (
        <p className="text-sm text-[var(--success)]">✓ Socio creado</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="btn btn-primary inline-flex items-center justify-center gap-2"
      >
        {pending && <SavingSpinner />}
        Crear socio
      </button>
    </form>
  );
}
