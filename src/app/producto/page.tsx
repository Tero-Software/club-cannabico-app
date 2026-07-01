import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { Reveal } from "@/components/ui/reveal";

const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "Club Cannábico App";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://clubcannabico.app";
const whatsappUrl = "https://wa.me/59899176865";

export const metadata: Metadata = {
  title: `${appName} — Software para clubes cannábicos en Uruguay`,
  description:
    "Una app pensada para clubes cannábicos uruguayos: socios, agenda online de entregas, acopio, trazabilidad, administración directiva y estadísticas en un solo lugar.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "es_UY",
    url: siteUrl,
    title: `${appName} — Software para clubes cannábicos en Uruguay`,
    description:
      "Socios, agenda de entregas, acopio, trazabilidad, directiva y estadísticas en una sola app.",
  },
};

const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: appName,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description:
    "Software de gestión para clubes cannábicos en Uruguay.",
  areaServed: { "@type": "Country", name: "Uruguay" },
  inLanguage: "es-UY",
};

// Las áreas reales de la app, descritas por lo que hacen. No es un recorrido
// cronológico: son los módulos que un club administra.
const FEATURES: { titulo: string; body: string }[] = [
  {
    titulo: "Agenda online de entregas",
    body: "Los socios agendan su retiro eligiendo entre lo que el club ofrece disponible. Vos aprobás, completás o rechazás cada pedido.",
  },
  {
    titulo: "Control de acopio",
    body: "Al dar la entrega como completada, el stock se descuenta solo.",
  },
  {
    titulo: "Control de trazabilidad",
    body: "Ingresás el cultivo desde el editor o con una planilla modelo. Después seguís cada planta con sus propios hitos.",
  },
  {
    titulo: "Administración directiva",
    body: "Cargás las fechas clave de tu club. La app te avisa cada trámite a tiempo y arma las actas por vos.",
  },
  {
    titulo: "Estadísticas",
    body: "Retiros por mes, las variedades que más salen, el consumo repartido entre socios.",
  },
];

export default function ProductoLanding() {
  return (
    <div className="min-h-screen flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />

      <header className="border-b border-[var(--border-subtle)] sticky top-0 z-20 backdrop-blur-xl bg-[color-mix(in_oklab,var(--background)_72%,transparent)]">
        <div className="container-page py-4 flex items-center justify-between gap-4">
          <Logo showUruguay />
          <nav className="flex items-center gap-5 text-sm">
            <Link
              href="/pricing"
              className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
            >
              Precios
            </Link>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-[var(--foreground)] text-[var(--background)] font-medium px-4 py-2 transition-opacity hover:opacity-90 active:scale-[0.97]"
            >
              Inscribite
            </a>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero — glow del acento detrás del titular, racionado (técnica Linear). */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-[600px]"
            style={{ background: "var(--glow-primary)" }}
          />
          <div className="container-page relative pt-20 pb-20 sm:pt-28 sm:pb-28 lg:pt-36">
            <div className="max-w-5xl hero-stagger">
              <span className="text-[0.65rem] sm:text-xs tracking-[0.3em] text-[var(--muted-foreground)] mb-6 block">
                URUGUAY
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-medium leading-[1.05] tracking-[-0.02em] text-balance">
                Una app pensada para clubes cannábicos uruguayos.
              </h1>
              <p className="mt-6 text-sm sm:text-base text-[var(--fg-quaternary)] leading-relaxed sm:whitespace-nowrap">
                Control de acopio, trazabilidad y actas de directiva automatizadas en un
                solo lugar.
              </p>
            </div>
          </div>
        </section>

        {/* Screenshot del producto enmarcado como una card de la app: borde
            sutil y esquinas redondeadas en los cuatro lados, imagen completa. */}
        <div className="container-page relative pb-16 sm:pb-24">
          <Reveal className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-2)] shadow-[var(--shadow-lg)] overflow-hidden">
            <Image
              src="/portada-hero.png"
              alt="Vista del panel de administración de la app"
              width={1920}
              height={993}
              priority
              className="block w-full h-auto"
            />
          </Reveal>
        </div>

        {/* Áreas de la app, descritas por lo que hacen. */}
        <section className="border-t border-[var(--border)]">
          <div className="container-page py-14 sm:py-20">
            <Reveal className="max-w-3xl mb-12">
              <p className="text-xl sm:text-2xl font-light leading-snug text-balance">
                Todo lo que tu club necesita, en una sola plataforma.
              </p>
            </Reveal>
            <div className="divide-y divide-[var(--border)] border-t border-b border-[var(--border)]">
              {FEATURES.map((f, i) => (
                <Reveal key={f.titulo} delay={i * 80} className="py-7 max-w-2xl">
                  <h3 className="text-lg font-medium mb-2">{f.titulo}</h3>
                  <p className="text-base text-[var(--muted-foreground)] leading-relaxed font-light">
                    {f.body}
                  </p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Mensaje de despedida (closing CTA), técnica del cierre de Linear:
            titular grande centrado con el glow del acento detrás y una acción. */}
        <section className="relative overflow-hidden border-t border-[var(--border)]">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-[500px]"
            style={{ background: "var(--glow-primary)", transform: "scaleY(-1)" }}
          />
          <Reveal className="container-page relative py-24 sm:py-36 text-center">
            <h2 className="text-3xl sm:text-5xl font-medium leading-[1.05] tracking-[-0.02em] text-balance max-w-3xl mx-auto">
              Pensada para hoy. Lista para lo que viene.
            </h2>
            <p className="mt-5 text-base sm:text-lg text-[var(--muted-foreground)] max-w-xl mx-auto">
              Sumá tu club y manejá socios, retiros y acopio con los controles
              que pide el IRCCA.
            </p>
            <div className="mt-9 flex items-center justify-center gap-3 flex-wrap">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-full bg-[var(--foreground)] text-[var(--background)] text-sm font-medium px-5 py-2.5 transition-opacity hover:opacity-90 active:scale-[0.97]"
              >
                Inscribite
              </a>
              <a
                href="/contacto"
                className="rounded-full border border-[var(--border-strong)] text-[var(--foreground)] text-sm font-medium px-5 py-2.5 transition-colors hover:bg-[var(--surface-2)] active:scale-[0.97]"
              >
                Contactanos
              </a>
            </div>
          </Reveal>
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
