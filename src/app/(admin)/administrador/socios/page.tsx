import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { NuevoSocioHeader } from "./nuevo-socio-toggle";
import { SociosTable } from "./socios-table";

export const metadata = { title: "Socios (administrador)" };

type SortKey = "default" | "login";

const SORTS: { label: string; value: SortKey }[] = [
  { label: "Por defecto", value: "default" },
  { label: "Último login", value: "login" },
];

// Orden jerárquico de la directiva (mismo que CARGOS). Índice = prioridad; los
// que no tienen cargo van después.
const CARGO_ORDER: Record<string, number> = {
  PRESIDENTE: 0,
  SECRETARIO: 1,
  TESORERO: 2,
  SUPLENTE_1: 3,
  SUPLENTE_2: 4,
  SUPLENTE_3: 5,
  SINDICO: 6,
  SINDICO_SUPLENTE: 7,
};
const cargoRank = (cargo: string | null) =>
  cargo && cargo in CARGO_ORDER ? CARGO_ORDER[cargo] : Number.MAX_SAFE_INTEGER;

export default async function AdminSociosPage({
  searchParams,
}: {
  searchParams: Promise<{ orden?: string }>;
}) {
  const session = await auth();
  if (!can(session, "socios:manage")) notFound();

  const { orden } = await searchParams;
  const sort: SortKey =
    SORTS.find((s) => s.value === orden)?.value ?? "default";

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
      cargo: true,
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
    // Activos arriba, inactivos abajo. Dentro de cada grupo, el mismo criterio.
    if (a.active !== b.active) return a.active ? -1 : 1;
    if (sort === "login") {
      const al = a.lastLoginAt?.getTime() ?? 0;
      const bl = b.lastLoginAt?.getTime() ?? 0;
      return bl - al;
    }
    // Por defecto: la directiva arriba (por jerarquía de cargo); el resto por
    // fecha de inscripción y, dentro de la misma fecha, alfabético.
    const ra = cargoRank(a.cargo);
    const rb = cargoRank(b.cargo);
    if (ra !== rb) return ra - rb;
    const ca = a.createdAt.getTime();
    const cb = b.createdAt.getTime();
    if (ca !== cb) return ca - cb;
    return a.name.localeCompare(b.name);
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
    cargo: s.cargo,
    active: s.active,
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
              s.value === "default"
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
