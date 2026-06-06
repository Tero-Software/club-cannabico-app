-- CreateEnum
CREATE TYPE "EstadoPostulacion" AS ENUM ('PENDIENTE', 'APROBADA', 'RECHAZADA');

-- CreateTable
CREATE TABLE "Postulacion" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefono" TEXT,
    "mensaje" TEXT,
    "estado" "EstadoPostulacion" NOT NULL DEFAULT 'PENDIENTE',
    "notasAdmin" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Postulacion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Postulacion_email_idx" ON "Postulacion"("email");

-- CreateIndex
CREATE INDEX "Postulacion_estado_idx" ON "Postulacion"("estado");

-- CreateIndex
CREATE INDEX "Postulacion_createdAt_idx" ON "Postulacion"("createdAt");
