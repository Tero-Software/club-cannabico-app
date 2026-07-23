import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { PageHeader, EmptyState } from "@/components/ui/page-scaffold";
import { AvisoBanner } from "@/components/aviso-banner";
import { getAvisosClub, avisosFor } from "@/lib/avisos";
import { harvestWindowLabel } from "@/lib/plan-cultivo";
import { TrazabilidadPanel } from "./trazabilidad-panel";

export const metadata = { title: "Trazabilidad (operativa)" };

export default async function TrazabilidadPage() {
  const session = await auth();
  if (!can(session, "containers:manage")) notFound();

  const tenantId = session!.user.tenantId;

  const [harvestsRaw, strains, planEntries] = await Promise.all([
    prisma.harvest.findMany({
      where: { tenantId },
      orderBy: { date: "desc" },
      select: {
        id: true,
        date: true,
        declarada: true,
        plan: { select: { number: true } },
        plants: {
          // Las que no prosperaron van al final; dentro de cada grupo, por número.
          orderBy: [{ notProspered: "asc" }, { number: "asc" }],
          include: { strain: { select: { name: true } } },
        },
      },
    }),
    prisma.strain.findMany({
      where: { tenantId },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.plannedHarvest.findMany({
      where: { tenantId },
      orderBy: { number: "asc" },
      select: { id: true, number: true, harvestRule: true },
    }),
  ]);

  // El motivo del aviso de esta sección (el punto rojo del sidebar).
  const avisos = avisosFor(
    await getAvisosClub(tenantId),
    "/administrador/operativa/trazabilidad",
  );

  const harvests = harvestsRaw.map((h) => ({
    id: h.id,
    date: h.date.toISOString(),
    declarada: h.declarada,
    plan: h.plan,
    plants: h.plants.map((p) => ({
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
      notProspered: p.notProspered,
    })),
  }));

  return (
    <div className="space-y-8">
      <PageHeader
        title="Trazabilidad"
        description="Registro de trazabilidad del IRCCA: cada cosecha agrupa sus plantas, con las fechas de cada etapa del ciclo, el rendimiento y las observaciones."
      />

      <AvisoBanner messages={avisos} />

      <TrazabilidadPanel
        harvests={harvests}
        strains={strains}
        planEntries={planEntries.map((p) => ({
          id: p.id,
          number: p.number,
          harvestLabel: harvestWindowLabel(p.harvestRule),
        }))}
      />

      {harvests.length === 0 && (
        <EmptyState
          icon={<TrazabilidadIcon />}
          title="Todavía no hay cosechas"
          description="Creá una cosecha con su fecha de inicio para empezar a cargar las plantas de su ciclo."
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
