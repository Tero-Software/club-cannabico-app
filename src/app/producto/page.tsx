import type { Metadata } from "next";
import { Logo } from "@/components/logo";

const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "Club Cannábico App";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://clubcannabico.app";
const whatsappUrl = "https://wa.me/59899176865";

export const metadata: Metadata = {
  title: `${appName} — Software de gestión para clubes cannábicos en Uruguay`,
  description:
    "Software de gestión para clubes cannábicos habilitados por IRCCA: postulaciones, socios, agenda de retiros con control de cupos, acopio con movimientos de stock, estadísticas de consumo y registro de auditoría. Marco de la Ley 19.172.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "es_UY",
    url: siteUrl,
    title: `${appName} — Software de gestión para clubes cannábicos`,
    description:
      "Gestión de socios, retiros, acopio y cumplimiento para clubes habilitados por IRCCA.",
  },
};

const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: appName,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description:
    "Software de gestión para clubes cannábicos habilitados por IRCCA en Uruguay.",
  areaServed: { "@type": "Country", name: "Uruguay" },
  inLanguage: "es-UY",
};

const FEATURES: { title: string; body: string }[] = [
  {
    title: "Socios y postulaciones",
    body: "Quien quiere entrar postula desde un formulario público. El club aprueba o rechaza, y al aprobar se crea la cuenta del socio con contraseña temporal. Cada club define su tope de socios activos.",
  },
  {
    title: "Agenda de retiros",
    body: "El socio agenda su retiro en los días y horarios que el club habilita y elige cantidades por variedad. La app valida el cupo mensual, el mínimo por retiro y los múltiplos antes de registrarlo. El admin aprueba, completa o rechaza cada uno.",
  },
  {
    title: "Acopio e inventario",
    body: "Contenedores con sus pesos y cada entrada y salida registrada como movimiento. Al aprobar un retiro se reserva el stock; al completarlo se descuenta del peso real. El catálogo de variedades incluye banco, descripción y fotos.",
  },
  {
    title: "Estadísticas de consumo",
    body: "Gramos retirados por mes, consumo por día de la semana, ranking de variedades y su velocidad de consumo, distribución de gramos por socio y antigüedad de los activos. Todo calculado sobre los retiros completados.",
  },
  {
    title: "Registro de auditoría",
    body: "Cada acción sensible —altas, cambios de estado, movimientos de stock, accesos— queda registrada con autor, fecha, IP y el detalle del cambio. Respaldo concreto ante una consulta interna o una inspección.",
  },
  {
    title: "Acceso con dos factores",
    body: "Cuentas separadas por socio y por administrador, con permisos por área. Segundo factor (TOTP) obligatorio para administradores, política de contraseñas y bloqueo tras varios intentos fallidos.",
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
            Hablar con nosotros
          </a>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="container-page pt-20 pb-12 sm:pt-28 sm:pb-16 lg:pt-36">
          <div className="max-w-3xl">
            <span className="text-[0.65rem] sm:text-xs tracking-[0.3em] text-[var(--muted-foreground)] mb-6 block">
              URUGUAY
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-light leading-[1.15] tracking-tight text-balance uppercase">
              {appName}
            </h1>
            <p className="mt-6 text-2xl sm:text-3xl font-light leading-snug tracking-tight text-[var(--foreground)] text-balance max-w-2xl">
              El software de gestión para tu club cannábico.
            </p>
            <p className="mt-6 text-base sm:text-lg text-[var(--muted-foreground)] leading-relaxed font-light max-w-2xl">
              Socios, postulaciones, agenda de retiros, acopio, estadísticas y
              auditoría en una sola plataforma. Pensado para clubes habilitados
              por IRCCA.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="btn btn-primary"
              >
                Hablar con nosotros
              </a>
            </div>
          </div>
        </section>

        {/* Problema */}
        <section className="border-t border-[var(--border)]">
          <div className="container-page py-14 sm:py-20">
            <div className="max-w-3xl">
              <div className="h-px w-10 bg-[var(--border)] mb-4" />
              <span className="text-[0.78rem] tracking-[0.3em] text-[var(--muted-foreground)] block mb-6">
                EL PROBLEMA
              </span>
              <p className="text-xl sm:text-2xl font-light leading-snug text-balance">
                En planillas, el cupo mensual de cada socio y el stock de acopio
                hay que controlarlos a mano, y no queda registro de quién cambió
                qué ni cuándo.
              </p>
              <p className="mt-6 text-base text-[var(--muted-foreground)] leading-relaxed font-light">
                Acá el cupo mensual, el mínimo por retiro y los múltiplos se
                validan solos cuando el socio agenda. El stock se reserva al
                aprobar un retiro y se descuenta al entregarlo. Y cada acción
                queda en un registro de auditoría con autor, fecha e IP.
              </p>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="border-t border-[var(--border)]">
          <div className="container-page py-14 sm:py-20">
            <div className="h-px w-10 bg-[var(--border)] mb-4" />
            <span className="text-[0.78rem] tracking-[0.3em] text-[var(--muted-foreground)] block mb-10">
              QUÉ INCLUYE
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-[var(--border)] border border-[var(--border)] rounded-lg overflow-hidden">
              {FEATURES.map((f) => (
                <div key={f.title} className="bg-[var(--card)] p-6 sm:p-7">
                  <h3 className="text-lg font-medium mb-3">{f.title}</h3>
                  <p className="text-sm text-[var(--muted-foreground)] leading-relaxed font-light">
                    {f.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Cumplimiento */}
        <section className="border-t border-[var(--border)]">
          <div className="container-page py-14 sm:py-20">
            <div className="max-w-3xl">
              <div className="h-px w-10 bg-[var(--border)] mb-4" />
              <span className="text-[0.78rem] tracking-[0.3em] text-[var(--muted-foreground)] block mb-6">
                CUMPLIMIENTO
              </span>
              <p className="text-xl sm:text-2xl font-light leading-snug text-balance">
                Diseñado para el marco regulatorio uruguayo.
              </p>
              <p className="mt-6 text-base text-[var(--muted-foreground)] leading-relaxed font-light">
                La plataforma contempla los límites operativos de los clubes
                habilitados por el IRCCA en el marco de la{" "}
                <a
                  href="https://www.impo.com.uy/bases/leyes/19172-2013"
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-4 decoration-[var(--border)] hover:decoration-[var(--foreground)] transition-colors"
                >
                  Ley 19.172
                </a>{" "}
                y el Decreto 120/014: cupos por socio, registro de movimientos y
                trazabilidad del acopio. El historial de auditoría te da respaldo
                documentado de la operación.
              </p>
            </div>
          </div>
        </section>

        {/* CTA final */}
        <section className="border-t border-[var(--border)]">
          <div className="container-page py-14 sm:py-20">
            <div className="max-w-3xl">
              <div className="h-px w-10 bg-[var(--border)] mb-4" />
              <span className="text-[0.78rem] tracking-[0.3em] text-[var(--muted-foreground)] block mb-6">
                CONOCÉ LA PLATAFORMA
              </span>
              <p className="text-xl sm:text-2xl font-light leading-snug text-balance">
                Escribinos y coordinamos una demostración con datos de muestra
                del panel del club y el del socio.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-primary"
                >
                  Hablar con nosotros
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
