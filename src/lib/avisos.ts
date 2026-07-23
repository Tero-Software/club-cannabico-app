import { prisma } from "@/lib/db";
import { buildRule, ejercicioYear } from "@/lib/ejercicio";
import { harvestWindow, harvestWindowLabel } from "@/lib/plan-cultivo";
import { formatDateShort } from "@/lib/format";

// Avisos de gestión del club, derivados de los plazos configurados en el
// Tenant (todos opcionales: sin configurar no se evalúa el aviso). Cada aviso
// lleva el href de la sección que lo resuelve y el motivo: el layout marca la
// sección con el punto rojo del sidebar y la página destino muestra el
// mensaje. Un aviso se apaga solo al hacer la acción que lo resuelve:
// registrar la junta o el acta, crear la memoria del ejercicio, actualizar el
// inicio del mandato.
export type AvisoClub = {
  href: string;
  message: string;
};

const DAY_MS = 86_400_000;
// Cuántos días antes de la fecha configurada se enciende el aviso.
const LEAD_MS = 30 * DAY_MS;

/** Mensajes de los avisos activos de una sección (por href). */
export function avisosFor(avisos: AvisoClub[], href: string): string[] {
  return avisos.filter((a) => a.href === href).map((a) => a.message);
}

export async function getAvisosClub(tenantId: string): Promise<AvisoClub[]> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      createdAt: true,
      meetingRule: true,
      fiscalYearEndRule: true,
      nextAsambleaDate: true,
      mandateStart: true,
      mandateYears: true,
    },
  });
  if (!tenant) return [];

  const now = new Date();
  const avisos: AvisoClub[] = [];

  // Junta de directiva: la próxima junta que espera la cadencia (contando
  // desde la última registrada, o desde el alta del club) ya pasó. La regla se
  // ancla en esa fecha para que el intervalo ("cada N meses") corra desde la
  // última junta y no desde un calendario fijo.
  if (tenant.meetingRule) {
    const lastJunta = await prisma.meeting.findFirst({
      where: { tenantId, type: "DIRECTIVA" },
      orderBy: { date: "desc" },
      select: { date: true },
    });
    const since = lastJunta?.date ?? tenant.createdAt;
    const juntaRule = buildRule(tenant.meetingRule, since);
    // El mes de la última junta ya está cumplido: si la ocurrencia cae en ese
    // mismo mes, la esperada es la siguiente.
    let expected = juntaRule?.after(since) ?? null;
    if (
      expected &&
      expected.getUTCFullYear() === since.getUTCFullYear() &&
      expected.getUTCMonth() === since.getUTCMonth()
    ) {
      expected = juntaRule?.after(expected) ?? null;
    }
    if (expected && expected.getTime() <= now.getTime()) {
      avisos.push({
        href: "/administrador/directiva/juntas",
        message: lastJunta
          ? `La cadencia del club esperaba una junta el ${formatDateShort(expected)}; la última registrada es del ${formatDateShort(lastJunta.date)}.`
          : `La cadencia del club esperaba una junta el ${formatDateShort(expected)} y todavía no hay juntas registradas.`,
      });
    }
  }

  // Cierre del ejercicio: se acerca el cierre (o ya pasó) y el ejercicio que
  // termina no tiene memoria creada.
  const cierre = buildRule(tenant.fiscalYearEndRule);
  if (cierre) {
    const nextCierre = cierre.after(now, true);
    const prevCierre = cierre.before(now);

    const candidatos: { fecha: Date; pasado: boolean }[] = [];
    if (nextCierre && nextCierre.getTime() - now.getTime() <= LEAD_MS) {
      candidatos.push({ fecha: nextCierre, pasado: false });
    }
    if (prevCierre) candidatos.push({ fecha: prevCierre, pasado: true });

    if (candidatos.length > 0) {
      const porAno = new Map(candidatos.map((c) => [ejercicioYear(cierre, c.fecha), c]));
      const memorias = await prisma.memoria.findMany({
        where: { tenantId, year: { in: [...porAno.keys()] } },
        select: { year: true },
      });
      for (const m of memorias) porAno.delete(m.year);
      for (const [year, c] of porAno) {
        avisos.push({
          href: "/administrador/directiva/memorias",
          message: c.pasado
            ? `El ejercicio ${year} cerró el ${formatDateShort(c.fecha)} y todavía no tiene memoria creada.`
            : `El ejercicio ${year} cierra el ${formatDateShort(c.fecha)}: falta crear su memoria.`,
        });
      }
    }
  }

  // Asamblea anual: fecha fijada sin acta registrada (Meeting tipo ASAMBLEA
  // con fecha desde una semana antes de la fijada).
  if (tenant.nextAsambleaDate) {
    const date = tenant.nextAsambleaDate;
    if (date.getTime() - now.getTime() <= LEAD_MS) {
      const acta = await prisma.meeting.findFirst({
        where: {
          tenantId,
          type: "ASAMBLEA",
          date: { gte: new Date(date.getTime() - 7 * DAY_MS) },
        },
        select: { id: true },
      });
      if (!acta) {
        avisos.push({
          href: "/administrador/directiva/asambleas",
          message:
            date.getTime() >= now.getTime()
              ? `Hay asamblea fijada para el ${formatDateShort(date)}: al hacerla, registrá el acta acá.`
              : `La asamblea fijada para el ${formatDateShort(date)} no tiene acta registrada.`,
        });
      }
    }
  }

  // Ventana de cosecha del plan de cultivo: se acerca (o está en curso) la
  // ventana estimada de una siembra y su cosecha real todavía no tiene plantas
  // cosechadas registradas en trazabilidad. Se apaga al registrar la fecha de
  // cosecha de alguna planta de una cosecha enganchada a esa siembra.
  const planEntries = await prisma.plannedHarvest.findMany({
    where: { tenantId },
    select: { id: true, number: true, harvestRule: true },
    orderBy: { number: "asc" },
  });
  for (const entry of planEntries) {
    // Ventana de este año o, si ya pasó, la del año que viene (para el aviso
    // anticipado de una ventana de enero con 30 días de anticipo en diciembre).
    const year = now.getUTCFullYear();
    const window =
      [harvestWindow(entry.harvestRule, year), harvestWindow(entry.harvestRule, year + 1)]
        .filter((w) => w !== null)
        .find((w) => now.getTime() <= w.end.getTime());
    if (!window) continue;
    if (window.start.getTime() - now.getTime() > LEAD_MS) continue;

    const cosechadas = await prisma.plant.count({
      where: {
        tenantId,
        harvest: { planId: entry.id },
        harvestedAt: {
          gte: new Date(window.start.getTime() - LEAD_MS),
          lte: window.end,
        },
      },
    });
    if (cosechadas > 0) continue;

    const label = harvestWindowLabel(entry.harvestRule).toLowerCase();
    avisos.push({
      href: "/administrador/operativa/trazabilidad",
      message:
        now.getTime() >= window.start.getTime()
          ? `La ventana de cosecha de la siembra N.º ${entry.number} (${label}) está en curso y todavía no hay plantas cosechadas registradas.`
          : `Se viene la ventana de cosecha de la siembra N.º ${entry.number} (${label}): al cosechar, registrá la fecha en las plantas de su cosecha.`,
    });
  }

  // Mandato de la directiva: vence (o venció) a los mandateYears años del
  // inicio vigente.
  if (tenant.mandateStart && tenant.mandateYears) {
    const end = new Date(tenant.mandateStart);
    end.setUTCFullYear(end.getUTCFullYear() + tenant.mandateYears);
    if (end.getTime() - now.getTime() <= LEAD_MS) {
      avisos.push({
        href: "/administrador/directiva/comision",
        message:
          end.getTime() >= now.getTime()
            ? `El mandato de la directiva vence el ${formatDateShort(end)}. Cuando asuma la nueva directiva, actualizá el inicio del mandato en Configuración.`
            : `El mandato de la directiva venció el ${formatDateShort(end)}. Actualizá el inicio del mandato en Configuración.`,
      });
    }
  }

  return avisos;
}
