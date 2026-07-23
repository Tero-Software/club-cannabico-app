-- Plan de cultivo: las siembras que el club presenta al IRCCA, numeradas y con
-- los hitos aproximados del ciclo tal como figuran en el documento (sin año).
-- Cada hito es mes + semanas del mes; la ventana de cosecha se guarda como
-- RRULE anual por meses para derivar el aviso de "se viene la cosecha". La
-- cosecha real (Cosecha) se engancha a su siembra vía planId y toma su número;
-- el año sale de la fecha real.

-- CreateTable
CREATE TABLE "PlanCosecha" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "germinacionMes" INTEGER,
    "germinacionSemanas" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "macetaMes" INTEGER,
    "macetaSemanas" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "bancalMes" INTEGER,
    "bancalSemanas" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "cosechaRegla" TEXT NOT NULL,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanCosecha_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlanCosecha_tenantId_numero_key" ON "PlanCosecha"("tenantId", "numero");
CREATE INDEX "PlanCosecha_tenantId_idx" ON "PlanCosecha"("tenantId");

-- AddForeignKey
ALTER TABLE "PlanCosecha" ADD CONSTRAINT "PlanCosecha_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "Cosecha" ADD COLUMN "planId" TEXT;

-- CreateIndex
CREATE INDEX "Cosecha_planId_idx" ON "Cosecha"("planId");

-- AddForeignKey
ALTER TABLE "Cosecha" ADD CONSTRAINT "Cosecha_planId_fkey" FOREIGN KEY ("planId") REFERENCES "PlanCosecha"("id") ON DELETE SET NULL ON UPDATE CASCADE;
