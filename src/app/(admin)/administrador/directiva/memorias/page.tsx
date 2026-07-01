import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader, EmptyState } from "@/components/ui/page-scaffold";
import { MemoriasPanel } from "./memorias-panel";

export const metadata = { title: "Memorias (directiva)" };

export default async function MemoriasPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/socio");

  const tenantId = session.user.tenantId;

  const [memoriasRaw, members] = await Promise.all([
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
  ]);

  // El ejercicio arranca en abril: se ordena abril→marzo (4..12, 1..3).
  const cronOrder = (month: number) => (month >= 4 ? month - 4 : month + 8);
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
    // Año calendario de cada mes del ejercicio: abril–diciembre = año del
    // ejercicio; enero–marzo = año siguiente.
    const calYear = (month: number) => (month >= 4 ? m.year : m.year + 1);
    const byMonth = new Map(m.entries.map((e) => [e.month, e]));

    // Cada mes lista sus hitos: primero el de movimiento de socios (calculado),
    // luego los eventos cargados. Los eventos llevan `derived: false`.
    const months = [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3].map((month) => {
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
      entries: months.sort((a, b) => cronOrder(a.month) - cronOrder(b.month)),
    };
  });

  return (
    <div className="space-y-8">
      <PageHeader
        title="Memorias"
        description="Memorias anuales del club, ejercicio por ejercicio (01/04 al 31/03). Resumen del período y detalle mensual de hitos, altas y bajas de socios."
      />

      <MemoriasPanel memorias={memorias} />

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
