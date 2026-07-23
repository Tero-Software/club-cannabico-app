import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getAvisosClub, avisosFor } from "@/lib/avisos";
import { buildRule, periodForYear } from "@/lib/ejercicio";
import { AvisoBanner } from "@/components/aviso-banner";
import { PageHeader, EmptyState } from "@/components/ui/page-scaffold";
import { MemoriasPanel } from "./memorias-panel";

export const metadata = { title: "Memorias (directiva)" };

export default async function MemoriasPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/socio");

  const tenantId = session.user.tenantId;

  const [memoriasRaw, members, tenant] = await Promise.all([
    prisma.memoria.findMany({
      where: { tenantId },
      orderBy: { year: "desc" },
      include: {
        entries: {
          include: { milestones: { orderBy: { createdAt: "asc" } } },
        },
      },
    }),
    // Socios del club, con las fechas que marcan sus altas y bajas. Las altas y
    // bajas de cada memoria se derivan de acá automáticamente; no se cargan a mano.
    prisma.user.findMany({
      where: { tenantId, role: "MEMBER" },
      select: { name: true, createdAt: true, deactivatedAt: true },
    }),
    prisma.tenant.findUniqueOrThrow({
      where: { id: tenantId },
      select: { fiscalYearEndRule: true },
    }),
  ]);

  // Hint del formulario de alta: el período que tendría una memoria creada
  // ahora, según el cierre configurado del club. Solo informativo; el período
  // real se guarda en cada memoria al crearla.
  const rule = buildRule(tenant.fiscalYearEndRule);
  const period = rule ? periodForYear(rule, new Date().getUTCFullYear()) : null;
  const dm = (d: Date) =>
    `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  const periodoHint = period
    ? `Período ${dm(period.start)} al ${dm(period.end)}${period.end.getUTCFullYear() > period.start.getUTCFullYear() ? " del año siguiente" : ""}.`
    : "Definí el cierre del ejercicio en Configuración.";

  const ym = (d: Date) => ({ y: d.getUTCFullYear(), m: d.getUTCMonth() + 1 });

  // Hito calculado de movimiento de socios de un mes (año+mes), derivado de los
  // datos de User (creación = alta, fechas de baja = baja). Tiene la misma forma
  // que un hito de evento (title + body), pero se genera al vuelo y no es
  // editable. Si no hubo movimiento, no se genera nada (null).
  function movementMilestone(year: number, month: number) {
    const altas: string[] = [];
    const bajas: string[] = [];
    for (const u of members) {
      const a = ym(u.createdAt);
      if (a.y === year && a.m === month) altas.push(u.name);
      for (const d of u.deactivatedAt) {
        const b = ym(d);
        if (b.y === year && b.m === month) {
          bajas.push(u.name);
          break;
        }
      }
    }
    if (altas.length === 0 && bajas.length === 0) return null;
    const lines: string[] = [];
    if (altas.length) lines.push(`Altas: ${altas.sort().join(", ")}`);
    if (bajas.length) lines.push(`Bajas: ${bajas.sort().join(", ")}`);
    return {
      id: `mov-${year}-${month}`,
      title: "Movimiento de socios",
      body: lines.join("\n"),
      derived: true,
    };
  }

  const memorias = memoriasRaw.map((m) => {
    // El ejercicio arranca en el mes de periodStart (depende del cierre
    // configurado al crear la memoria). De ahí salen el orden de los meses y
    // el año calendario de cada uno: desde el mes de inicio = año del
    // ejercicio; los anteriores = año siguiente.
    const startMonth = m.periodStart.getUTCMonth() + 1;
    const calYear = (month: number) => (month >= startMonth ? m.year : m.year + 1);
    const mesesEjercicio = Array.from(
      { length: 12 },
      (_, i) => ((startMonth - 1 + i) % 12) + 1,
    );
    const byMonth = new Map(m.entries.map((e) => [e.month, e]));

    // Cada mes lista sus hitos: primero el de movimiento de socios (calculado),
    // luego los eventos cargados. Los eventos llevan `derived: false`.
    const months = mesesEjercicio.map((month) => {
      const e = byMonth.get(month);
      const mov = movementMilestone(calYear(month), month);
      const events = (e?.milestones ?? []).map((h) => ({
        id: h.id,
        title: h.title,
        body: h.body,
        derived: false,
      }));
      return {
        id: e?.id ?? null,
        month,
        milestones: mov ? [mov, ...events] : events,
      };
    });

    return {
      id: m.id,
      year: m.year,
      periodStart: m.periodStart.toISOString(),
      periodEnd: m.periodEnd.toISOString(),
      summary: m.summary,
      status: m.status,
      entries: months,
    };
  });

  const avisos = avisosFor(
    await getAvisosClub(tenantId),
    "/administrador/directiva/memorias",
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title="Memorias"
        description="Memorias anuales del club, ejercicio por ejercicio. Resumen del período y detalle mensual de hitos, altas y bajas de socios."
      />
      <AvisoBanner messages={avisos} />

      <MemoriasPanel memorias={memorias} periodoHint={periodoHint} />

      {memorias.length === 0 && (
        <EmptyState
          icon={<MemoriasIcon />}
          title="Todavía no hay memorias cargadas"
          description="Creá la memoria de un ejercicio para empezar a registrar el resumen del período y su detalle mensual."
        />
      )}
    </div>
  );
}

function MemoriasIcon() {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}
