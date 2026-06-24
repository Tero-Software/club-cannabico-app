import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { TIERS } from "@/lib/pricing";

const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "Club Cannábico App";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://clubcannabico.app";

export const metadata: Metadata = {
  title: `Precios — ${appName}`,
  description:
    "Un único plan con todo incluido para clubes cannábicos en Uruguay. Consultá el precio para tu club.",
  alternates: { canonical: "/pricing" },
  openGraph: {
    type: "website",
    locale: "es_UY",
    url: `${siteUrl}/pricing`,
    title: `Precios — ${appName}`,
    description: "Un único plan con todo incluido. Consultá el precio para tu club.",
  },
};

// Preguntas que un club hace antes de contratar.
const FAQ: { q: string; a: string }[] = [
  {
    q: "¿Cómo se cobra?",
    a: "Una suscripción por club, sin costo por socio. Escribinos y te pasamos el precio según el tamaño de tu club.",
  },
  {
    q: "¿Hay permanencia?",
    a: "No. Pagás mientras uses la app y la das de baja cuando quieras.",
  },
  {
    q: "¿Migran mis datos?",
    a: "Sí. Cargás el padrón de socios y el cultivo desde el editor o con una planilla modelo.",
  },
  {
    q: "¿Mis datos salen a terceros?",
    a: "No. Corre en infraestructura propia y se piden solo los datos mínimos para operar.",
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-[var(--border-subtle)] sticky top-0 z-20 backdrop-blur-xl bg-[color-mix(in_oklab,var(--background)_72%,transparent)]">
        <div className="container-page py-4 flex items-center justify-between gap-4">
          <Logo href="/producto" showUruguay />
          <nav className="flex items-center gap-5 text-sm">
            <Link
              href="/pricing"
              className="text-[var(--foreground)] font-medium"
            >
              Precios
            </Link>
            <Link
              href="/pricing"
              className="rounded-full bg-[var(--foreground)] text-[var(--background)] font-medium px-4 py-2 transition-opacity hover:opacity-90 active:scale-[0.97]"
            >
              Inscribite
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero — glow del acento, mismo lenguaje que el landing. */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-[500px]"
            style={{ background: "var(--glow-primary)" }}
          />
          <div className="container-page relative pt-20 pb-10 sm:pt-28 text-center">
            <h1 className="text-4xl sm:text-5xl font-medium leading-[1.05] tracking-[-0.02em] text-balance">
              Precios para tu club.
            </h1>
            <p className="mt-5 text-base sm:text-lg text-[var(--muted-foreground)] max-w-xl mx-auto">
              Suscripción mensual por club, sin costo por socio. Empezá gratis y
              pasá a un plan pago cuando lo necesites.
            </p>
          </div>
        </section>

        {/* Cards de los tiers */}
        <section className="container-page pb-16 sm:pb-24">
          <div className="grid gap-5 lg:grid-cols-3 max-w-5xl mx-auto">
            {TIERS.map((t) => (
              <div
                key={t.nombre}
                className={`card flex flex-col ${
                  t.destacado ? "border-[var(--primary)]" : ""
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-lg font-semibold">{t.nombre}</h2>
                  {t.destacado && (
                    <span className="text-[0.65rem] uppercase tracking-wider bg-[color-mix(in_oklab,var(--primary)_20%,transparent)] text-[var(--primary-hover)] px-2 py-0.5 rounded-full font-semibold">
                      Recomendado
                    </span>
                  )}
                </div>

                <div className="mt-3 flex items-baseline gap-1.5">
                  <span className="text-3xl font-bold tracking-tight">
                    {t.precio}
                  </span>
                  {t.periodo && (
                    <span className="text-sm text-[var(--muted-foreground)]">
                      {t.periodo}
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                  {t.resumen}
                </p>

                <Link
                  href={`/suscribir?plan=${t.slug}`}
                  className={`mt-6 block text-center rounded-full font-medium px-5 py-2.5 transition-colors active:scale-[0.98] ${
                    t.destacado
                      ? "bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]"
                      : "border border-[var(--border-strong)] text-[var(--foreground)] hover:bg-[var(--surface-2)]"
                  }`}
                >
                  Suscribite
                </Link>

                <ul className="mt-6 pt-6 border-t border-[var(--border-subtle)] flex flex-col gap-3 text-sm">
                  {t.incluye.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <CheckIcon />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="border-t border-[var(--border)]">
          <div className="container-page py-14 sm:py-20">
            <h2 className="text-xl sm:text-2xl font-light mb-10">
              Preguntas frecuentes
            </h2>
            <div className="divide-y divide-[var(--border)] border-t border-b border-[var(--border)]">
              {FAQ.map((f) => (
                <div key={f.q} className="py-6 max-w-2xl">
                  <h3 className="text-base font-medium mb-2">{f.q}</h3>
                  <p className="text-base text-[var(--muted-foreground)] leading-relaxed font-light">
                    {f.a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--border)] py-10">
        <div className="container-page flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between text-sm">
          <nav className="flex items-center gap-6">
            <FooterLink href="/producto">Inicio</FooterLink>
            <FooterLink href="/pricing">Precios</FooterLink>
            <FooterLink href="/marco-legal">Marco legal</FooterLink>
            <FooterLink href="/contacto">Contacto</FooterLink>
            <FooterLink href="/login">Ingresar</FooterLink>
          </nav>
          <span className="font-light text-[var(--muted-foreground)]">
            © {new Date().getFullYear()} {appName}. Desarrollado por{" "}
            <a
              href="https://terosoftware.uy"
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-4 decoration-[var(--border)] hover:decoration-[var(--foreground)] hover:text-[var(--foreground)] transition-colors"
            >
              Tero Software
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--primary)"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="mt-0.5 shrink-0"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  const external = href.startsWith("http");
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
      className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors font-light"
    >
      {children}
    </a>
  );
}
