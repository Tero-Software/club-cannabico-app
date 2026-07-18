-- Trazabilidad: marca de planta que no prosperó (murió antes de completar el ciclo).
-- AlterTable
ALTER TABLE "Planta" ADD COLUMN "noProspero" BOOLEAN NOT NULL DEFAULT false;

-- Membresías: la cuota mensual pasa a tener default 0.
-- AlterTable
ALTER TABLE "PlanMembresia" ALTER COLUMN "cuotaMensual" SET DEFAULT 0;
