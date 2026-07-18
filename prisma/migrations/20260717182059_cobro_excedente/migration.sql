-- CreateEnum
CREATE TYPE "CobroExcedente" AS ENUM ('PROPORCIONAL', 'FRANJA_MAS_EXCEDENTE');

-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "cobroExcedente" "CobroExcedente" NOT NULL DEFAULT 'PROPORCIONAL';
