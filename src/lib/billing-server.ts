import { prisma } from "@/lib/db";
import type { ResolvedPlan } from "@/lib/billing";

/**
 * Resuelve qué plan se le aplica a un socio: su plan propio si lo tiene
 * (override), o el plan por defecto del club. Devuelve null si el socio no
 * tiene plan propio y el club no definió uno por defecto.
 */
export async function resolvePlanForMember(
  tenantId: string,
  memberPlanId: string | null,
): Promise<ResolvedPlan | null> {
  const plan = memberPlanId
    ? await prisma.membershipPlan.findFirst({
        where: { id: memberPlanId, tenantId, active: true },
        include: { tiers: true },
      })
    : await prisma.membershipPlan.findFirst({
        where: { tenantId, isDefault: true, active: true },
        include: { tiers: true },
      });

  if (!plan) return null;

  // Los montos son Decimal en la base; la capa de cálculo y las vistas trabajan
  // con number. Se convierte acá, en la frontera de datos.
  return {
    id: plan.id,
    name: plan.name,
    monthlyPrice: plan.monthlyPrice.toNumber(),
    tiers: plan.tiers.map((t) => ({ fromGrams: t.fromGrams, price: t.price.toNumber() })),
  };
}
