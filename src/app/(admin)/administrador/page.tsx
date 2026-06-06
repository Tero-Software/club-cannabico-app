import { Link } from "@/components/progress/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { can } from "@/lib/permissions";
import { formatDate, formatGramos, estadoBadgeClass, estadoLabel } from "@/lib/format";

export const metadata = { title: "Administrador" };

export default async function AdminHome() {
  const session = await auth();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const puedeVerSocios = can(session, "socios:manage");
  const puedeVerRetiros = can(session, "retiros:manage");
  const puedeVerGeneticas = can(session, "geneticas:manage");
  const puedeVerContainers = can(session, "containers:manage");

  const [
    sociosActivos,
    retirosPendientes,
    retirosHoy,
    retirosProximos,
    geneticasActivas,
    stockAgg,
  ] = await Promise.all([
    puedeVerSocios
      ? prisma.user.count({ where: { role: "MEMBER", active: true } })
      : Promise.resolve(0),
    puedeVerRetiros
      ? prisma.withdrawal.count({
          where: { status: { in: ["PENDING", "APPROVED"] } },
        })
      : Promise.resolve(0),
    puedeVerRetiros
      ? prisma.withdrawal.count({ where: { date: { gte: today, lt: tomorrow } } })
      : Promise.resolve(0),
    puedeVerRetiros
      ? prisma.withdrawal.findMany({
          where: {
            date: { gte: today },
            status: { in: ["PENDING", "APPROVED"] },
          },
          include: {
            items: { include: { strain: true } },
            user: { select: { name: true } },
          },
          orderBy: { date: "asc" },
          take: 8,
        })
      : Promise.resolve([] as never[]),
    puedeVerGeneticas
      ? prisma.containerItem
          .findMany({
            where: { currentWeight: { gt: 0 } },
            select: { strainId: true },
            distinct: ["strainId"],
          })
          .then((rows) => rows.length)
      : Promise.resolve(0),
    puedeVerContainers
      ? prisma.containerItem.aggregate({
          _sum: { currentWeight: true },
        })
      : Promise.resolve({ _sum: { currentWeight: null } }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-1">Panel de administración</h1>
        <p className="text-[var(--muted-foreground)]">
          Resumen general del club.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {puedeVerSocios && (
          <Stat
            label="Socios activos"
            value={`${sociosActivos} / 45`}
            href="/administrador/socios"
          />
        )}
        {puedeVerRetiros && (
          <>
            <Stat
              label="Retiros pendientes"
              value={retirosPendientes.toString()}
              href="/administrador/retiros?estado=PENDIENTES"
              accent={retirosPendientes > 0}
            />
            <Stat
              label="Retiros hoy"
              value={retirosHoy.toString()}
              href="/administrador/retiros"
            />
          </>
        )}
        {puedeVerGeneticas && (
          <Stat
            label="Genéticas en stock"
            value={geneticasActivas.toString()}
            href="/administrador/geneticas"
          />
        )}
        {puedeVerContainers && (
          <Stat
            label="Stock total"
            value={formatGramos(stockAgg._sum.currentWeight ?? 0)}
            href="/administrador/acopio"
          />
        )}
      </div>

      {puedeVerRetiros && (
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Próximos retiros</h2>
          <Link href="/administrador/retiros" className="text-sm text-[var(--primary)]">
            Ver todos →
          </Link>
        </div>
        {retirosProximos.length === 0 ? (
          <div className="card text-center text-[var(--muted-foreground)]">
            No hay retiros próximos.
          </div>
        ) : (
          <div className="space-y-2">
            {retirosProximos.map((r) => {
              const total = r.items.reduce((s, i) => s + i.amount, 0);
              return (
                <div key={r.id} className="card flex items-center justify-between flex-wrap gap-3 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{r.user.name}</div>
                    <div className="text-sm text-[var(--muted-foreground)]">
                      {formatDate(r.date)} · {r.timeSlot} · {formatGramos(total)} ·{" "}
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
        )}
      </section>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  href,
  accent,
}: {
  label: string;
  value: string;
  href: string;
  accent?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`card hover:border-[var(--primary)] transition-colors block ${
        accent ? "border-[var(--warning)]" : ""
      }`}
    >
      <div className="text-sm text-[var(--muted-foreground)] mb-1">{label}</div>
      <div className="text-3xl font-bold">{value}</div>
    </Link>
  );
}
