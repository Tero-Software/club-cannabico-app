import Link from "next/link";
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

  const tenantId = session!.user.tenantId;
  const puedeVerRetiros = can(session, "retiros:manage");

  const [retirosHoy, retirosPendientes] = await Promise.all([
    puedeVerRetiros
      ? prisma.withdrawal.findMany({
          where: {
            tenantId,
            date: { gte: today, lt: tomorrow },
            status: { in: ["PENDING", "APPROVED"] },
          },
          include: {
            items: { include: { strain: true } },
            user: { select: { name: true } },
          },
          orderBy: { date: "asc" },
        })
      : Promise.resolve([] as never[]),
    puedeVerRetiros
      ? prisma.withdrawal.findMany({
          where: {
            tenantId,
            date: { gte: tomorrow },
            status: { in: ["PENDING", "APPROVED"] },
          },
          include: {
            items: { include: { strain: true } },
            user: { select: { name: true } },
          },
          orderBy: { date: "asc" },
          take: 12,
        })
      : Promise.resolve([] as never[]),
  ]);

  const hayActividad =
    puedeVerRetiros && (retirosHoy.length > 0 || retirosPendientes.length > 0);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Actividades próximas</h1>

      {puedeVerRetiros && (retirosHoy.length > 0 || retirosPendientes.length > 0) && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold">Retiros</h2>
            <Link
              href="/administrador/retiros"
              className="text-sm text-[var(--primary)]"
            >
              Ver todos →
            </Link>
          </div>
          <div className="card p-0 overflow-hidden">
            {retirosHoy.map((r) => (
              <RetiroRow key={r.id} retiro={r} />
            ))}

            {retirosHoy.length > 0 && retirosPendientes.length > 0 && (
              <div className="border-t border-[var(--border-subtle)]" />
            )}

            {retirosPendientes.map((r) => (
              <RetiroRow key={r.id} retiro={r} />
            ))}
          </div>
        </section>
      )}

      {!hayActividad && (
        <p className="text-[var(--muted-foreground)]">
          No hay actividades próximas.
        </p>
      )}
    </div>
  );
}

function RetiroRow({
  retiro: r,
}: {
  retiro: {
    id: string;
    date: Date;
    timeSlot: string;
    status: "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED" | "CANCELLED";
    user: { name: string | null };
    items: { amount: number; strain: { name: string } }[];
  };
}) {
  const total = r.items.reduce((s, i) => s + i.amount, 0);
  return (
    <div className="flex items-center justify-between gap-3 px-5 py-2.5 border-t border-[var(--border-subtle)] first-of-type:border-t-0 hover:bg-[var(--surface-2)] transition-colors">
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{r.user.name}</div>
        <div className="text-sm text-[var(--muted-foreground)] truncate">
          {formatDate(r.date)} · {r.timeSlot} · {formatGramos(total)} ·{" "}
          {r.items.map((it) => it.strain.name).join(", ")}
        </div>
      </div>
      <span className={estadoBadgeClass(r.status)}>{estadoLabel(r.status)}</span>
    </div>
  );
}

