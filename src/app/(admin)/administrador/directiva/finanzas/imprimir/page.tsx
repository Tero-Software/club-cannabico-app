import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/billing";
import { PrintTrigger } from "./print-trigger";

export const metadata = { title: "Finanzas — Versión imprimible" };

function monthRange(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 1);
  const label = start.toLocaleDateString("es-UY", { month: "long", year: "numeric" });
  return { start, end, label };
}

function currentYm() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function fmtDate(d: Date) {
  return d.toLocaleDateString("es-UY", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default async function ImprimirPage({
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

  const [tenant, entries] = await Promise.all([
    prisma.tenant.findUnique({ where: { id: tenantId }, select: { name: true } }),
    prisma.financeEntry.findMany({
      where: { tenantId, date: { gte: start, lt: end } },
      orderBy: [{ date: "asc" }, { createdAt: "asc" }],
    }),
  ]);

  const totalIngresos = entries
    .filter((e) => e.kind === "INGRESO")
    .reduce((s, e) => s + e.amount.toNumber(), 0);
  const totalEgresos = entries
    .filter((e) => e.kind === "EGRESO")
    .reduce((s, e) => s + e.amount.toNumber(), 0);
  const saldo = totalIngresos - totalEgresos;

  return (
    <div className="print-page">
      <style>{printCss}</style>

      <div className="print-toolbar">
        <PrintTrigger />
      </div>

      <header className="print-header">
        <h1>{tenant?.name ?? "Club"}</h1>
        <p>
          Libro de finanzas — Ejercicio <strong className="capitalize">{label}</strong>
        </p>
      </header>

      <table className="print-table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Rubro</th>
            <th>Descripción</th>
            <th className="num">Debe</th>
            <th className="num">Haber</th>
          </tr>
        </thead>
        <tbody>
          {entries.length === 0 ? (
            <tr>
              <td colSpan={5} className="empty">Sin movimientos en este ejercicio.</td>
            </tr>
          ) : (
            entries.map((e) => (
              <tr key={e.id}>
                <td>{fmtDate(e.date)}</td>
                <td>{e.category}</td>
                <td>{e.description}</td>
                <td className="num">{e.kind === "EGRESO" ? formatMoney(e.amount.toNumber()) : ""}</td>
                <td className="num">{e.kind === "INGRESO" ? formatMoney(e.amount.toNumber()) : ""}</td>
              </tr>
            ))
          )}
        </tbody>
        <tfoot>
          <tr className="totals">
            <td colSpan={3}>Totales</td>
            <td className="num">{formatMoney(totalEgresos)}</td>
            <td className="num">{formatMoney(totalIngresos)}</td>
          </tr>
          <tr className="balance">
            <td colSpan={4}>Saldo del ejercicio</td>
            <td className="num">{formatMoney(saldo)}</td>
          </tr>
        </tfoot>
      </table>

      <footer className="print-footer">
        <div className="sign">
          <span className="line" />
          Presidente
        </div>
        <div className="sign">
          <span className="line" />
          Tesorero
        </div>
      </footer>
    </div>
  );
}

const printCss = `
  .print-page {
    max-width: 800px;
    margin: 0 auto;
    padding: 24px;
    color: #111;
    background: #fff;
    font-family: ui-sans-serif, system-ui, sans-serif;
  }
  .print-toolbar { margin-bottom: 16px; }
  .print-header { text-align: center; margin-bottom: 24px; }
  .print-header h1 { font-size: 20px; font-weight: 700; margin: 0 0 4px; }
  .print-header p { font-size: 13px; margin: 0; }
  .print-table { width: 100%; border-collapse: collapse; font-size: 12px; }
  .print-table th, .print-table td {
    border: 1px solid #999;
    padding: 6px 8px;
    text-align: left;
    vertical-align: top;
  }
  .print-table th { background: #f0f0f0; font-weight: 600; }
  .print-table .num { text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
  .print-table .empty { text-align: center; color: #666; padding: 24px; }
  .print-table tfoot .totals td { font-weight: 600; background: #f7f7f7; }
  .print-table tfoot .balance td { font-weight: 700; }
  .print-footer {
    display: flex;
    justify-content: space-around;
    margin-top: 64px;
    font-size: 12px;
  }
  .print-footer .sign { text-align: center; }
  .print-footer .line {
    display: block;
    width: 160px;
    border-top: 1px solid #333;
    margin: 0 auto 6px;
    height: 32px;
  }
  @media print {
    .print-toolbar { display: none; }
    .print-page { padding: 0; max-width: none; }
  }
`;
