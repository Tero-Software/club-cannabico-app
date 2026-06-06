import { unstable_cache, revalidateTag } from "next/cache";
import { prisma } from "@/lib/db";

export type ClubConfig = {
  diasHabiles: number[];
  horarios: string[];
  maxGramosMes: number;
  minGramosRetiro: number;
  minGramosPorVariedad: number;
  multiploGramos: number;
};

const TAG = "club-config";

export const getClubConfig = unstable_cache(
  async (): Promise<ClubConfig> => {
    const row = await prisma.clubConfig.upsert({
      where: { id: "singleton" },
      update: {},
      create: { id: "singleton" },
    });
    return {
      diasHabiles: row.workingDays,
      horarios: row.timeSlots,
      maxGramosMes: row.maxGramsPerMonth,
      minGramosRetiro: row.minGramsPerWithdrawal,
      minGramosPorVariedad: row.minGramsPerStrain,
      multiploGramos: row.gramsStep,
    };
  },
  ["club-config"],
  { tags: [TAG] },
);

export function invalidateClubConfig() {
  revalidateTag(TAG, "default");
}
