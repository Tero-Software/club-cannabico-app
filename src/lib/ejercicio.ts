import { RRule, rrulestr } from "rrule";

// Recurrencias de directiva guardadas como RRULE (RFC 5545) en el Tenant:
// cadencia de juntas (meetingRule) y cierre del ejercicio (fiscalYearEndRule).
// Acá se centraliza el armado de la regla y la derivación del período del
// ejercicio: va del día siguiente a un cierre hasta el cierre siguiente, y su
// año es el del inicio del período. Cierre 31/03: ejercicio 2026 =
// 01/04/2026 – 31/03/2027. Cierre 31/12: ejercicio 2026 = año calendario 2026.

const DAY_MS = 86_400_000;

// dtstart lejano en el pasado para poder pedir ocurrencias anteriores; las
// reglas anuales por día/mes no dependen de él.
const DTSTART = new Date(Date.UTC(2000, 0, 1));

/**
 * Regla lista para consultar, o null si no hay o no parsea. `dtstart` es el
 * ancla de la recurrencia: el INTERVAL de RRULE cuenta desde ahí, así que las
 * cadencias con intervalo (juntas "cada N meses") deben anclarse al último
 * evento real, no a una fecha fija.
 */
export function buildRule(ruleStr: string | null, dtstart: Date = DTSTART): RRule | null {
  if (!ruleStr) return null;
  try {
    const parsed = rrulestr(ruleStr);
    return new RRule({ ...parsed.origOptions, dtstart });
  } catch {
    return null;
  }
}

/** Año del ejercicio que termina en el cierre `cierre`. */
export function ejercicioYear(rule: RRule, cierre: Date): number {
  const prev = rule.before(new Date(cierre.getTime() - DAY_MS));
  if (!prev) return cierre.getUTCFullYear() - 1;
  return new Date(prev.getTime() + DAY_MS).getUTCFullYear();
}

/** Período del ejercicio `year`, o null si la regla no lo produce. */
export function periodForYear(rule: RRule, year: number): { start: Date; end: Date } | null {
  // El cierre que abre el ejercicio es el último cuyo día siguiente cae en `year`.
  const cierres = rule.between(
    new Date(Date.UTC(year - 1, 0, 1)),
    new Date(Date.UTC(year, 11, 31)),
    true,
  );
  const opener = [...cierres]
    .reverse()
    .find((c) => new Date(c.getTime() + DAY_MS).getUTCFullYear() === year);
  if (!opener) return null;
  const start = new Date(opener.getTime() + DAY_MS);
  const end = rule.after(start);
  if (!end) return null;
  return { start, end };
}
