import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Logo } from "@/components/ui/logo";

const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "Club Cannábico App";

export const metadata: Metadata = {
  title: `Suscribite — ${appName}`,
  robots: { index: false },
};

// Datos propios de la instancia de pago. Independientes del pricing general
// (src/lib/pricing.ts): acá va solo lo que se cobra, no el detalle de venta.
type CheckoutPlan = {
  nombre: string;
  precio: string;
  periodo?: string;
  montoUsd: number;
  incluye: string[];
};

const CHECKOUT: Record<string, CheckoutPlan> = {
  free: {
    nombre: "Free",
    precio: "Gratis",
    montoUsd: 0,
    incluye: [
      "Hasta 15 socios",
      "Agenda de entregas",
      "Acopio y trazabilidad",
    ],
  },
  basico: {
    nombre: "Básico",
    precio: "USD 20",
    periodo: "/ mes",
    montoUsd: 20,
    incluye: [
      "Hasta 45 socios",
      "Agenda de entregas",
      "Acopio y trazabilidad",
      "Asistencia de administración de directiva",
    ],
  },
  premium: {
    nombre: "Premium",
    precio: "USD 50",
    periodo: "/ mes",
    montoUsd: 50,
    incluye: [
      "Hasta 45 socios",
      "Agenda de entregas",
      "Acopio y trazabilidad",
      "Asistencia de administración de directiva",
      "Tu propia web del club",
      "1 pedido de mejora por mes",
    ],
  },
};

export default async function SuscribirPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const { plan } = await searchParams;
  const data = plan ? CHECKOUT[plan] : undefined;
  if (!data || !plan) notFound();

  const esGratis = data.montoUsd === 0;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-[var(--border-subtle)]">
        <div className="container-page py-4 flex items-center justify-between gap-4">
          <Logo href="/producto" showUruguay />
          <Link
            href="/pricing"
            className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
          >
            ← Volver a precios
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <div className="container-page py-16 sm:py-24">
          <div className="max-w-md mx-auto">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
              {esGratis ? "Activá tu club" : "Confirmá tu suscripción"}
            </h1>

            {/* Resumen de lo que se cobra. */}
            <div className="mt-6 card p-0 overflow-hidden">
              <div className="flex items-baseline justify-between gap-3 px-5 py-4">
                <span className="font-medium">Plan {data.nombre}</span>
                <span className="text-right shrink-0">
                  <span className="text-xl font-bold tracking-tight">
                    {data.precio}
                  </span>
                  {data.periodo && (
                    <span className="text-sm text-[var(--muted-foreground)]">
                      {" "}
                      {data.periodo}
                    </span>
                  )}
                </span>
              </div>
              <ul className="border-t border-[var(--border-subtle)] px-5 py-4 flex flex-col gap-2.5 text-sm">
                {data.incluye.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <CheckIcon />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Alta gratis o elección de medio de pago. */}
            {esGratis ? (
              <div className="mt-6">
                <Link
                  href="/pricing"
                  className="block text-center rounded-full bg-[var(--primary)] text-white font-medium px-5 py-3 transition-colors hover:bg-[var(--primary-hover)] active:scale-[0.98]"
                >
                  Crear mi club gratis
                </Link>
                <p className="mt-3 text-xs text-[var(--muted-foreground)] text-center">
                  Verificamos que administrás un club habilitado antes de activarlo.
                </p>
              </div>
            ) : (
              <div className="mt-6">
                <p className="text-xs uppercase tracking-wider text-[var(--fg-tertiary)] mb-3">
                  Elegí cómo pagar
                </p>
                <div className="flex flex-col gap-3">
                  <PagoButton metodo="mercadopago" plan={plan} />
                  <PagoButton metodo="paypal" plan={plan} />
                </div>
                <p className="mt-4 text-xs text-[var(--muted-foreground)] text-center">
                  Cobro mensual recurrente. Cancelás cuando quieras, sin permanencia.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="border-t border-[var(--border)] py-8">
        <div className="container-page text-sm text-[var(--muted-foreground)] font-light">
          © {new Date().getFullYear()} {appName}.
        </div>
      </footer>
    </div>
  );
}

// Botón por medio de pago. Inicia el flujo del proveedor vía una ruta propia
// (a implementar): crea la suscripción en el backend y redirige al checkout
// hosteado del proveedor.
function PagoButton({
  metodo,
  plan,
}: {
  metodo: "mercadopago" | "paypal";
  plan: string;
}) {
  const label =
    metodo === "mercadopago" ? "Pagar con Mercado Pago" : "Pagar con PayPal";
  // Los medios de pago aún no están integrados: el botón queda visible pero
  // inactivo para no romper con un 404. Se activa con /api/checkout/{metodo}.
  void plan;
  return (
    <button
      type="button"
      disabled
      className="flex items-center justify-center gap-3 rounded-full border border-[var(--border-strong)] px-5 py-3 font-medium text-[var(--muted-foreground)] cursor-not-allowed opacity-60"
    >
      {label}
      <span className="text-xs">· próximamente</span>
    </button>
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
