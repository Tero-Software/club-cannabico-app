-- CreateTable
CREATE TABLE "ClubConfig" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "workingDays" INTEGER[] DEFAULT ARRAY[1, 2, 3, 4, 5]::INTEGER[],
    "timeSlots" TEXT[] DEFAULT ARRAY['18:00-19:00', '19:00-20:00']::TEXT[],
    "maxGramsPerMonth" INTEGER NOT NULL DEFAULT 40,
    "minGramsPerWithdrawal" INTEGER NOT NULL DEFAULT 20,
    "minGramsPerStrain" INTEGER NOT NULL DEFAULT 10,
    "gramsStep" INTEGER NOT NULL DEFAULT 10,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClubConfig_pkey" PRIMARY KEY ("id")
);

-- Seed singleton row
INSERT INTO "ClubConfig" ("id", "updatedAt") VALUES ('singleton', NOW())
ON CONFLICT ("id") DO NOTHING;
