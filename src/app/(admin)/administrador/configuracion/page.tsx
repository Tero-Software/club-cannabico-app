import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ConfigForm } from "./config-form";

export const metadata = { title: "Configuración (administrador)" };

export default async function ConfiguracionPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/socio");

  const row = await prisma.clubConfig.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" },
  });

  const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "Club Cannábico App";

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
          workingDays: row.workingDays,
          timeSlots: row.timeSlots,
          maxGramsPerMonth: row.maxGramsPerMonth,
          minGramsPerWithdrawal: row.minGramsPerWithdrawal,
          minGramsPerStrain: row.minGramsPerStrain,
          gramsStep: row.gramsStep,
        }}
      />

      <section className="card mt-8">
        <h2 className="text-xl font-semibold mb-3">Branding</h2>
        <dl className="grid sm:grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-xs uppercase tracking-wide text-[var(--muted-foreground)] mb-1">
              Nombre de la app
            </dt>
            <dd className="font-medium">{appName}</dd>
            <dd className="text-xs text-[var(--muted-foreground)] mt-0.5">
              Variable <code>NEXT_PUBLIC_APP_NAME</code> en <code>.env</code>
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-[var(--muted-foreground)] mb-1">
              Logo y colores
            </dt>
            <dd className="text-[var(--muted-foreground)]">
              Se editan en <code>src/components/logo.tsx</code> y{" "}
              <code>src/app/globals.css</code>. Requiere redeploy.
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
