import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { PageHeader, EmptyState } from "@/components/ui/page-scaffold";
import { TrazabilidadPanel } from "./trazabilidad-panel";

export const metadata = { title: "Trazabilidad (operativa)" };

export default async function TrazabilidadPage() {
  const session = await auth();
  if (!can(session, "containers:manage")) notFound();

  const tenantId = session!.user.tenantId;

  const [plantsRaw, strains, harvests] = await Promise.all([
    prisma.plant.findMany({
      where: { tenantId },
      orderBy: { number: "asc" },
      include: { strain: { select: { name: true } } },
    }),
    prisma.strain.findMany({
      where: { tenantId },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.harvest.findMany({
      where: { tenantId },
      orderBy: { date: "desc" },
      select: { id: true, date: true },
    }),
  ]);

  const plants = plantsRaw.map((p) => ({
    id: p.id,
    number: p.number,
    strainId: p.strainId,
    strainName: p.strain?.name ?? null,
    harvestId: p.harvestId,
    germinatedAt: p.germinatedAt?.toISOString() ?? null,
    pottedAt: p.pottedAt?.toISOString() ?? null,
    bedAt: p.bedAt?.toISOString() ?? null,
    floweredAt: p.floweredAt?.toISOString() ?? null,
    harvestedAt: p.harvestedAt?.toISOString() ?? null,
    yield: p.yield,
    notes: p.notes,
  }));

  const harvestOptions = harvests.map((h) => ({
    id: h.id,
    label: new Intl.DateTimeFormat("es-UY", { dateStyle: "medium" }).format(
      h.date,
    ),
  }));

  return (
    <div className="space-y-8">
      <PageHeader
        title="Trazabilidad"
        description="Registro de trazabilidad del IRCCA: una ficha por planta con las fechas de cada etapa del ciclo, el rendimiento y las observaciones."
      />

      <TrazabilidadPanel
        plants={plants}
        strains={strains}
        harvests={harvestOptions}
      />

      {plants.length === 0 && (
        <EmptyState
          icon={<TrazabilidadIcon />}
          title="Todavía no hay plantas cargadas"
          description="Cargá una planta para empezar a registrar su recorrido, desde la germinación hasta la cosecha."
        />
      )}
    </div>
  );
}

function TrazabilidadIcon() {
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
      <circle cx="5" cy="6" r="2" />
      <circle cx="12" cy="18" r="2" />
      <circle cx="19" cy="6" r="2" />
      <path d="M5 8v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8" />
      <line x1="12" y1="13" x2="12" y2="16" />
    </svg>
  );
}
