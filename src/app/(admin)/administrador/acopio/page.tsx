import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { formatGramos } from "@/lib/format";
import { ContainersPanel } from "./containers-panel";
import type { Container } from "./containers-list";

export const metadata = { title: "Acopio (administrador)" };

export default async function ContainersPage() {
  const session = await auth();
  if (!can(session, "containers:manage")) notFound();

  const tenantId = session!.user.tenantId;
  const [containersRaw, strains] = await Promise.all([
    prisma.container.findMany({
      where: { tenantId },
      orderBy: { number: "asc" },
      include: {
        items: {
          include: {
            strain: { select: { id: true, name: true } },
            movements: { orderBy: { createdAt: "desc" }, take: 20 },
            reservations: { select: { amount: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    }),
    prisma.strain.findMany({
      where: { tenantId },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const containers: Container[] = containersRaw.map((c) => ({
    id: c.id,
    number: c.number,
    notes: c.notes,
    items: c.items.map((item) => ({
      id: item.id,
      strainName: item.strain?.name ?? "Sin genética",
      strainId: item.strain?.id ?? null,
      plantNumber: item.plantNumber,
      initialWeight: item.initialWeight,
      currentWeight: item.currentWeight,
      active: item.active,
      reservedAmount: item.reservations.reduce((s, r) => s + r.amount, 0),
      movements: item.movements.map((m) => ({
        id: m.id,
        type: m.type,
        amount: m.amount,
        notes: m.notes,
        createdAt: m.createdAt.toISOString(),
      })),
    })),
  }));

  // Totals over ALL containers (active flag is for the socio catalog only)
  let totalInitial = 0;
  let totalCurrent = 0;
  for (const c of containers) {
    for (const item of c.items) {
      totalInitial += item.initialWeight;
      totalCurrent += item.currentWeight;
    }
  }
  const totalConsumed = totalInitial - totalCurrent;
  const consumedPct = totalInitial > 0 ? (totalConsumed / totalInitial) * 100 : 0;
  const totalItems = containers.reduce((s, c) => s + c.items.length, 0);
  const activeCount = containers.reduce(
    (s, c) => s + c.items.filter((i) => i.active).length,
    0,
  );

  return (
    <div className="space-y-8">
      <ContainersPanel
        containers={containers}
        strains={strains}
        stats={
          <>
            <div className="card p-0 overflow-hidden">
              <StatRow label="Genéticas activas" value={`${activeCount} / ${totalItems}`} />
              <StatRow label="Stock total" value={formatGramos(totalCurrent)} />
            </div>
            <div className="card p-0 overflow-hidden">
              <StatRow label="Cosecha actual" value={formatGramos(totalInitial)} />
              <StatRow
                label="Consumido"
                value={`${formatGramos(totalConsumed)} (${consumedPct.toFixed(1)}%)`}
              />
            </div>
          </>
        }
      />
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-[var(--border-subtle)] first-of-type:border-t-0">
      <span className="text-sm text-[var(--muted-foreground)]">{label}</span>
      <span className="text-lg font-semibold">{value}</span>
    </div>
  );
}
