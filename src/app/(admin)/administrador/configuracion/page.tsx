import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ConfigForm } from "./config-form";
import { MembresiasManager } from "./membresias-manager";

export const metadata = { title: "Configuración (administrador)" };

export default async function ConfiguracionPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/socio");

  const tenantId = session.user.tenantId;

  const [row, plans] = await Promise.all([
    prisma.tenant.findUniqueOrThrow({ where: { id: tenantId } }),
    prisma.membershipPlan.findMany({
      where: { tenantId },
      include: {
        tiers: { orderBy: { fromGrams: "asc" } },
        _count: { select: { members: true } },
      },
      orderBy: [{ isDefault: "desc" }, { active: "desc" }, { name: "asc" }],
    }),
  ]);

  // El manager edita todas las membresías (incluidas inactivas, para reactivarlas).
  const allPlans = plans.map((p) => ({
    id: p.id,
    name: p.name,
    isDefault: p.isDefault,
    active: p.active,
    membersCount: p._count.members,
    tiers: p.tiers.map((t) => ({ fromGrams: t.fromGrams, price: t.price.toNumber() })),
  }));
  const defaultPlanId = plans.find((p) => p.isDefault)?.id ?? null;

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
          meetingRule: row.meetingRule,
          fiscalYearEndRule: row.fiscalYearEndRule,
          nextAsambleaDate: row.nextAsambleaDate?.toISOString().slice(0, 10) ?? null,
          mandateStart: row.mandateStart?.toISOString().slice(0, 10) ?? null,
          mandateYears: row.mandateYears,
        }}
      />

      <section className="mt-10">
        <h2 className="text-xl font-semibold mb-1">Membresías</h2>
        <p className="text-sm text-[var(--muted-foreground)] mb-4">
          Tipos de cobro del club: cuota mensual y franjas por gramos. Guardá las que uses
          y elegí cuál se aplica por defecto.
        </p>
        <MembresiasManager
          plans={allPlans}
          defaultPlanId={defaultPlanId}
          cobroExcedente={row.cobroExcedente}
        />
      </section>
    </div>
  );
}
