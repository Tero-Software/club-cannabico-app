import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { GeneticasList } from "./geneticas-list";
import { GeneticasHeader } from "./nueva-toggle";

export const metadata = { title: "Genéticas (administrador)" };

export default async function AdminGeneticasPage() {
  const session = await auth();
  if (!can(session, "geneticas:manage")) notFound();

  const geneticas = await prisma.strain.findMany({
    where: { tenantId: session!.user.tenantId },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <GeneticasHeader />

      {geneticas.length === 0 ? (
        <div className="card text-center text-[var(--muted-foreground)] py-12">
          No hay genéticas cargadas.
        </div>
      ) : (
        <GeneticasList geneticas={geneticas} />
      )}
    </div>
  );
}
