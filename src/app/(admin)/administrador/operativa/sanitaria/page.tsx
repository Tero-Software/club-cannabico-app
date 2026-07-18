import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { PageHeader, EmptyState } from "@/components/ui/page-scaffold";
import { SanitariaPanel } from "./sanitaria-panel";

export const metadata = { title: "Sanitaria (operativa)" };

export default async function SanitariaPage() {
  const session = await auth();
  if (!can(session, "containers:manage")) notFound();

  const tenantId = session!.user.tenantId;

  const [treatmentsRaw, plants] = await Promise.all([
    prisma.treatment.findMany({
      where: { tenantId },
      orderBy: { date: "desc" },
    }),
    prisma.plant.findMany({
      where: { tenantId },
      orderBy: { number: "asc" },
      select: { id: true, number: true },
    }),
  ]);

  const plantById = new Map(plants.map((p) => [p.id, p.number]));

  const treatments = treatmentsRaw.map((t) => ({
    id: t.id,
    date: t.date.toISOString(),
    description: t.description,
    plantId: t.appliesToAll ? null : t.plantId,
    target:
      t.appliesToAll || !t.plantId
        ? "todas"
        : `planta ${plantById.get(t.plantId) ?? "?"}`,
  }));

  return (
    <div className="space-y-8">
      <PageHeader
        title="Sanitaria"
        description="Registro sanitario del IRCCA: tratamientos aplicados al cultivo, con su fecha y a qué plantas alcanzan."
      />

      <SanitariaPanel treatments={treatments} plants={plants} />

      {treatments.length === 0 && (
        <EmptyState
          icon={<SanitariaIcon />}
          title="Todavía no hay registros sanitarios"
          description="Registrá un tratamiento para empezar a llevar el control sanitario del cultivo."
        />
      )}
    </div>
  );
}

function SanitariaIcon() {
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
      <path d="M11 2a2 2 0 0 0-2 2v5H4a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h5v5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-5h5a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2h-5V4a2 2 0 0 0-2-2z" />
    </svg>
  );
}
