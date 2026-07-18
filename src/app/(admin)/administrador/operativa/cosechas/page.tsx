import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { PageHeader, EmptyState } from "@/components/ui/page-scaffold";
import { CosechasPanel } from "./cosechas-panel";

export const metadata = { title: "Cosechas (operativa)" };

export default async function CosechasPage() {
  const session = await auth();
  if (!can(session, "containers:manage")) notFound();

  const tenantId = session!.user.tenantId;

  const [harvestsRaw, strains] = await Promise.all([
    prisma.harvest.findMany({
      where: { tenantId, declarada: false },
      orderBy: { date: "desc" },
      include: {
        containers: {
          orderBy: { number: "asc" },
          include: {
            items: {
              orderBy: { createdAt: "asc" },
              include: { strain: { select: { name: true } } },
            },
          },
        },
      },
    }),
    prisma.strain.findMany({
      where: { tenantId },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const harvests = harvestsRaw.map((h) => ({
    id: h.id,
    date: h.date.toISOString(),
    declarada: h.declarada,
    notes: h.notes,
    containers: h.containers.map((c) => ({
      id: c.id,
      number: c.number,
      items: c.items.map((it) => ({
        strainName: it.strain?.name ?? "Sin genética",
        plantNumber: it.plantNumber,
        weight: it.initialWeight,
      })),
    })),
  }));

  return (
    <div className="space-y-8">
      <PageHeader
        title="Cosechas"
        description="Carga de cosecha antes de declararla al acopio. Al declarar, sus contenedores pasan a acopio."
        action={
          <Link
            href="/administrador/geneticas"
            className="btn btn-secondary text-sm"
          >
            Agregar genética
          </Link>
        }
      />

      <CosechasPanel harvests={harvests} strains={strains} />

      {harvests.length === 0 && (
        <EmptyState
          icon={<CosechaIcon />}
          title="No hay cosechas en curso"
          description="Las cosechas se crean en Trazabilidad. Una vez creadas aparecen acá para cargar contenedores y declararlas. Mientras no la declares, su contenido no aparece en acopio."
        />
      )}
    </div>
  );
}

function CosechaIcon() {
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
      <path d="M12 22v-8" />
      <path d="M12 14c-3 0-6-2-6-6 3 0 6 2 6 6z" />
      <path d="M12 11c0-3 2-6 6-6 0 3-2 6-6 6z" />
    </svg>
  );
}
