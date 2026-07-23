-- Avisos de directiva: plazos configurables por club (todos opcionales; sin
-- configurar no hay aviso). Los avisos se derivan de estos campos y se apagan
-- al hacer la acción correspondiente; no se persiste nada más.

-- AlterTable
-- La cadencia de juntas pasa de "cada N días" (meetingIntervalDays, sin
-- consumidores) a una recurrencia RRULE opcional.
ALTER TABLE "Tenant" DROP COLUMN "meetingIntervalDays";
ALTER TABLE "Tenant" ADD COLUMN "meetingRule" TEXT;
ALTER TABLE "Tenant" ADD COLUMN "fiscalYearEndRule" TEXT;
ALTER TABLE "Tenant" ADD COLUMN "nextAsambleaDate" TIMESTAMP(3);
ALTER TABLE "Tenant" ADD COLUMN "mandateStart" TIMESTAMP(3);
ALTER TABLE "Tenant" ADD COLUMN "mandateYears" INTEGER;
