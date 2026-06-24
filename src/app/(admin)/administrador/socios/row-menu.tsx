"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { toggleSocioActivoAction } from "./actions";
import { SavingSpinner } from "@/components/ui/saving-spinner";

export function SocioRowMenu({
  id,
  active,
}: {
  id: string;
  active: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  function toggleActivo() {
    const fd = new FormData();
    fd.set("id", id);
    startTransition(() => toggleSocioActivoAction(fd));
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Más opciones"
        className="btn btn-ghost text-lg px-2 py-1 leading-none"
      >
        ⋯
      </button>
      {open && (
        <div className="absolute right-0 mt-1 z-20 min-w-44 border border-[var(--border)] bg-[var(--card)] shadow-lg">
          <Link
            href={`/administrador/socios/${id}?edit=1`}
            className="block w-full text-left px-3 py-2 text-sm hover:bg-[var(--muted)]"
            onClick={() => setOpen(false)}
          >
            Editar socio
          </Link>
          <button
            type="button"
            onClick={toggleActivo}
            disabled={pending}
            className="w-full text-left px-3 py-2 text-sm hover:bg-[var(--muted)] disabled:opacity-60 inline-flex items-center gap-2"
          >
            {pending && <SavingSpinner />}
            {active ? "Desactivar socio" : "Activar socio"}
          </button>
        </div>
      )}
    </div>
  );
}
