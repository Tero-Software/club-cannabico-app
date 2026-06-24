import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { NuevoSocioHeader } from "./nuevo-socio-toggle";
import { SociosTable } from "./socios-table";

export const metadata = { title: "Socios (administrador)" };

type SortKey = "ultimo" | "historico" | "login";

const SORTS: { label: string; value: SortKey }[] = [
  { label: "Último retiro", value: "ultimo" },
  { label: "Último login", value: "login" },
  { label: "Mejor histórico", value: "historico" },
];

export default async function AdminSociosPage({
  searchParams,
}: {
  searchParams: Promise<{ orden?: string }>;
}) {
  const session = await auth();
  if (!can(session, "socios:manage")) notFound();

  const { orden } = await searchParams;
  const sort: SortKey =
    SORTS.find((s) => s.value === orden)?.value ?? "ultimo";

  const tenantId = session!.user.tenantId;
  const pendingPostulaciones = can(session, "postulaciones:manage")
    ? await prisma.application.count({ where: { tenantId, status: "PENDING" } })
    : 0;

  const socios = await prisma.user.findMany({
    where: { tenantId, role: "MEMBER" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      active: true,
      createdAt: true,
      lastLoginAt: true,
      _count: { select: { withdrawals: true } },
      withdrawals: {
        where: { status: "COMPLETED" },
        orderBy: { date: "desc" },
        take: 1,
        select: { date: true },
      },
    },
  });

  const enriched = socios.map((s) => ({
    ...s,
    ultimoRetiro: s.withdrawals[0]?.date ?? null,
  }));

  enriched.sort((a, b) => {
    if (a.active !== b.active) return a.active ? -1 : 1;
    if (sort === "historico") return b._count.withdrawals - a._count.withdrawals;
    if (sort === "login") {
      const al = a.lastLoginAt?.getTime() ?? 0;
      const bl = b.lastLoginAt?.getTime() ?? 0;
      return bl - al;
    }
    const at = a.ultimoRetiro?.getTime() ?? 0;
    const bt = b.ultimoRetiro?.getTime() ?? 0;
    return bt - at;
  });

  const activosCount = enriched.filter(
    (s) => s.role === "MEMBER" && s.active,
  ).length;

  const serializable = enriched.map((s) => ({
    id: s.id,
    name: s.name,
    email: s.email,
    phone: s.phone,
    role: s.role,
    active: s.active,
    retiros: s._count.withdrawals,
    ultimoRetiro: s.ultimoRetiro ? s.ultimoRetiro.toISOString() : null,
  }));

  return (
    <div>
      <NuevoSocioHeader
        title="Socios"
        subtitle={`${activosCount} de 45 socios activos.`}
        pendingPostulaciones={pendingPostulaciones}
      />

      <div className="flex flex-wrap gap-2 mb-6">
        {SORTS.map((s) => (
          <Link
            key={s.value}
            href={
              s.value === "ultimo"
                ? "/administrador/socios"
                : `/administrador/socios?orden=${s.value}`
            }
            className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
              sort === s.value
                ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                : "border-[var(--border)] hover:bg-[var(--muted)]"
            }`}
          >
            {s.label}
          </Link>
        ))}
      </div>

      <SociosTable socios={serializable} />
    </div>
  );
}
