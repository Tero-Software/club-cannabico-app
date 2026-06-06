-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'SOCIO');

-- CreateEnum
CREATE TYPE "EstadoRetiro" AS ENUM ('PENDIENTE', 'APROBADO', 'RECHAZADO', 'COMPLETADO', 'CANCELADO');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "role" "Role" NOT NULL DEFAULT 'SOCIO',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Producto" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "stock" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Producto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Retiro" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "horario" TEXT NOT NULL,
    "cantidad" DOUBLE PRECISION NOT NULL,
    "estado" "EstadoRetiro" NOT NULL DEFAULT 'PENDIENTE',
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Retiro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClubConfig" (
    "id" TEXT NOT NULL,
    "clubName" TEXT NOT NULL DEFAULT 'El Gordito Club',
    "clubDescription" TEXT,
    "clubAddress" TEXT,
    "clubPhone" TEXT,
    "horariosRetiro" JSONB NOT NULL,
    "maxRetirosDia" INTEGER NOT NULL DEFAULT 10,
    "maxGramosRetiro" DOUBLE PRECISION NOT NULL DEFAULT 5,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClubConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "Retiro_userId_idx" ON "Retiro"("userId");

-- CreateIndex
CREATE INDEX "Retiro_fecha_idx" ON "Retiro"("fecha");

-- CreateIndex
CREATE INDEX "Retiro_estado_idx" ON "Retiro"("estado");

-- AddForeignKey
ALTER TABLE "Retiro" ADD CONSTRAINT "Retiro_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Retiro" ADD CONSTRAINT "Retiro_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
