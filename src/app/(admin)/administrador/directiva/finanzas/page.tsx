import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-scaffold";
import { LibroMes, type LibroEntry } from "./libro-mes";
import { NuevoMovimiento } from "./nuevo-movimiento";

export const metadata = { title: "Finanzas (directiva)" };

// Mes del ejercicio en formato YYYY-MM. Devuelve el rango [inicio, finExclusivo).
function monthRange(ym: string): { start: Date; end: Date; label: string } {
  const [y, m] = ym.split("-").map(Number);
  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 1);
  const label = start.toLocaleDateString("es-UY", { month: "long", year: "numeric" });
  return { start, end, label };
}

function currentYm(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function shiftYm(ym: string, delta: number): string {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default async function FinanzasPage({
  searchParams,
}: {
  searchParams: Promise<{ ym?: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/socio");
  const tenantId = session.user.tenantId;

  const { ym: ymRaw } = await searchParams;
  const ym = ymRaw && /^\d{4}-\d{2}$/.test(ymRaw) ? ymRaw : currentYm();
  const { start, end, label } = monthRange(ym);

  const entries = await prisma.financeEntry.findMany({
    where: { tenantId, date: { gte: start, lt: end } },
    orderBy: [{ date: "asc" }, { createdAt: "asc" }],
  });

  const data: LibroEntry[] = entries.map((e) => ({
    id: e.id,
    date: e.date.toISOString(),
    kind: e.kind,
    category: e.category,
    description: e.description,
    amount: e.amount.toNumber(),
    fromWithdrawal: e.withdrawalId != null,
  }));

  const prevYm = shiftYm(ym, -1);
  const nextYm = shiftYm(ym, 1);

  return (
    <div>
      <PageHeader
        title="Finanzas"
        description="Libro de ingresos y egresos por ejercicio mensual. Los cobros de retiros se asientan automáticamente."
      />

      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2">
          <Link href={`/administrador/directiva/finanzas?ym=${prevYm}`} className="btn btn-ghost text-sm">
            ← Mes anterior
          </Link>
          <span className="font-medium capitalize">{label}</span>
          <Link href={`/administrador/directiva/finanzas?ym=${nextYm}`} className="btn btn-ghost text-sm">
            Mes siguiente →
          </Link>
        </div>
        <Link
          href={`/administrador/directiva/finanzas/imprimir?ym=${ym}`}
          className="btn btn-secondary text-sm"
          target="_blank"
        >
          Versión imprimible
        </Link>
      </div>

      <NuevoMovimiento defaultDate={ym} />

      <LibroMes entries={data} />
    </div>
  );
}
