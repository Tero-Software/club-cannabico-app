import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { can } from "@/lib/permissions";
import { formatDateShort, formatGramos } from "@/lib/format";
import {
  endOfMonth,
  groupByMonth,
  groupByWeekdayAverage,
  histogramBuckets,
  monthsBetween,
  startOfMonth,
  subDays,
  subMonths,
  topN,
} from "@/lib/stats";
import {
  ActiveMembersLineChart,
  AgeHistogramChart,
  DistributionChart,
  MonthlyGramsChart,
  TopStrainsChart,
  WeekdayChart,
} from "./charts";

export const metadata = { title: "Estadísticas" };

export default async function EstadisticasPage() {
  const session = await auth();
  if (!can(session, "estadisticas:view")) notFound();

  const now = new Date();
  const twelveMonthsAgo = startOfMonth(subMonths(now, 11));
  const threeMonthsAgo = subMonths(now, 3);
  const ninetyDaysAgo = subDays(now, 90);
  const sixtyDaysAgo = subDays(now, 60);
  const thirtyDaysAgo = subDays(now, 30);
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const lastMonthEnd = endOfMonth(subMonths(now, 1));

  const tenantId = session!.user.tenantId;
  const [withdrawals12m, activeMembers] = await Promise.all([
    prisma.withdrawal.findMany({
      where: { tenantId, status: "COMPLETED", date: { gte: twelveMonthsAgo } },
      select: {
        date: true,
        userId: true,
        user: { select: { name: true } },
        items: {
          select: {
            amount: true,
            strainId: true,
            strain: { select: { name: true } },
          },
        },
      },
    }),
    prisma.user.findMany({
      where: { tenantId, role: "MEMBER", active: true },
      select: { createdAt: true },
    }),
  ]);

  type WithdrawalRow = (typeof withdrawals12m)[number];
  type Item = WithdrawalRow["items"][number];

  const flatItems: (Item & { date: Date; userId: string; userName: string })[] =
    withdrawals12m.flatMap((w) =>
      w.items.map((i) => ({
        ...i,
        date: w.date,
        userId: w.userId,
        userName: w.user.name,
      })),
    );

  // 1. Gramos por mes (12 meses)
  const monthlyGrams = groupByMonth(
    flatItems,
    (i) => i.date,
    (i) => i.amount,
    now,
  );

  // 2. Gramos promedio por día de semana (últimos 90 días)
  const last90 = flatItems.filter((i) => i.date >= ninetyDaysAgo);
  const weekdayAvg = groupByWeekdayAverage(
    last90,
    (i) => i.date,
    (i) => i.amount,
  );

  // 3. Top genéticas (últimos 3 meses)
  const last3m = flatItems.filter((i) => i.date >= threeMonthsAgo);
  const topStrains = topN(
    last3m,
    (i) => i.strainId,
    (i) => i.strain.name,
    (i) => i.amount,
    8,
  );

  // 4. Velocidad por genética (últimos 30 días) + delta vs 30-60
  const last30 = flatItems.filter((i) => i.date >= thirtyDaysAgo);
  const last30to60 = flatItems.filter(
    (i) => i.date >= sixtyDaysAgo && i.date < thirtyDaysAgo,
  );
  const speedByStrain = topN(
    last30,
    (i) => i.strainId,
    (i) => i.strain.name,
    (i) => i.amount,
    20,
  );
  const prevSpeedMap = new Map<string, number>();
  for (const s of topN(
    last30to60,
    (i) => i.strainId,
    (i) => i.strain.name,
    (i) => i.amount,
    100,
  )) {
    prevSpeedMap.set(s.key, s.value);
  }
  const speedRows = speedByStrain.map((s) => {
    const current = s.value / 30;
    const prev = (prevSpeedMap.get(s.key) ?? 0) / 30;
    const delta = prev === 0 ? null : ((current - prev) / prev) * 100;
    return { name: s.label, current, prev, delta };
  });

  // 5. Socios activos únicos por mes (12 meses)
  const monthlyUserIds = new Map<string, Set<string>>();
  for (const w of withdrawals12m) {
    const key = `${w.date.getFullYear()}-${String(w.date.getMonth() + 1).padStart(2, "0")}`;
    if (!monthlyUserIds.has(key)) monthlyUserIds.set(key, new Set());
    monthlyUserIds.get(key)!.add(w.userId);
  }
  const activeMembersByMonth = groupByMonth(
    withdrawals12m,
    (w) => w.date,
    () => 0,
    now,
  ).map((m) => ({
    ...m,
    value: monthlyUserIds.get(m.month)?.size ?? 0,
  }));

  // 6. Distribución de consumo (mes pasado completo)
  const lastMonthItems = flatItems.filter(
    (i) => i.date >= lastMonthStart && i.date <= lastMonthEnd,
  );
  const lastMonthByUser = new Map<string, number>();
  for (const i of lastMonthItems) {
    lastMonthByUser.set(
      i.userId,
      (lastMonthByUser.get(i.userId) ?? 0) + i.amount,
    );
  }
  const distribution = histogramBuckets(
    Array.from(lastMonthByUser.values()),
    [
      { label: "0–10", min: 0, max: 10 },
      { label: "10–20", min: 10, max: 20 },
      { label: "20–30", min: 20, max: 30 },
      { label: "30–40", min: 30, max: 40 },
      { label: "40+", min: 40, max: Number.POSITIVE_INFINITY },
    ],
  );

  // 7. Top 10 socios (últimos 3 meses)
  const userAgg = new Map<
    string,
    { name: string; grams: number; count: Set<string>; lastDate: Date }
  >();
  for (const w of withdrawals12m) {
    if (w.date < threeMonthsAgo) continue;
    for (const it of w.items) {
      const cur = userAgg.get(w.userId);
      if (cur) {
        cur.grams += it.amount;
      } else {
        userAgg.set(w.userId, {
          name: w.user.name,
          grams: it.amount,
          count: new Set(),
          lastDate: w.date,
        });
      }
    }
  }
  for (const w of withdrawals12m) {
    if (w.date < threeMonthsAgo) continue;
    const cur = userAgg.get(w.userId);
    if (cur) {
      cur.count.add(w.date.toISOString());
      if (w.date > cur.lastDate) cur.lastDate = w.date;
    }
  }
  const topMembers = Array.from(userAgg.entries())
    .map(([userId, v]) => ({
      userId,
      name: v.name,
      grams: v.grams,
      count: v.count.size,
      lastDate: v.lastDate,
    }))
    .sort((a, b) => b.grams - a.grams)
    .slice(0, 10);

  // 8. Antigüedad de socios activos
  const ages = activeMembers.map((m) => monthsBetween(m.createdAt, now));
  const avgAgeMonths =
    ages.length > 0 ? ages.reduce((s, v) => s + v, 0) / ages.length : 0;
  const ageHistogram = histogramBuckets(ages, [
    { label: "0–3 m", min: 0, max: 3 },
    { label: "3–6 m", min: 3, max: 6 },
    { label: "6–12 m", min: 6, max: 12 },
    { label: "12+ m", min: 12, max: Number.POSITIVE_INFINITY },
  ]);

  const totalGrams12m = flatItems.reduce((s, i) => s + i.amount, 0);
  const totalGramsLastMonth = lastMonthItems.reduce((s, i) => s + i.amount, 0);
  const uniqueUsersLastMonth = lastMonthByUser.size;

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold mb-1">Estadísticas</h1>
        <p className="text-[var(--muted-foreground)] text-sm">
          Evolución del consumo y de la base de socios.
        </p>
      </div>

      <section className="space-y-6">
        <header className="flex items-end justify-between flex-wrap gap-2">
          <h2 className="text-xl font-semibold">Demanda</h2>
          <div className="flex gap-4 text-xs text-[var(--muted-foreground)]">
            <span>
              Últimos 12 m:{" "}
              <strong className="text-[var(--foreground)]">
                {formatGramos(totalGrams12m)}
              </strong>
            </span>
            <span>
              Mes pasado:{" "}
              <strong className="text-[var(--foreground)]">
                {formatGramos(totalGramsLastMonth)}
              </strong>
            </span>
          </div>
        </header>

        <div className="card">
          <h3 className="text-sm font-medium mb-3">Gramos retirados por mes</h3>
          <MonthlyGramsChart data={monthlyGrams} />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="text-sm font-medium mb-3">
              Promedio por día (últimos 90 d)
            </h3>
            <WeekdayChart data={weekdayAvg} />
          </div>
          <div className="card">
            <h3 className="text-sm font-medium mb-3">
              Top genéticas (últimos 3 m)
            </h3>
            {topStrains.length === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)]">
                Sin datos en el período.
              </p>
            ) : (
              <TopStrainsChart data={topStrains} />
            )}
          </div>
        </div>

        <div className="card">
          <h3 className="text-sm font-medium mb-3">
            Velocidad de consumo por genética (últimos 30 d)
          </h3>
          {speedRows.length === 0 ? (
            <p className="text-sm text-[var(--muted-foreground)]">
              Sin datos en el período.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-[var(--muted-foreground)]">
                    <th className="py-2 pr-4">Genética</th>
                    <th className="py-2 pr-4 text-right">g / día</th>
                    <th className="py-2 pr-4 text-right">30 d previos</th>
                    <th className="py-2 text-right">Δ</th>
                  </tr>
                </thead>
                <tbody>
                  {speedRows.map((r) => (
                    <tr key={r.name} className="border-t border-[var(--border)]">
                      <td className="py-2 pr-4">{r.name}</td>
                      <td className="py-2 pr-4 text-right">
                        {r.current.toLocaleString("es-AR", {
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="py-2 pr-4 text-right text-[var(--muted-foreground)]">
                        {r.prev.toLocaleString("es-AR", {
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td
                        className="py-2 text-right"
                        style={{
                          color:
                            r.delta === null
                              ? "var(--muted-foreground)"
                              : r.delta >= 0
                                ? "var(--primary-hover)"
                                : "var(--accent-red)",
                        }}
                      >
                        {r.delta === null
                          ? "—"
                          : `${r.delta >= 0 ? "↑" : "↓"} ${Math.abs(r.delta).toFixed(0)}%`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <section className="space-y-6">
        <header className="flex items-end justify-between flex-wrap gap-2">
          <h2 className="text-xl font-semibold">Socios</h2>
          <div className="flex gap-4 text-xs text-[var(--muted-foreground)]">
            <span>
              Activos ahora:{" "}
              <strong className="text-[var(--foreground)]">
                {activeMembers.length}
              </strong>
            </span>
            <span>
              Únicos mes pasado:{" "}
              <strong className="text-[var(--foreground)]">
                {uniqueUsersLastMonth}
              </strong>
            </span>
          </div>
        </header>

        <div className="card">
          <h3 className="text-sm font-medium mb-3">
            Socios únicos con retiro por mes
          </h3>
          <ActiveMembersLineChart data={activeMembersByMonth} />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="text-sm font-medium mb-3">
              Distribución de consumo (mes pasado)
            </h3>
            <DistributionChart data={distribution} />
            <p className="text-xs text-[var(--muted-foreground)] mt-2">
              Gramos retirados por socio.
            </p>
          </div>
          <div className="card">
            <h3 className="text-sm font-medium mb-1">
              Antigüedad de socios activos
            </h3>
            <p className="text-xs text-[var(--muted-foreground)] mb-3">
              Promedio:{" "}
              <strong className="text-[var(--foreground)]">
                {avgAgeMonths.toFixed(1)} meses
              </strong>
            </p>
            <AgeHistogramChart data={ageHistogram} />
          </div>
        </div>

        <div className="card">
          <h3 className="text-sm font-medium mb-3">
            Top 10 socios (últimos 3 m)
          </h3>
          {topMembers.length === 0 ? (
            <p className="text-sm text-[var(--muted-foreground)]">
              Sin datos en el período.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-[var(--muted-foreground)]">
                    <th className="py-2 pr-4">Socio</th>
                    <th className="py-2 pr-4 text-right">Gramos</th>
                    <th className="py-2 pr-4 text-right">Retiros</th>
                    <th className="py-2 text-right">Último</th>
                  </tr>
                </thead>
                <tbody>
                  {topMembers.map((m) => (
                    <tr
                      key={m.userId}
                      className="border-t border-[var(--border)]"
                    >
                      <td className="py-2 pr-4">{m.name}</td>
                      <td className="py-2 pr-4 text-right">
                        {formatGramos(m.grams)}
                      </td>
                      <td className="py-2 pr-4 text-right">{m.count}</td>
                      <td className="py-2 text-right text-[var(--muted-foreground)]">
                        {formatDateShort(m.lastDate)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
