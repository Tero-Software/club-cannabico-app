import { Link } from "@/components/progress/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDate, formatGramos, estadoLabel, estadoBadgeClass } from "@/lib/format";

export default async function DashboardHome() {
  const session = await auth();
  if (!session) return null;

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const tenantId = session.user.tenantId;
  const [proximos, historial, total] = await Promise.all([
    prisma.withdrawal.findMany({
      where: {
        tenantId,
        userId: session.user.id,
        date: { gte: now },
        status: { in: ["PENDING", "APPROVED"] },
      },
      include: { items: { include: { strain: true } } },
      orderBy: { date: "asc" },
      take: 5,
    }),
    prisma.withdrawal.findMany({
      where: { tenantId, userId: session.user.id, status: "COMPLETED" },
      include: { items: { include: { strain: true } } },
      orderBy: { date: "desc" },
      take: 3,
    }),
    prisma.withdrawal.count({
      where: { tenantId, userId: session.user.id, status: "COMPLETED" },
    }),
  ]);

  return (
    <div className="space-y-8">
      <div className="grid sm:grid-cols-3 gap-4">
        <Stat label="Próximos retiros" value={proximos.length.toString()} />
        <Stat label="Retiros completados" value={total.toString()} />
        <Link
          href="/socio/retiros/nuevo"
          className="card hover:border-[var(--primary)] transition-colors flex items-center justify-center text-center"
        >
          <div className="font-medium">Agendar nuevo retiro</div>
        </Link>
      </div>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Próximos retiros</h2>
          <Link
            href="/socio/retiros"
            className="text-sm text-[var(--primary)]"
          >
            Ver todos →
          </Link>
        </div>
        {proximos.length === 0 ? (
          <div className="card text-center text-[var(--muted-foreground)]">
            No tenés retiros agendados.{" "}
            <Link
              href="/socio/retiros/nuevo"
              className="text-[var(--primary)] font-medium"
            >
              Agendar uno
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {proximos.map((r) => {
              const total = r.items.reduce((s, i) => s + i.amount, 0);
              return (
                <div key={r.id} className="card flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <div className="font-medium">
                      {formatDate(r.date)} · {r.timeSlot}
                    </div>
                    <div className="text-sm text-[var(--muted-foreground)]">
                      {r.items.map((it) => it.strain.name).join(", ")} · {formatGramos(total)}
                    </div>
                  </div>
                  <span className={estadoBadgeClass(r.status)}>
                    {estadoLabel(r.status)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {historial.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold mb-4">Últimos completados</h2>
          <div className="space-y-3">
            {historial.map((r) => {
              const total = r.items.reduce((s, i) => s + i.amount, 0);
              return (
                <div key={r.id} className="card flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <div className="font-medium">
                      {formatDate(r.date)} · {formatGramos(total)}
                    </div>
                    <div className="text-sm text-[var(--muted-foreground)]">
                      {r.items.map((it) => it.strain.name).join(", ")}
                    </div>
                  </div>
                  <span className={estadoBadgeClass(r.status)}>
                    {estadoLabel(r.status)}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card">
      <div className="text-sm text-[var(--muted-foreground)] mb-1">{label}</div>
      <div className="text-3xl font-bold">{value}</div>
    </div>
  );
}
