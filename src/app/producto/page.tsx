import type { Metadata } from "next";
import { Logo } from "@/components/logo";

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

      <header className="border-b border-[var(--border)] bg-[var(--card)] sticky top-0 z-10">
        <div className="container-page py-4 flex items-center justify-between gap-4">
          <Logo />
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="btn btn-primary text-sm"
          >
            Pedí una demo
          </a>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero — el headline dice qué hace el producto, no su nombre. */}
        <section className="container-page pt-20 pb-12 sm:pt-28 sm:pb-16 lg:pt-36">
          <div className="max-w-3xl">
            <span className="text-[0.65rem] sm:text-xs tracking-[0.3em] text-[var(--muted-foreground)] mb-6 block">
              URUGUAY
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-light leading-[1.15] tracking-tight text-balance">
              Una app pensada para clubes cannábicos uruguayos.
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-[var(--muted-foreground)] leading-relaxed font-light max-w-2xl">
              Socios, retiros, acopio, trazabilidad y actas de directiva en un
              solo lugar, con los controles que pide el IRCCA.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-5">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="btn btn-primary"
              >
                Pedí una demo
              </a>
            </div>
          </div>
        </section>

        {/* Áreas de la app, descritas por lo que hacen. */}
        <section className="border-t border-[var(--border)]">
          <div className="container-page py-14 sm:py-20">
            <div className="max-w-3xl mb-12">
              <div className="h-px w-10 bg-[var(--border)] mb-4" />
              <p className="text-xl sm:text-2xl font-light leading-snug text-balance">
                Las áreas que un club administra, en una sola plataforma.
              </p>
            </div>
            <div className="divide-y divide-[var(--border)] border-t border-b border-[var(--border)]">
              {FEATURES.map((f) => (
                <div key={f.titulo} className="py-7 max-w-2xl">
                  <h3 className="text-lg font-medium mb-2">{f.titulo}</h3>
                  <p className="text-base text-[var(--muted-foreground)] leading-relaxed font-light">
                    {f.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA final */}
        <section className="border-t border-[var(--border)]">
          <div className="container-page py-16 sm:py-24">
            <div className="max-w-3xl">
              <p className="text-2xl sm:text-3xl font-light leading-snug text-balance">
                Te muestro la plataforma con datos de prueba, el panel del club y
                el del socio.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-5">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-primary"
                >
                  Pedí una demo
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--border)] py-10 text-sm text-[var(--muted-foreground)]">
        <div className="container-page flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <span className="font-light">
            © {new Date().getFullYear()} {appName}. Uruguay.
          </span>
          <span className="font-light">
            Desarrollado por{" "}
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
