import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDate, formatGramos, estadoLabel, estadoBadgeClass } from "@/lib/format";
import { CancelButton } from "./cancel-button";

export const metadata = { title: "Mis retiros" };

export default async function RetirosPage() {
  const session = await auth();
  if (!session) return null;

  const retiros = await prisma.withdrawal.findMany({
    where: { tenantId: session.user.tenantId, userId: session.user.id },
    include: { items: { include: { strain: true } } },
    orderBy: { date: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-3xl font-bold">Mis retiros</h1>
        <Link href="/socio/retiros/nuevo" className="btn btn-primary">
          Agendar retiro
        </Link>
      </div>

      {retiros.length === 0 ? (
        <div className="card text-center text-[var(--muted-foreground)] py-12">
          Todavía no agendaste ningún retiro.
        </div>
      ) : (
        <div className="space-y-3">
          {retiros.map((r) => {
            const cancelable =
              r.status === "PENDING" || r.status === "APPROVED";
            const total = r.items.reduce((s, i) => s + i.amount, 0);
            return (
              <div key={r.id} className="card">
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className="font-medium">
                        {formatDate(r.date)} · {r.timeSlot}
                      </span>
                      <span className={estadoBadgeClass(r.status)}>
                        {estadoLabel(r.status)}
                      </span>
                      <span className="text-sm text-[var(--muted-foreground)]">
                        {formatGramos(total)}
                      </span>
                    </div>
                    <ul className="text-sm text-[var(--muted-foreground)] space-y-0.5">
                      {r.items.map((it) => (
                        <li key={it.id}>
                          {it.strain.name} — {formatGramos(it.amount)}
                        </li>
                      ))}
                    </ul>
                    {r.notes && (
                      <div className="text-sm mt-2 text-[var(--muted-foreground)]">
                        {r.notes}
                      </div>
                    )}
                  </div>
                  {cancelable && <CancelButton id={r.id} />}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
