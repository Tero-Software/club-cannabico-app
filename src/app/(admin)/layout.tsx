import Image from "next/image";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Sidebar, type SidebarSection, type SidebarItem } from "@/components/sidebar";
import { can } from "@/lib/permissions";

type GatedItem = SidebarItem & { show: boolean };
const visible = (items: GatedItem[]): SidebarItem[] =>
  items.filter((i) => i.show).map(({ show: _show, ...item }) => item);

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

  const sections: SidebarSection[] = [
    {
      title: "Administración",
      items: visible([
        {
          href: "/administrador/retiros",
          label: "Retiros",
          icon: <RetirosIcon />,
          badge: pendingRetiros,
          show: can(session, "retiros:manage"),
        },
        {
          href: "/administrador/acopio",
          label: "Acopio",
          icon: <AcopioIcon />,
          show: can(session, "containers:manage"),
        },
        {
          href: "/administrador/socios",
          label: "Socios",
          icon: <SociosIcon />,
          badge: pendingPostulaciones,
          show: can(session, "socios:manage"),
        },
      ]),
    },
    {
      title: "Ajustes",
      items: visible([
        {
          href: "/administrador/estadisticas",
          label: "Estadísticas",
          icon: <EstadisticasIcon />,
          show: can(session, "estadisticas:view"),
        },
        {
          href: "/administrador/administradores",
          label: "Administradores",
          icon: <AdminsIcon />,
          show: can(session, "admins:manage"),
        },
        {
          href: "/administrador/seguridad",
          label: "Seguridad",
          icon: <SeguridadIcon />,
          show: true,
        },
        {
          href: "/administrador/configuracion",
          label: "Configuración",
          icon: <ConfigIcon />,
          show: true,
        },
      ]),
    },
  ];

  const brand = (
    <div className="flex items-center gap-2 min-w-0">
      <Link
        href="/administrador"
        className="flex items-center gap-2 min-w-0 rounded-md transition-transform active:scale-[0.97]"
      >
        <Image
          src="/logo.png"
          alt={username}
          width={20}
          height={20}
          className="rounded-full object-cover shrink-0"
          priority
        />
        <span className="text-sm font-medium text-[var(--foreground)] truncate">
          {username}
        </span>
      </Link>
      {isOwner && <CrownIcon />}
    </div>
  );

  const footer = (
    <div className="flex items-center justify-between gap-1">
      <ThemeToggle />
      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/" });
        }}
        className="flex-1"
      >
        <button
          type="submit"
          className="w-full flex items-center justify-between px-2 h-8 rounded-md text-sm text-[var(--muted-foreground)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)] transition-colors"
        >
          <span>Salir</span>
          <LogoutIcon />
        </button>
      </form>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col lg:flex-row">
      <Sidebar brand={brand} sections={sections} footer={footer} />
      {/* Panel de contenido flotante: superficie más clara que el canvas,
          redondeada, separada del borde por un gutter (modelo Linear). */}
      <main className="flex-1 min-w-0 lg:my-2 lg:mr-2 bg-[var(--surface-2)] lg:rounded-xl lg:border lg:border-[var(--border-subtle)] overflow-hidden">
        <div className="px-4 sm:px-6 lg:px-10 py-8">{children}</div>
      </main>
    </div>
  );
}

function CrownIcon() {
  return (
    <svg
      width="18"
      height="18"
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

const iconProps = {
  width: 16,
  height: 16,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

function RetirosIcon() {
  return (
    <svg {...iconProps}>
      <path d="M21 8v13H3V8" />
      <path d="M1 3h22v5H1z" />
      <path d="M10 12h4" />
    </svg>
  );
}

function AcopioIcon() {
  return (
    <svg {...iconProps}>
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}

function SociosIcon() {
  return (
    <svg {...iconProps}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function EstadisticasIcon() {
  return (
    <svg {...iconProps}>
      <line x1="4" y1="20" x2="4" y2="10" />
      <line x1="10" y1="20" x2="10" y2="4" />
      <line x1="16" y1="20" x2="16" y2="14" />
      <line x1="3" y1="20" x2="21" y2="20" />
    </svg>
  );
}

function AdminsIcon() {
  return (
    <svg {...iconProps}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function SeguridadIcon() {
  return (
    <svg {...iconProps}>
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

function ConfigIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg
      width="15"
      height="15"
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
