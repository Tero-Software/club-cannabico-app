import { Link } from "@/components/progress/link";
import { auth } from "@/lib/auth";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "Club Cannábico App";
  const panelHref = session
    ? session.user.role === "ADMIN"
      ? "/administrador"
      : "/socio"
    : "/login";

  return (
    <>
      <header className="border-b border-[var(--border)] bg-[var(--card)] sticky top-0 z-10">
        <div className="container-page py-3 flex items-center justify-between gap-4">
          <Logo href="/" />
          <nav className="flex items-center gap-1">
            <ThemeToggle />
            <Link
              href={panelHref}
              aria-label={session ? "Ir al panel" : "Ingresar"}
              className="p-2 rounded-md hover:bg-[var(--muted)] transition-colors text-[var(--foreground)]"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" y1="12" x2="3" y2="12" />
              </svg>
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-[var(--border)] mt-12 py-10 sm:py-14 text-sm text-[var(--muted-foreground)]">
        <div className="container-page">
          <div className="px-1.5 sm:px-2">
            <div className="text-[0.7rem] tracking-[0.3em] uppercase text-[var(--muted-foreground)] mb-3">
              Contacto
            </div>
            <ul className="space-y-2 font-light">
              <li>
                <Link href="/contacto" className="hover:text-[var(--foreground)] transition-colors">
                  Contacto
                </Link>
              </li>
            </ul>
          </div>
          <div className="mt-10 pt-6 border-t border-[var(--border)] text-xs text-[var(--muted-foreground)] px-1.5 sm:px-2">
            © {new Date().getFullYear()} {appName}. Todos los derechos
            reservados.
          </div>
        </div>
      </footer>
    </>
  );
}
