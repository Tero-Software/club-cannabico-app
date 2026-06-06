-- Step 1: Add new enum values alongside old ones

ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'MEMBER';

ALTER TYPE "EstadoRetiro" ADD VALUE IF NOT EXISTS 'PENDING';
ALTER TYPE "EstadoRetiro" ADD VALUE IF NOT EXISTS 'APPROVED';
ALTER TYPE "EstadoRetiro" ADD VALUE IF NOT EXISTS 'REJECTED';
ALTER TYPE "EstadoRetiro" ADD VALUE IF NOT EXISTS 'COMPLETED';
ALTER TYPE "EstadoRetiro" ADD VALUE IF NOT EXISTS 'CANCELLED';

ALTER TYPE "EstadoPostulacion" ADD VALUE IF NOT EXISTS 'PENDING';
ALTER TYPE "EstadoPostulacion" ADD VALUE IF NOT EXISTS 'APPROVED';
ALTER TYPE "EstadoPostulacion" ADD VALUE IF NOT EXISTS 'REJECTED';

-- Step 2: Migrate data to new values
UPDATE "User" SET "role" = 'MEMBER' WHERE "role" = 'SOCIO';

UPDATE "Retiro" SET "estado" = 'PENDING' WHERE "estado" = 'PENDIENTE';
UPDATE "Retiro" SET "estado" = 'APPROVED' WHERE "estado" = 'APROBADO';
UPDATE "Retiro" SET "estado" = 'REJECTED' WHERE "estado" = 'RECHAZADO';
UPDATE "Retiro" SET "estado" = 'COMPLETED' WHERE "estado" = 'COMPLETADO';
UPDATE "Retiro" SET "estado" = 'CANCELLED' WHERE "estado" = 'CANCELADO';

UPDATE "Postulacion" SET "estado" = 'PENDING' WHERE "estado" = 'PENDIENTE';
UPDATE "Postulacion" SET "estado" = 'APPROVED' WHERE "estado" = 'APROBADA';
UPDATE "Postulacion" SET "estado" = 'REJECTED' WHERE "estado" = 'RECHAZADA';

-- Step 3: Recreate enums with only new values

-- Role
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
CREATE TYPE "Role_new" AS ENUM ('ADMIN', 'MEMBER');
ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "Role_old";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'MEMBER';

-- EstadoRetiro
ALTER TABLE "Retiro" ALTER COLUMN "estado" DROP DEFAULT;
CREATE TYPE "EstadoRetiro_new" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED', 'CANCELLED');
ALTER TABLE "Retiro" ALTER COLUMN "estado" TYPE "EstadoRetiro_new" USING ("estado"::text::"EstadoRetiro_new");
ALTER TYPE "EstadoRetiro" RENAME TO "EstadoRetiro_old";
ALTER TYPE "EstadoRetiro_new" RENAME TO "EstadoRetiro";
DROP TYPE "EstadoRetiro_old";
ALTER TABLE "Retiro" ALTER COLUMN "estado" SET DEFAULT 'PENDING';

-- EstadoPostulacion
ALTER TABLE "Postulacion" ALTER COLUMN "estado" DROP DEFAULT;
CREATE TYPE "EstadoPostulacion_new" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
ALTER TABLE "Postulacion" ALTER COLUMN "estado" TYPE "EstadoPostulacion_new" USING ("estado"::text::"EstadoPostulacion_new");
ALTER TYPE "EstadoPostulacion" RENAME TO "EstadoPostulacion_old";
ALTER TYPE "EstadoPostulacion_new" RENAME TO "EstadoPostulacion";
DROP TYPE "EstadoPostulacion_old";
ALTER TABLE "Postulacion" ALTER COLUMN "estado" SET DEFAULT 'PENDING';

-- Step 4: Drop stock from Genetica
ALTER TABLE "Genetica" DROP COLUMN IF EXISTS "stock";

-- Step 5: New enum
CREATE TYPE "MovementType" AS ENUM ('IN', 'OUT');

-- Step 6: New tables
CREATE TABLE "Container" (
    "id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "harvest" TEXT,
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Container_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ContainerItem" (
    "id" TEXT NOT NULL,
    "containerId" TEXT NOT NULL,
    "strainId" TEXT,
    "plantNumber" TEXT,
    "initialWeight" DOUBLE PRECISION NOT NULL,
    "currentWeight" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ContainerItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Movement" (
    "id" TEXT NOT NULL,
    "containerItemId" TEXT NOT NULL,
    "type" "MovementType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "withdrawalItemId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Movement_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Container_number_key" ON "Container"("number");
CREATE INDEX "ContainerItem_containerId_idx" ON "ContainerItem"("containerId");
CREATE INDEX "ContainerItem_strainId_idx" ON "ContainerItem"("strainId");
CREATE INDEX "Movement_containerItemId_createdAt_idx" ON "Movement"("containerItemId", "createdAt");
CREATE INDEX "Movement_withdrawalItemId_idx" ON "Movement"("withdrawalItemId");

ALTER TABLE "ContainerItem" ADD CONSTRAINT "ContainerItem_containerId_fkey" FOREIGN KEY ("containerId") REFERENCES "Container"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ContainerItem" ADD CONSTRAINT "ContainerItem_strainId_fkey" FOREIGN KEY ("strainId") REFERENCES "Genetica"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Movement" ADD CONSTRAINT "Movement_containerItemId_fkey" FOREIGN KEY ("containerItemId") REFERENCES "ContainerItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Movement" ADD CONSTRAINT "Movement_withdrawalItemId_fkey" FOREIGN KEY ("withdrawalItemId") REFERENCES "RetiroItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
