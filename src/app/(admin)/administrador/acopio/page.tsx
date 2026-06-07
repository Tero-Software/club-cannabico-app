import { Link } from "@/components/progress/link";
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
      orderBy: [{ active: "desc" }, { number: "asc" }],
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
    active: c.active,
    items: c.items.map((item) => ({
      id: item.id,
      strainName: item.strain?.name ?? "Sin genética",
      strainId: item.strain?.id ?? null,
      plantNumber: item.plantNumber,
      initialWeight: item.initialWeight,
      currentWeight: item.currentWeight,
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
  const strainStock: Record<string, { name: string; current: number; initial: number }> = {};
  for (const c of containers) {
    for (const item of c.items) {
      totalInitial += item.initialWeight;
      totalCurrent += item.currentWeight;
      const n = item.strainName;
      if (!strainStock[n]) strainStock[n] = { name: n, current: 0, initial: 0 };
      strainStock[n].current += item.currentWeight;
      strainStock[n].initial += item.initialWeight;
    }
  }
  const strainList = Object.values(strainStock).sort((a, b) => b.current - a.current);
  const totalConsumed = totalInitial - totalCurrent;
  const consumedPct = totalInitial > 0 ? (totalConsumed / totalInitial) * 100 : 0;
  const activeCount = containers.filter((c) => c.active).length;

  return (
    <div className="space-y-8">
      <ContainersPanel
        containers={containers}
        strains={strains}
        stats={
          <>
            <StatCard label="Contenedores activos" value={`${activeCount} / ${containers.length}`} />
            <StatCard label="Stock total" value={formatGramos(totalCurrent)} />
            <StatCard label="Cosecha total" value={formatGramos(totalInitial)} />
            <StatCard
              label="Consumido"
              value={`${formatGramos(totalConsumed)} (${consumedPct.toFixed(1)}%)`}
            />
          </>
        }
      />

      {/* ── Stock by strain ───────────────────────────── */}
      {strainList.length > 0 && (
        <section>
          <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
            <h2 className="text-xl font-semibold">Stock por genética</h2>
            <Link
              href="/administrador/geneticas"
              className="btn btn-secondary text-sm"
            >
              Genéticas
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {strainList.map((s) => {
              const pct = s.initial > 0 ? (s.current / s.initial) * 100 : 0;
              return (
                <div key={s.name} className="border border-[var(--border)] bg-[var(--card)] py-3 px-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{s.name}</span>
                    <span className="text-sm text-[var(--muted-foreground)]">
                      {formatGramos(s.current)}
                    </span>
                  </div>
                  <div className="w-full bg-[var(--muted)] h-2">
                    <div
                      className="h-2 transition-all"
                      style={{
                        width: `${Math.max(pct, 1)}%`,
                        background:
                          pct > 50
                            ? "var(--primary)"
                            : pct > 20
                              ? "var(--warning)"
                              : "var(--destructive)",
                      }}
                    />
                  </div>
                  <div className="text-xs text-[var(--muted-foreground)] mt-1">
                    {formatGramos(s.initial - s.current)} consumidos de {formatGramos(s.initial)}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-[var(--border)] bg-[var(--card)] p-4">
      <div className="text-sm text-[var(--muted-foreground)] mb-1">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}
