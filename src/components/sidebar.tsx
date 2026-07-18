"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export type SidebarItem = {
  href: string;
  label: string;
  icon?: React.ReactNode;
  badge?: number;
  /** Gravedad de la notificación → color del badge. Por defecto verde. */
  badgeColor?: "ok" | "warning" | "danger";
  alert?: boolean;
};

const BADGE_BG: Record<NonNullable<SidebarItem["badgeColor"]>, string> = {
  ok: "var(--primary)",
  warning: "var(--warning)",
  danger: "var(--destructive)",
};

export type SidebarSection = {
  /** Título de la sección. Si se omite, los ítems van sin encabezado. */
  title?: string;
  items: SidebarItem[];
};

type Theme = "dark" | "light";

/**
 * Sidebar fijo estilo Linear: superficie atenuada respecto al contenido,
 * navegación vertical densa, estado activo con el acento. En mobile colapsa
 * a un panel off-canvas con backdrop.
 */
export function Sidebar({
  brand,
  sections,
  footer,
}: {
  brand: React.ReactNode;
  sections: SidebarSection[];
  footer?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  // Retraído en desktop: se guarda la preferencia para que persista entre visitas.
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    setCollapsed(localStorage.getItem("sidebar-collapsed") === "1");
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((c) => {
      const next = !c;
      localStorage.setItem("sidebar-collapsed", next ? "1" : "0");
      return next;
    });
  };

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const nav = (
    <nav className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-4 no-scrollbar">
      {sections.map((section, i) => (
        <SidebarGroup key={section.title ?? i} section={section} pathname={pathname} />
      ))}
    </nav>
  );

  return (
    <>
      {/* Barra mobile: solo el toggle y la marca. Sobre el canvas. */}
      <div className="lg:hidden sticky top-0 z-30 flex items-center gap-2 px-4 h-14 bg-[var(--background)]">
        <button
          type="button"
          aria-label="Abrir menú"
          aria-expanded={open}
          onClick={() => setOpen(true)}
          className="p-2 -ml-2 rounded-md hover:bg-[var(--surface-2)] transition-colors text-[var(--foreground)]"
        >
          <BurgerIcon />
        </button>
        <div className="min-w-0">{brand}</div>
      </div>

      {/* Botón para volver a mostrar el sidebar cuando está retraído (desktop). */}
      {collapsed && (
        <button
          type="button"
          aria-label="Mostrar menú"
          onClick={toggleCollapsed}
          className="hidden lg:flex fixed top-3 left-3 z-30 items-center justify-center h-8 w-8 rounded-md bg-[var(--surface-2)] text-[var(--muted-foreground)] hover:bg-[var(--surface-3)] hover:text-[var(--foreground)] transition-colors"
        >
          <SidebarToggleIcon collapsed />
        </button>
      )}

      {/* Sidebar desktop: misma superficie que el panel de contenido
          (--surface-2), separados solo por la línea de borde del panel. */}
      {!collapsed && (
        <aside className="hidden lg:flex flex-col w-72 shrink-0 h-screen sticky top-0 bg-[var(--surface-2)]">
          <div className="px-4 pt-5 pb-3 flex items-center gap-2 shrink-0">
            <div className="min-w-0 flex-1">{brand}</div>
            <button
              type="button"
              aria-label="Retraer menú"
              onClick={toggleCollapsed}
              className="inline-flex items-center justify-center h-7 w-7 rounded-md text-[var(--muted-foreground)] hover:bg-[var(--surface-3)] hover:text-[var(--foreground)] transition-colors shrink-0"
            >
              <SidebarToggleIcon collapsed={false} />
            </button>
          </div>
          {nav}
          {footer && <div className="shrink-0">{footer}</div>}
        </aside>
      )}

      {/* Off-canvas mobile */}
      {open && (
        <>
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-40"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <aside className="lg:hidden fixed top-0 left-0 bottom-0 w-64 max-w-[85vw] bg-[var(--surface-1)] border-r border-[var(--border-subtle)] z-50 flex flex-col">
            <div className="px-4 h-14 flex items-center justify-between border-b border-[var(--border-subtle)] shrink-0">
              <div className="min-w-0">{brand}</div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Cerrar menú"
                className="p-2 -mr-2 rounded-md hover:bg-[var(--surface-2)] transition-colors"
              >
                <CloseIcon />
              </button>
            </div>
            {nav}
            {footer && (
              <div className="border-t border-[var(--border-subtle)] px-3 py-2 shrink-0">
                {footer}
              </div>
            )}
          </aside>
        </>
      )}
    </>
  );
}

