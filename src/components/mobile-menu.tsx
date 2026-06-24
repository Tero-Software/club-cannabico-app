"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BadgeCount } from "@/components/ui/badge-count";

export type MobileMenuLink = { href: string; label: string; badge?: number };

export function MobileMenu({
  links,
  children,
}: {
  links: MobileMenuLink[];
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-label={open ? "Cerrar menú" : "Abrir menú"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-md hover:bg-[var(--muted)] transition-colors text-[var(--foreground)]"
      >
        {open ? <CloseIcon /> : <BurgerIcon />}
        {!open && (
          <BadgeCount
            count={links.reduce((s, l) => s + (l.badge ?? 0), 0)}
          />
        )}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="fixed top-0 right-0 bottom-0 w-72 max-w-[85vw] bg-[var(--card)] border-l border-[var(--border)] z-50 flex flex-col">
            <div className="flex items-center justify-end p-3 border-b border-[var(--border)]">
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Cerrar menú"
                className="p-2 rounded-md hover:bg-[var(--muted)] transition-colors"
              >
                <CloseIcon />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-3 flex flex-col gap-1">
              {links.map((l) => {
                const active = pathname === l.href;
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    className={`relative flex items-center justify-between px-3 py-2.5 rounded-md text-sm transition-colors ${
                      active
                        ? "bg-[var(--primary)] text-white"
                        : "hover:bg-[var(--muted)]"
                    }`}
                  >
                    <span>{l.label}</span>
                    {l.badge ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-red)] dot-pulse" />
                    ) : null}
                  </Link>
                );
              })}
            </nav>
            {children && (
              <div className="border-t border-[var(--border)] p-3 flex items-center gap-2 flex-wrap">
                {children}
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}

function BurgerIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M6 6l12 12M6 18L18 6" />
    </svg>
  );
}
