import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Sidebar, type SidebarSection } from "@/components/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role === "ADMIN") redirect("/administrador");
  if (session.user.mustChangePassword) {
    const fresh = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { mustChangePassword: true },
    });
    if (fresh?.mustChangePassword) redirect("/cambiar-password");
  }

  const isVisitor = session.user.role === "VISITANTE";

  const sections: SidebarSection[] = [
    {
      items: [
        { href: "/socio/retiros", label: "Mis retiros", icon: <RetirosIcon /> },
        { href: "/socio/retiros/nuevo", label: "Agendar", icon: <AgendarIcon /> },
      ],
    },
    {
      title: "Cuenta",
      items: [{ href: "/socio/perfil", label: "Perfil", icon: <UserIcon /> }],
    },
  ];

  const brand = <Logo href="/socio" hideText size={20} />;

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
      {/* Panel de contenido flotante (modelo Linear): superficie más clara que
          el canvas, redondeada y con gutter. */}
      <main className="flex-1 min-w-0 lg:my-2 lg:mr-2 bg-[var(--surface-3)] lg:rounded-xl lg:border lg:border-[var(--border-subtle)] overflow-hidden flex flex-col">
        {isVisitor && (
          <div className="bg-[var(--accent-yellow)] text-black text-center text-sm py-2 px-4 font-medium">
            Modo demo · estás explorando como visitante. Lo que agendes no es real.
          </div>
        )}
        <div className="flex-1 min-w-0 px-4 sm:px-6 lg:px-10 py-8">
          <div className="max-w-4xl">{children}</div>
        </div>
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

function AgendarIcon() {
  return (
    <svg {...iconProps}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <line x1="12" y1="14" x2="12" y2="18" />
      <line x1="10" y1="16" x2="14" y2="16" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg {...iconProps}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
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