/**
 * Grupo del sidebar. Si tiene título, es plegable con un header (label tenue +
 * chevron), como los grupos "Workspace" / "Favorites" de Linear. Sin título,
 * los ítems van sueltos arriba (navegación global).
 */
function SidebarGroup({
  section,
  pathname,
}: {
  section: SidebarSection;
  pathname: string;
}) {
  const [open, setOpen] = useState(true);

  if (!section.title) {
    return (
      <div className="flex flex-col gap-0.5">
        {section.items.map((item) => (
          <SidebarLink key={item.href} item={item} active={isActive(pathname, item.href)} />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0.5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="group flex items-center gap-1 px-2 h-6 rounded text-[0.7rem] font-normal text-[color-mix(in_oklab,var(--muted-foreground)_70%,transparent)] hover:text-[var(--muted-foreground)] transition-colors"
      >
        <span>{section.title}</span>
        <ChevronIcon open={open} />
      </button>
      {open &&
        section.items.map((item) => (
          <SidebarLink key={item.href} item={item} active={isActive(pathname, item.href)} />
        ))}
    </div>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={`shrink-0 transition-transform duration-150 ${open ? "" : "-rotate-90"}`}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function SidebarLink({ item, active }: { item: SidebarItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={`group relative flex items-center gap-2.5 h-8 px-2 rounded-md text-sm transition-colors ${
        active
          ? "bg-[var(--surface-3)] text-[var(--foreground)] font-medium"
          : "text-[color-mix(in_oklab,var(--foreground)_62%,var(--muted-foreground))] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]"
      }`}
    >
      {active && (
        <span
          aria-hidden
          className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-0.5 rounded-full bg-[var(--primary)]"
        />
      )}
      {item.icon && (
        <span className={active ? "text-[var(--primary)]" : "text-current opacity-80"}>
          {item.icon}
        </span>
      )}
      <span className="truncate flex-1">{item.label}</span>
      {item.badge ? (
        <span
          className={`ml-auto inline-flex items-center justify-center min-w-[1.125rem] h-[1.125rem] px-1 rounded-full text-[0.65rem] font-semibold ${
            item.badgeColor === "warning" ? "text-black" : "text-white"
          }`}
          style={{ background: BADGE_BG[item.badgeColor ?? "ok"] }}
        >
          {item.badge}
        </span>
      ) : item.alert ? (
        <span className="ml-auto inline-flex items-center justify-center min-w-[1.125rem] h-[1.125rem] px-1 rounded-full text-xs font-bold leading-none bg-[var(--destructive)] text-white">
          !
        </span>
      ) : null}
    </Link>
  );
}

/** Activo si la ruta coincide exacto o es un descendiente. */
function isActive(pathname: string, href: string): boolean {
  if (pathname === href) return true;
  return pathname.startsWith(href + "/");
}

/** Ícono minimalista de retraer/expandir: panel con la barra lateral marcada. */
function SidebarToggleIcon({ collapsed: _collapsed }: { collapsed: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <line x1="9" y1="4" x2="9" y2="20" />
    </svg>
  );
}

function BurgerIcon() {
  return (
    <svg
      width="20"
      height="20"
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
      width="20"
      height="20"
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
