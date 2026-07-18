import { unstable_cache, revalidateTag } from "next/cache";
import { prisma } from "@/lib/db";

export type ClubConfig = {
  diasHabiles: number[];
  horarios: string[];
  maxGramosMes: number;
  minGramosRetiro: number;
  minGramosPorVariedad: number;
  multiploGramos: number;
  cobroExcedente: "PROPORCIONAL" | "FRANJA_MAS_EXCEDENTE";
  maxSocios: number;
};

function tagFor(tenantId: string) {
  return `club-config:${tenantId}`;
}

/**
 * Config operativa de un tenant, cacheada por tenantId. La config vive en
 * el propio Tenant (antes era el singleton ClubConfig).
 */
export function getClubConfig(tenantId: string): Promise<ClubConfig> {
  const cached = unstable_cache(
    async (): Promise<ClubConfig> => {
      const t = await prisma.tenant.findUniqueOrThrow({
        where: { id: tenantId },
      });
      return {
        diasHabiles: t.workingDays,
        horarios: t.timeSlots,
        maxGramosMes: t.maxGramsPerMonth,
        minGramosRetiro: t.minGramsPerWithdrawal,
        minGramosPorVariedad: t.minGramsPerStrain,
        multiploGramos: t.gramsStep,
        cobroExcedente: t.cobroExcedente,
        maxSocios: t.maxActiveMembers,
      };
    },
    ["club-config", tenantId],
    { tags: [tagFor(tenantId)] },
  );
  return cached();
}

export function invalidateClubConfig(tenantId: string) {
  revalidateTag(tagFor(tenantId), "default");
}
