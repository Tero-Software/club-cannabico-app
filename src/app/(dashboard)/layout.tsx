import { Link } from "@/components/progress/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { MobileMenu } from "@/components/mobile-menu";
import { SettingsMenu } from "@/components/settings-menu";

const LINKS = [
  { href: "/socio/retiros", label: "Mis retiros" },
  { href: "/socio/retiros/nuevo", label: "Agendar" },
];

const SETTINGS_LINKS = [
  { href: "/socio/perfil", label: "Perfil" },
];

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

  return (
    <div className="min-h-screen flex flex-col">
      {isVisitor && (
        <div className="bg-yellow-400 text-yellow-950 text-center text-sm py-2 px-4 font-medium sticky top-0 z-20">
          Modo demo · estás explorando como visitante. Lo que agendes no es real.
        </div>
      )}
      <header className="border-b border-[var(--border)] bg-[var(--card)] sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <Logo href="/socio" />
          <nav className="hidden md:flex items-center gap-1 text-sm">
            {LINKS.map((l) => (
              <NavLink key={l.href} href={l.href} label={l.label} />
            ))}
            <SettingsMenu
              links={SETTINGS_LINKS.map((l) => ({
                href: l.href,
                label: l.label,
                icon: <UserIcon />,
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
          <div className="md:hidden flex items-center gap-1">
            <ThemeToggle />
            <MobileMenu links={[...LINKS, ...SETTINGS_LINKS]}>
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
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 min-w-0">{children}</main>
    </div>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="px-3 py-1.5 rounded-md hover:bg-[var(--muted)] transition-all active:scale-[0.93]"
    >
      {label}
    </Link>
  );
}

function UserIcon() {
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
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
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
