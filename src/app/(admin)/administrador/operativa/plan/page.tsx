import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { PageHeader, EmptyState } from "@/components/ui/page-scaffold";
import { harvestRuleMonths, harvestWindowLabel, hitoLabel } from "@/lib/plan-cultivo";
import { PlanPanel } from "./plan-panel";

export const metadata = { title: "Plan de cultivo (operativa)" };

export default async function PlanCultivoPage() {
  const session = await auth();
  if (!can(session, "containers:manage")) notFound();

  const tenantId = session!.user.tenantId;

  const entriesRaw = await prisma.plannedHarvest.findMany({
    where: { tenantId },
    orderBy: { number: "asc" },
    include: { _count: { select: { harvests: true } } },
  });

  const hito = (month: number | null, weeks: number[]) => ({
    month,
    weeks,
    label: hitoLabel(month, weeks),
  });

  const entries = entriesRaw.map((e) => ({
    id: e.id,
    number: e.number,
    germination: hito(e.germinationMonth, e.germinationWeeks),
    potting: hito(e.pottingMonth, e.pottingWeeks),
    bed: hito(e.bedMonth, e.bedWeeks),
    harvestMonths: harvestRuleMonths(e.harvestRule),
    harvestLabel: harvestWindowLabel(e.harvestRule),
    notes: e.notes,
    harvestsCount: e._count.harvests,
  }));

  return (
    <div className="space-y-8">
      <PageHeader
        title="Plan de cultivo"
        description="Las siembras que el club presenta al IRCCA, numeradas y con los hitos aproximados del ciclo tal como figuran en el plan. Al crear una cosecha en trazabilidad se la engancha a su siembra y toma el número; cuando se acerca la ventana de cosecha estimada, la app avisa."
      />

      <PlanPanel entries={entries} />

      {entries.length === 0 && (
        <EmptyState
          icon={<PlanIcon />}
          title="Todavía no hay plan de cultivo"
          description="Agregá las siembras del plan con su número, los hitos aproximados y los meses de cosecha estimada."
        />
      )}
    </div>
  );
}

function PlanIcon() {
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
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <path d="M8 2v4M16 2v4M3 9h18" />
    </svg>
  );
}
