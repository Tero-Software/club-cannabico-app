// Tiers del producto. Fuente única para la página de precios y el checkout.
// La diferencia Básico→Premium es tiempo del dev (prioridad + pedidos), no features.

export type Tier = {
  slug: "free" | "basico" | "premium";
  nombre: string;
  precio: string;
  /** Monto numérico en USD para el cobro. 0 = gratis. */
  montoUsd: number;
  periodo?: string;
  resumen: string;
  destacado?: boolean;
  incluye: string[];
};

export const TIERS: Tier[] = [
  {
    slug: "free",
    nombre: "Free",
    precio: "Gratis",
    montoUsd: 0,
    resumen: "Para clubes chicos que arrancan.",
    incluye: [
      "Hasta 15 socios",
      "Agenda de entregas 100% funcional",
      "Acopio y trazabilidad"
    ],
  },
  {
    slug: "basico",
    nombre: "Básico",
    precio: "USD 20",
    montoUsd: 20,
    periodo: "/ mes",
    resumen: "La app completa para tu club.",
    destacado: true,
    incluye: [
      "Todo lo de Free",
      "Sin límite de socios",
      "Asistencia de administración de directiva"
    ],
  },
  {
    slug: "premium",
    nombre: "Premium",
    precio: "USD 50",
    montoUsd: 50,
    periodo: "/ mes",
    resumen: "Toda la app mas dominio propio.",
    incluye: [
      "Todo lo de Básico",
      "Dominio propio del club",
      "1 pedido de mejora por mes",
    ],
  },
];

export function getTier(slug: string | undefined): Tier | undefined {
  return TIERS.find((t) => t.slug === slug);
}
