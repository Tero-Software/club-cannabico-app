import { RRule, rrulestr } from "rrule";

// Ventana de cosecha del plan de cultivo, guardada como RRULE anual por meses
// (FREQ=YEARLY;BYMONTH=...;BYMONTHDAY=1). Acá se centraliza el armado de la
// regla desde los meses elegidos, la lectura inversa y el cálculo de la
// ventana de un año concreto (para el aviso de "se viene la cosecha").

export const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

/** RRULE anual para los meses elegidos (1-12). */
export function buildHarvestRule(months: number[]): string {
  const bymonth = [...new Set(months)]
    .filter((m) => m >= 1 && m <= 12)
    .sort((a, b) => a - b);
  return new RRule({
    freq: RRule.YEARLY,
    bymonth,
    bymonthday: 1,
  }).toString();
}

/** Meses (1-12, ordenados) de una regla guardada; [] si no parsea. */
export function harvestRuleMonths(ruleStr: string): number[] {
  try {
    const o = rrulestr(ruleStr).origOptions;
    const raw = o.bymonth == null ? [] : Array.isArray(o.bymonth) ? o.bymonth : [o.bymonth];
    return [...new Set(raw)].filter((m) => m >= 1 && m <= 12).sort((a, b) => a - b);
  } catch {
    return [];
  }
}

/** Etiqueta legible de la ventana: "Agosto", "Marzo y abril", "Marzo, abril y mayo". */
export function harvestWindowLabel(ruleStr: string): string {
  const months = harvestRuleMonths(ruleStr);
  if (months.length === 0) return "—";
  const names = months.map((m, i) =>
    i === 0 ? MESES[m - 1] : MESES[m - 1].toLowerCase(),
  );
  if (names.length === 1) return names[0];
  return `${names.slice(0, -1).join(", ")} y ${names[names.length - 1]}`;
}

/** "semana 1" / "semanas 3 y 4" / "semanas 1, 2 y 3". Vacío sin semanas. */
export function weeksLabel(weeks: number[]): string {
  const ws = [...new Set(weeks)].filter((w) => w >= 1 && w <= 4).sort();
  if (ws.length === 0) return "";
  if (ws.length === 1) return `semana ${ws[0]}`;
  return `semanas ${ws.slice(0, -1).join(", ")} y ${ws[ws.length - 1]}`;
}

/** Etiqueta de un hito: "Marzo, semanas 3 y 4", "Junio". "—" sin mes. */
export function hitoLabel(month: number | null, weeks: number[]): string {
  if (!month || month < 1 || month > 12) return "—";
  const w = weeksLabel(weeks);
  return w ? `${MESES[month - 1]}, ${w}` : MESES[month - 1];
}

/** Ventana de la cosecha en el año `year`: del 1.º del primer mes al último día
 *  del último mes. Null si la regla no tiene meses. */
export function harvestWindow(
  ruleStr: string,
  year: number,
): { start: Date; end: Date } | null {
  const months = harvestRuleMonths(ruleStr);
  if (months.length === 0) return null;
  const first = months[0];
  const last = months[months.length - 1];
  return {
    start: new Date(Date.UTC(year, first - 1, 1)),
    // Día 0 del mes siguiente = último día del mes, a fin de día.
    end: new Date(Date.UTC(year, last, 0, 23, 59, 59, 999)),
  };
}
