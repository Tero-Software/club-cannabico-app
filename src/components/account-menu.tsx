"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export type AccountMenuItem = {
  href: string;
  label: string;
  icon?: React.ReactNode;
};

/**
 * Menú de cuenta estilo Claude Desktop: un botón en el pie del sidebar con el
 * ícono del tipo de admin (coronita para owner del tenant, escudo para admin) y
 * el nombre de pila. Al hacer clic despliega hacia arriba un popover estilo card
 * con las opciones de ajustes y el botón de salir.
 */
export function AccountMenu({
  name,
  isOwner,
  items,
  themeToggle,
  onSignOut,
}: {
  name: string;
  isOwner: boolean;
  items: AccountMenuItem[];
  themeToggle?: React.ReactNode;
  onSignOut: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Cierra al navegar.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Cierra al hacer clic fuera o con Escape.
  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const firstName = name.trim().split(/\s+/)[0] || name;

  return (
    <div ref={containerRef} className="relative">
      {open && (
        <div
          role="menu"
          className="absolute bottom-full left-0 right-0 mb-2 mx-2 overflow-hidden rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-3)] shadow-[var(--shadow-lg)] py-1 z-50"
        >
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              role="menuitem"
              className="flex items-center gap-2.5 h-9 px-3 text-sm text-[color-mix(in_oklab,var(--foreground)_62%,var(--muted-foreground))] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)] transition-colors"
            >
              {item.icon && (
                <span className="text-current opacity-80 shrink-0">{item.icon}</span>
              )}
              <span className="truncate">{item.label}</span>
            </Link>
          ))}
          <div className="my-1 h-px bg-[var(--border-subtle)]" />
          <div className="flex items-center justify-between gap-2">
            {onSignOut}
            {themeToggle && (
              <>
                <div className="w-px self-stretch -my-1 ml-auto bg-[var(--border-subtle)]" />
                <span className="shrink-0 pl-1 pr-3">{themeToggle}</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Línea completa que separa el footer de la navegación. */}
      <div className="h-px bg-[var(--border-subtle)]" />
      <div className="px-2 py-2">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={open}
          className="w-full flex items-center gap-2.5 h-9 px-2 rounded-md text-sm text-[var(--foreground)] hover:bg-[var(--surface-2)] transition-colors"
        >
          <span className="shrink-0">
            {isOwner ? <CrownIcon /> : <AdminIcon />}
          </span>
          <span className="truncate flex-1 text-left font-medium">{firstName}</span>
          <ChevronIcon />
        </button>
      </div>
    </div>
  );
}

function CrownIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="var(--accent-yellow)"
      stroke="var(--accent-yellow)"
      strokeWidth="1.2"
      strokeLinejoin="round"
      strokeLinecap="round"
      aria-label="owner"
    >
      <path d="M6 18h12l1-7-4 2.5L12 8l-3 5.5L5 11z" />
    </svg>
  );
}

function AdminIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-label="administrador"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function ChevronIcon() {
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
      className="shrink-0 opacity-60"
    >
      <polyline points="6 15 12 9 18 15" />
    </svg>
  );
}
