import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getAvisosClub, avisosFor } from "@/lib/avisos";
import { AvisoBanner } from "@/components/aviso-banner";
import { PageHeader } from "@/components/ui/page-scaffold";
import { CARGOS } from "./cargos";
import { ComisionMap } from "./comision-map";

export const metadata = { title: "Comisión (directiva)" };

export default async function ComisionPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/socio");

  const tenantId = session.user.tenantId;

  const socios = await prisma.user.findMany({
    where: { tenantId, role: "MEMBER", active: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, cargo: true },
  });

  // Mapa cargo -> socio asignado (o null si vacante).
  const asignados = new Map<string, { id: string; name: string }>();
  for (const s of socios) {
    if (s.cargo) asignados.set(s.cargo, { id: s.id, name: s.name });
  }

  const rows = CARGOS.map((c) => ({
    cargo: c.value,
    label: c.label,
    socio: asignados.get(c.value) ?? null,
  }));

  const avisos = avisosFor(
    await getAvisosClub(tenantId),
    "/administrador/directiva/comision",
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title="Comisión"
        description="Integrantes de la comisión directiva y la sindicatura."
      />
      <AvisoBanner messages={avisos} />

      <ComisionMap
        rows={rows}
        socios={socios.map((s) => ({ id: s.id, name: s.name }))}
      />
    </div>
  );
}
