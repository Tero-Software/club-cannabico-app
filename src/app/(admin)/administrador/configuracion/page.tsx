import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ConfigForm } from "./config-form";

export const metadata = { title: "Configuración (administrador)" };

export default async function ConfiguracionPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/socio");

  const row = await prisma.tenant.findUniqueOrThrow({
    where: { id: session.user.tenantId },
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-1">Configuración</h1>
        <p className="text-[var(--muted-foreground)]">
          Parámetros del club. Los cambios aplican inmediatamente.
        </p>
      </div>

      <ConfigForm
        initial={{
          city: row.city,
          tagline: row.tagline,
          description: row.description,
          workingDays: row.workingDays,
          timeSlots: row.timeSlots,
          maxGramsPerMonth: row.maxGramsPerMonth,
          minGramsPerWithdrawal: row.minGramsPerWithdrawal,
          minGramsPerStrain: row.minGramsPerStrain,
          gramsStep: row.gramsStep,
        }}
      />

    </div>
  );
}
