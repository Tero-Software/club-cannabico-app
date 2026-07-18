import Image from "next/image";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Sidebar, type SidebarSection, type SidebarItem } from "@/components/sidebar";
import { AccountMenu, type AccountMenuItem } from "@/components/account-menu";
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

  const [pendingRetiros, pendingPostulaciones, viewer, tenant] =
    await Promise.all([
      can(session, "retiros:manage")
        ? prisma.withdrawal.count({
            where: { tenantId: session.user.tenantId, status: "PENDING" },
          })
        : 0,
      can(session, "postulaciones:manage")
        ? prisma.application.count({
            where: { tenantId: session.user.tenantId, status: "PENDING" },
          })
        : 0,
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: { isOwner: true },
      }),
      prisma.tenant.findUnique({
        where: { id: session.user.tenantId },
        select: { name: true },
      }),
    ]);
  const isOwner = !!viewer?.isOwner;
  // Arriba del sidebar va el nombre del club (la "app"), como Claude muestra el
  // nombre de la aplicación. El logo se conserva.
  const appName = tenant?.name ?? "Club";

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
      title: "Directiva",
      items: visible([
        {
          href: "/administrador/directiva/comision",
          label: "Comisión",
          icon: <ComisionIcon />,
          show: true,
        },
        {
          href: "/administrador/directiva/juntas",
          label: "Juntas",
          icon: <JuntasIcon />,
          show: true,
        },
        {
          href: "/administrador/directiva/asambleas",
          label: "Asambleas",
          icon: <AsambleasIcon />,
          show: true,
        },
        {
          href: "/administrador/directiva/finanzas",
          label: "Finanzas",
          icon: <FinanzasIcon />,
          show: true,
        },
        {
          href: "/administrador/directiva/memorias",
          label: "Memorias",
          icon: <MemoriasIcon />,
          show: true,
        },
      ]),
    },
    {
      title: "Operativa",
      items: visible([
        {
          href: "/administrador/operativa/trazabilidad",
          label: "Trazabilidad",
          icon: <TrazabilidadIcon />,
          show: true,
        },
        {
          href: "/administrador/operativa/sanitaria",
          label: "Sanitaria",
          icon: <SanitariaIcon />,
          show: true,
        },
        {
          href: "/administrador/operativa/cosechas",
          label: "Cosechas",
          icon: <CosechasIcon />,
          show: true,
        },
      ]),
    },
  ];

  // Opciones de "Ajustes": ahora viven dentro del menú de cuenta (pie del
  // sidebar), no como sección de navegación. Incluye "Editar genéticas".
  const accountItems: AccountMenuItem[] = (
    [
      {
        href: "/administrador/geneticas",
        label: "Editar genéticas",
        icon: <GeneticasIcon />,
        show: can(session, "geneticas:manage"),
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
    ] as (AccountMenuItem & { show: boolean })[]
  )
    .filter((i) => i.show)
    .map(({ show: _show, ...item }) => item);

  const brand = (
    <div className="flex items-center gap-2 min-w-0 w-full">
      <Link
        href="/administrador"
        className="flex items-center gap-2 min-w-0 rounded-md transition-transform active:scale-[0.97]"
      >
        <Image
          src="/logo.png"
          alt={appName}
          width={22}
          height={22}
          className="rounded-full object-cover shrink-0"
          priority
        />
        <span className="text-sm font-semibold text-[var(--foreground)] truncate">
          {appName}
        </span>
      </Link>
    </div>
  );

  const signOutButton = (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/" });
      }}
    >
      <button
        type="submit"
        role="menuitem"
        className="w-full flex items-center gap-2.5 h-8 px-3 text-sm text-[var(--muted-foreground)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)] transition-colors"
      >
        <LogoutIcon />
        <span>Salir</span>
      </button>
    </form>
  );

  const footer = (
    <AccountMenu
      name={session.user.name}
      isOwner={isOwner}
      items={accountItems}
      themeToggle={<ThemeToggle />}
      onSignOut={signOutButton}
    />
  );

  return (
    <div className="app-shell min-h-screen lg:h-screen lg:overflow-hidden bg-[var(--background)] flex flex-col lg:flex-row">
      <Sidebar brand={brand} sections={sections} footer={footer} />
      {/* Panel de contenido a pantalla completa: superficie más clara que el
          canvas, separada del sidebar solo por una línea (sin gutter ni bezel).
          En desktop el shell queda fijo al viewport y el scroll vive acá. */}
      <main className="flex-1 min-w-0 bg-[var(--surface-2)] lg:border-l lg:border-[var(--border-subtle)] overflow-hidden lg:overflow-y-auto lg:[scrollbar-gutter:stable_both-edges]">
        <div className="px-4 sm:px-6 lg:px-10 py-8">{children}</div>
      </main>
    </div>
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


function ComisionIcon() {
  return (
    <svg {...iconProps}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function JuntasIcon() {
  return (
    <svg {...iconProps}>
      <path d="M3 21h18" />
      <path d="M6 21V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v17" />
      <path d="M14 12h.01" />
    </svg>
  );
}

function AsambleasIcon() {
  return (
    <svg {...iconProps}>
      <path d="M3 11l18-5v12L3 14v-3z" />
      <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
    </svg>
  );
}

function FinanzasIcon() {
  return (
    <svg {...iconProps}>
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}

function MemoriasIcon() {
  return (
    <svg {...iconProps}>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

function TrazabilidadIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="5" cy="6" r="2" />
      <circle cx="12" cy="18" r="2" />
      <circle cx="19" cy="6" r="2" />
      <path d="M5 8v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8" />
      <line x1="12" y1="13" x2="12" y2="16" />
    </svg>
  );
}

function SanitariaIcon() {
  return (
    <svg {...iconProps}>
      <path d="M11 2a2 2 0 0 0-2 2v5H4a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h5v5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-5h5a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2h-5V4a2 2 0 0 0-2-2z" />
    </svg>
  );
}

function CosechasIcon() {
  return (
    <svg {...iconProps}>
      <path d="M12 22v-8" />
      <path d="M12 14c-3 0-6-2-6-6 3 0 6 2 6 6z" />
      <path d="M12 11c0-3 2-6 6-6 0 3-2 6-6 6z" />
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

function GeneticasIcon() {
  return (
    <svg {...iconProps}>
      <path d="M12 22c0-6 4-10 8-10-1 5-4 9-8 10z" />
      <path d="M12 22c0-6-4-10-8-10 1 5 4 9 8 10z" />
      <path d="M12 22V8" />
      <path d="M12 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
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
