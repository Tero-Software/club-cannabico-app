import { Link } from "@/components/progress/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { MobileMenu } from "@/components/mobile-menu";
import { SettingsMenu } from "@/components/settings-menu";
import { BadgeCount } from "@/components/badge-count";
import { can } from "@/lib/permissions";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/socio");
  if (session.user.mustChangePassword) {
    const fresh = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { mustChangePassword: true },
    });
    if (fresh?.mustChangePassword) redirect("/cambiar-password");
  }

  const username = session.user.email?.split("@")[0] ?? "admin";

  const [pendingRetiros, pendingPostulaciones, viewer] =
    await Promise.all([
      can(session, "retiros:manage")
        ? prisma.withdrawal.count({ where: { status: "PENDING" } })
        : 0,
      can(session, "postulaciones:manage")
        ? prisma.application.count({ where: { status: "PENDING" } })
        : 0,
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: { isOwner: true },
      }),
    ]);
  const isOwner = !!viewer?.isOwner;

  const navLinks: { href: string; label: string; show: boolean; badge: number }[] = [
    {
      href: "/administrador/retiros",
      label: "Retiros",
      show: can(session, "retiros:manage"),
      badge: pendingRetiros,
    },
    {
      href: "/administrador/acopio",
      label: "Acopio",
      show: can(session, "containers:manage"),
      badge: 0,
    },
    {
      href: "/administrador/socios",
      label: "Socios",
      show: can(session, "socios:manage"),
      badge: pendingPostulaciones,
    },
  ];

  const settingsLinks: { href: string; label: string; show: boolean; badge: number }[] = [
    {
      href: "/administrador/estadisticas",
      label: "Estadísticas",
      show: can(session, "estadisticas:view"),
      badge: 0,
    },
    {
      href: "/administrador/administradores",
      label: "Administradores",
      show: can(session, "admins:manage"),
      badge: 0,
    },
    { href: "/administrador/seguridad", label: "Seguridad", show: true, badge: 0 },
    { href: "/administrador/configuracion", label: "Configuración", show: true, badge: 0 },
  ];

  const visibleNav = navLinks.filter((l) => l.show);
  const visibleSettings = settingsLinks.filter((l) => l.show);
  const allMobileLinks = [
    ...visibleNav.map((l) => ({ href: l.href, label: l.label, badge: l.badge })),
    ...visibleSettings.map((l) => ({ href: l.href, label: l.label, badge: l.badge })),
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-[var(--border)] bg-[var(--card)] sticky top-0 z-10">
        <div className="w-[90vw] mx-auto py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Logo href="/administrador" hideText />
            <span className="ml-3 inline-flex items-center text-xs leading-none bg-[var(--accent-yellow)] text-black px-2 pt-[7px] pb-[5px] rounded-full font-medium uppercase tracking-[0.2em] truncate max-w-[10rem] [text-indent:0.2em]">
              {username}
            </span>
            {isOwner && (
              <span className="ml-[5px]">
                <CrownIcon />
              </span>
            )}
          </div>
          <nav className="hidden lg:flex items-center gap-1">
            {visibleNav.map((l) => (
              <NavLink key={l.href} href={l.href} label={l.label} badge={l.badge} />
            ))}
            <SettingsMenu
              links={visibleSettings.map((l) => ({
                href: l.href,
                label: l.label,
                icon: (
                  <span className="inline-flex items-center gap-2">
                    {settingsIcon(l.href)}
                    {l.badge > 0 && (
                      <span
                        aria-label={`${l.badge} pendiente${l.badge === 1 ? "" : "s"}`}
                        className="w-1.5 h-1.5 rounded-full bg-[var(--accent-red)] dot-pulse"
                      />
                    )}
                  </span>
                ),
              }))}
              footer={
                <form
                  action={async () => {
                    "use server";
                    await signOut({ redirectTo: "/" });
                  }}
                >
                  <button
                    type="submit"
                    className="w-full flex items-center justify-between px-4 py-2 text-sm hover:bg-[var(--muted)] transition-colors"
                  >
                    <span>Salir</span>
                    <LogoutIcon />
                  </button>
                </form>
              }
            />
          </nav>
          <div className="lg:hidden flex items-center gap-1">
            <ThemeToggle />
            <MobileMenu links={allMobileLinks}>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
                className="w-full"
              >
                <button type="submit" className="btn btn-ghost text-sm px-3 py-1.5 w-full justify-start">
                  Salir
                </button>
              </form>
            </MobileMenu>
          </div>
        </div>
      </header>
      <main className="flex-1 w-[90vw] mx-auto py-8 min-w-0">{children}</main>
    </div>
  );
}

function NavLink({
  href,
  label,
  badge = 0,
}: {
  href: string;
  label: string;
  badge?: number;
}) {
  return (
    <Link
      href={href}
      className="relative flex items-center h-11 px-4 rounded-md font-medium tracking-[0.2em] text-sm uppercase hover:bg-[var(--muted)] transition-colors"
    >
      {label}
      <BadgeCount count={badge} />
    </Link>
  );
}

function CrownIcon() {
  return (
    <svg
      width="27"
      height="27"
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

function LogoutIcon() {
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
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function settingsIcon(href: string) {
  const common = {
    width: 14,
    height: 14,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  if (href.endsWith("/estadisticas")) {
    return (
      <svg {...common}>
        <line x1="4" y1="20" x2="4" y2="10" />
        <line x1="10" y1="20" x2="10" y2="4" />
        <line x1="16" y1="20" x2="16" y2="14" />
        <line x1="3" y1="20" x2="21" y2="20" />
      </svg>
    );
  }
  if (href.endsWith("/administradores")) {
    return (
      <svg {...common}>
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    );
  }
  if (href.endsWith("/configuracion")) {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
      </svg>
    );
  }
  if (href.endsWith("/seguridad")) {
    return (
      <svg {...common}>
        <rect x="4" y="11" width="16" height="10" rx="2" />
        <path d="M8 11V7a4 4 0 0 1 8 0v4" />
      </svg>
    );
  }
  return null;
}
