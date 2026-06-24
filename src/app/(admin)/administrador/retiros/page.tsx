import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { getClubConfig } from "@/lib/config";
import { formatDate, formatGramos, estadoBadgeClass, estadoLabel } from "@/lib/format";
import type { WithdrawalStatus } from "@/generated/prisma/enums";
import { EstadoButton } from "./estado-button";
import { NuevoRetiroHeader } from "./nuevo-retiro-toggle";

export const metadata = { title: "Retiros (administrador)" };

type Filtro = WithdrawalStatus | "TODOS" | "PENDIENTES";

const FILTROS: { label: string; value: Filtro }[] = [
  { label: "Todos", value: "TODOS" },
  { label: "Pendientes", value: "PENDIENTES" },
  { label: "Completados", value: "COMPLETED" },
  { label: "Rechazados", value: "REJECTED" },
  { label: "Cancelados", value: "CANCELLED" },
];

export default async function AdminRetirosPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>;
}) {
  const session = await auth();
  if (!can(session, "retiros:manage")) notFound();

  const { estado } = await searchParams;
  const filtro = FILTROS.find((f) => f.value === estado)?.value ?? "TODOS";
  const tenantId = session!.user.tenantId;

  const statusWhere =
    filtro === "TODOS"
      ? {}
      : filtro === "PENDIENTES"
        ? { status: { in: ["PENDING", "APPROVED"] as WithdrawalStatus[] } }
        : { status: filtro as WithdrawalStatus };

  const [retiros, socios, containerItems, config] = await Promise.all([
    prisma.withdrawal.findMany({
      where: { tenantId, ...statusWhere },
      include: {
        items: { include: { strain: true } },
        user: { select: { name: true, email: true, role: true } },
      },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: 100,
    }),
    prisma.user.findMany({
      where: { tenantId, role: "MEMBER", active: true },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
    prisma.containerItem.findMany({
      where: { tenantId, active: true, currentWeight: { gt: 0 } },
      include: {
        strain: { select: { id: true, name: true } },
        reservations: { select: { amount: true } },
      },
    }),
    getClubConfig(tenantId),
  ]);

  const strainFreeMap = new Map<string, { id: string; name: string }>();
  for (const item of containerItems) {
    if (!item.strain) continue;
    const reserved = item.reservations.reduce((s, r) => s + r.amount, 0);
    const free = item.currentWeight - reserved;
    if (free <= 0) continue;
    if (!strainFreeMap.has(item.strain.id)) {
      strainFreeMap.set(item.strain.id, {
        id: item.strain.id,
        name: item.strain.name,
      });
    }
  }
  const strains = [...strainFreeMap.values()].sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  return (
    <div>
      <NuevoRetiroHeader
        title="Retiros"
        socios={socios}
        strains={strains}
        horarios={config.horarios}
      />

      <div className="flex flex-wrap gap-2 mb-6">
        {FILTROS.map((f) => (
          <Link
            key={f.value}
            href={f.value === "TODOS" ? "/administrador/retiros" : `/administrador/retiros?estado=${f.value}`}
            className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
              filtro === f.value
                ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                : "border-[var(--border)] hover:bg-[var(--muted)]"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {retiros.length === 0 ? (
        <div className="card text-center text-[var(--muted-foreground)] py-12">
          No hay retiros para este filtro.
        </div>
      ) : (
        <div className="space-y-3">
          {retiros.map((r) => {
            const total = r.items.reduce((s, i) => s + i.amount, 0);
            const isDemo = r.user.role === "VISITANTE";
            return (
            <div key={r.id} className={`card${isDemo ? " border-yellow-400" : ""}`}>
              <div className="flex items-start justify-between flex-wrap gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-medium">{r.user.name}</span>
                    <span className="text-sm text-[var(--muted-foreground)]">
                      {r.user.email}
                    </span>
                    {isDemo && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-yellow-400 text-yellow-950">
                        DEMO
                      </span>
                    )}
                    <span className={estadoBadgeClass(r.status)}>
                      {estadoLabel(r.status)}
                    </span>
                  </div>
                  <div className="text-sm text-[var(--muted-foreground)] mb-1">
                    {formatDate(r.date)} · {r.timeSlot} · {formatGramos(total)}
                  </div>
                  <ul className="text-sm space-y-0.5">
                    {r.items.map((it) => (
                      <li key={it.id}>
                        {it.strain.name} — {formatGramos(it.amount)}
                      </li>
                    ))}
                  </ul>
                  {r.notes && (
                    <div className="text-sm mt-2 text-[var(--muted-foreground)] italic">
                      {r.notes}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 border-t border-[var(--border)] pt-3">
                {isDemo ? (
                  <span className="text-sm text-[var(--muted-foreground)] italic">
                    Retiro de prueba — no se confirma desde acá.
                  </span>
                ) : (
                  <>
                    {r.status === "PENDING" && (
                      <>
                        <EstadoButton id={r.id} status="APPROVED" label="Aprobar" variant="primary" />
                        <EstadoButton id={r.id} status="REJECTED" label="Rechazar" variant="destructive" />
                      </>
                    )}
                    {r.status === "APPROVED" && (
                      <EstadoButton id={r.id} status="COMPLETED" label="Marcar completado" variant="primary" />
                    )}
                    {(r.status === "REJECTED" || r.status === "CANCELLED") && (
                      <EstadoButton id={r.id} status="PENDING" label="Reabrir" variant="secondary" />
                    )}
                    {r.status === "COMPLETED" && (
                      <span className="text-sm text-[var(--muted-foreground)]">
                        Finalizado
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

