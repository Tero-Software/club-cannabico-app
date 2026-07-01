-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'MEMBER', 'VISITANTE');

-- CreateEnum
CREATE TYPE "EstadoRetiro" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "EstadoPostulacion" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "MovementType" AS ENUM ('IN', 'OUT');

-- CreateEnum
CREATE TYPE "EstadoJunta" AS ENUM ('DRAFT', 'CLOSED');

-- CreateEnum
CREATE TYPE "TipoJunta" AS ENUM ('DIRECTIVA', 'ASAMBLEA');

-- CreateEnum
CREATE TYPE "CargoDirectiva" AS ENUM ('PRESIDENTE', 'SECRETARIO', 'TESORERO', 'SUPLENTE_1', 'SUPLENTE_2', 'SUPLENTE_3', 'SINDICO', 'SINDICO_SUPLENTE');

-- CreateEnum
CREATE TYPE "TipoMovimiento" AS ENUM ('INGRESO', 'EGRESO');

-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "city" TEXT,
    "tagline" TEXT,
    "description" TEXT,
    "workingDays" INTEGER[] DEFAULT ARRAY[1, 2, 3, 4, 5]::INTEGER[],
    "timeSlots" TEXT[] DEFAULT ARRAY['18:00-19:00', '19:00-20:00']::TEXT[],
    "maxGramsPerMonth" INTEGER NOT NULL DEFAULT 40,
    "minGramsPerWithdrawal" INTEGER NOT NULL DEFAULT 20,
    "minGramsPerStrain" INTEGER NOT NULL DEFAULT 10,
    "gramsStep" INTEGER NOT NULL DEFAULT 10,
    "maxActiveMembers" INTEGER NOT NULL DEFAULT 45,
    "meetingIntervalDays" INTEGER NOT NULL DEFAULT 30,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "role" "Role" NOT NULL DEFAULT 'MEMBER',
    "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "active" BOOLEAN NOT NULL DEFAULT true,
    "deactivatedAt" TIMESTAMP(3)[] DEFAULT ARRAY[]::TIMESTAMP(3)[],
    "reactivatedAt" TIMESTAMP(3)[] DEFAULT ARRAY[]::TIMESTAMP(3)[],
    "cargo" "CargoDirectiva",
    "membershipPlanId" TEXT,
    "isOwner" BOOLEAN NOT NULL DEFAULT false,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
    "totpSecret" TEXT,
    "totpEnabled" BOOLEAN NOT NULL DEFAULT false,
    "failedLoginCount" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvitacionVisitante" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "userId" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvitacionVisitante_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoginAttempt" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "ip" TEXT,
    "success" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoginAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT,
    "actorEmail" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT,
    "entityId" TEXT,
    "metadata" JSONB,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Genetica" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "bank" TEXT,
    "description" TEXT,
    "photos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sourceUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Genetica_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Retiro" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "horario" TEXT NOT NULL,
    "estado" "EstadoRetiro" NOT NULL DEFAULT 'PENDING',
    "notas" TEXT,
    "pagado" BOOLEAN NOT NULL DEFAULT false,
    "montoCobrado" DECIMAL(12,2),
    "planAplicadoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Retiro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RetiroItem" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "retiroId" TEXT NOT NULL,
    "geneticaId" TEXT NOT NULL,
    "cantidad" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "RetiroItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reservation" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "containerItemId" TEXT NOT NULL,
    "withdrawalItemId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cosecha" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "declarada" BOOLEAN NOT NULL DEFAULT false,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cosecha_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Container" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "cosechaId" TEXT,
    "number" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Container_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContainerItem" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "containerId" TEXT NOT NULL,
    "strainId" TEXT,
    "plantNumber" TEXT,
    "initialWeight" DOUBLE PRECISION NOT NULL,
    "currentWeight" DOUBLE PRECISION NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContainerItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Movement" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "containerItemId" TEXT NOT NULL,
    "type" "MovementType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "withdrawalItemId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Movement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Postulacion" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefono" TEXT,
    "mensaje" TEXT,
    "estado" "EstadoPostulacion" NOT NULL DEFAULT 'PENDING',
    "notasAdmin" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Postulacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Junta" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "tipo" "TipoJunta" NOT NULL DEFAULT 'DIRECTIVA',
    "numero" INTEGER NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "presentes" TEXT[],
    "estado" "EstadoJunta" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Junta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JuntaItem" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "juntaId" TEXT NOT NULL,
    "tema" TEXT NOT NULL,
    "contenido" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JuntaItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanMembresia" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "cuotaMensual" DECIMAL(12,2) NOT NULL,
    "porDefecto" BOOLEAN NOT NULL DEFAULT false,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanMembresia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TramoMembresia" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "desdeGramos" DOUBLE PRECISION NOT NULL,
    "precio" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "TramoMembresia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MovimientoFinanciero" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "tipo" "TipoMovimiento" NOT NULL,
    "rubro" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "retiroId" TEXT,
    "creadoPorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MovimientoFinanciero_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Planta" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "cosechaId" TEXT,
    "geneticaId" TEXT,
    "numero" INTEGER NOT NULL,
    "germinacion" TIMESTAMP(3),
    "maceta" TIMESTAMP(3),
    "bancal" TIMESTAMP(3),
    "flora" TIMESTAMP(3),
    "cosecha" TIMESTAMP(3),
    "rendimiento" DOUBLE PRECISION,
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Planta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sanitaria" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "tratamiento" TEXT NOT NULL,
    "todas" BOOLEAN NOT NULL DEFAULT true,
    "plantaId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sanitaria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Memoria" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "ejercicio" INTEGER NOT NULL,
    "periodoInicio" TIMESTAMP(3) NOT NULL,
    "periodoFin" TIMESTAMP(3) NOT NULL,
    "resumen" TEXT NOT NULL DEFAULT '',
    "estado" "EstadoJunta" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Memoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemoriaEntrada" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "memoriaId" TEXT NOT NULL,
    "mes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MemoriaEntrada_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemoriaHito" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "entradaId" TEXT NOT NULL,
    "tema" TEXT NOT NULL DEFAULT '',
    "desarrollo" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MemoriaHito_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_slug_key" ON "Tenant"("slug");

-- CreateIndex
CREATE INDEX "Tenant_slug_idx" ON "Tenant"("slug");

-- CreateIndex
CREATE INDEX "User_tenantId_idx" ON "User"("tenantId");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_tenantId_email_key" ON "User"("tenantId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "InvitacionVisitante_token_key" ON "InvitacionVisitante"("token");

-- CreateIndex
CREATE INDEX "InvitacionVisitante_tenantId_idx" ON "InvitacionVisitante"("tenantId");

-- CreateIndex
CREATE INDEX "InvitacionVisitante_expiresAt_idx" ON "InvitacionVisitante"("expiresAt");

-- CreateIndex
CREATE INDEX "LoginAttempt_tenantId_idx" ON "LoginAttempt"("tenantId");

-- CreateIndex
CREATE INDEX "LoginAttempt_email_createdAt_idx" ON "LoginAttempt"("email", "createdAt");

-- CreateIndex
CREATE INDEX "LoginAttempt_ip_createdAt_idx" ON "LoginAttempt"("ip", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_tenantId_createdAt_idx" ON "AuditLog"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_userId_createdAt_idx" ON "AuditLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_action_createdAt_idx" ON "AuditLog"("action", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "Genetica_tenantId_idx" ON "Genetica"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Genetica_tenantId_code_key" ON "Genetica"("tenantId", "code");

-- CreateIndex
CREATE INDEX "Retiro_tenantId_idx" ON "Retiro"("tenantId");

-- CreateIndex
CREATE INDEX "Retiro_userId_idx" ON "Retiro"("userId");

-- CreateIndex
CREATE INDEX "Retiro_fecha_idx" ON "Retiro"("fecha");

-- CreateIndex
CREATE INDEX "Retiro_estado_idx" ON "Retiro"("estado");

-- CreateIndex
CREATE INDEX "RetiroItem_tenantId_idx" ON "RetiroItem"("tenantId");

-- CreateIndex
CREATE INDEX "RetiroItem_retiroId_idx" ON "RetiroItem"("retiroId");

-- CreateIndex
CREATE INDEX "RetiroItem_geneticaId_idx" ON "RetiroItem"("geneticaId");

-- CreateIndex
CREATE INDEX "Reservation_tenantId_idx" ON "Reservation"("tenantId");

-- CreateIndex
CREATE INDEX "Reservation_containerItemId_idx" ON "Reservation"("containerItemId");

-- CreateIndex
CREATE INDEX "Reservation_withdrawalItemId_idx" ON "Reservation"("withdrawalItemId");

-- CreateIndex
CREATE INDEX "Cosecha_tenantId_idx" ON "Cosecha"("tenantId");

-- CreateIndex
CREATE INDEX "Cosecha_fecha_idx" ON "Cosecha"("fecha");

-- CreateIndex
CREATE INDEX "Container_tenantId_idx" ON "Container"("tenantId");

-- CreateIndex
CREATE INDEX "Container_cosechaId_idx" ON "Container"("cosechaId");

-- CreateIndex
CREATE UNIQUE INDEX "Container_tenantId_cosechaId_number_key" ON "Container"("tenantId", "cosechaId", "number");

-- CreateIndex
CREATE INDEX "ContainerItem_tenantId_idx" ON "ContainerItem"("tenantId");

-- CreateIndex
CREATE INDEX "ContainerItem_containerId_idx" ON "ContainerItem"("containerId");

-- CreateIndex
CREATE INDEX "ContainerItem_strainId_idx" ON "ContainerItem"("strainId");

-- CreateIndex
CREATE INDEX "Movement_tenantId_idx" ON "Movement"("tenantId");

-- CreateIndex
CREATE INDEX "Movement_containerItemId_createdAt_idx" ON "Movement"("containerItemId", "createdAt");

-- CreateIndex
CREATE INDEX "Movement_withdrawalItemId_idx" ON "Movement"("withdrawalItemId");

-- CreateIndex
CREATE INDEX "Postulacion_tenantId_idx" ON "Postulacion"("tenantId");

-- CreateIndex
CREATE INDEX "Postulacion_email_idx" ON "Postulacion"("email");

-- CreateIndex
CREATE INDEX "Postulacion_estado_idx" ON "Postulacion"("estado");

-- CreateIndex
CREATE INDEX "Postulacion_createdAt_idx" ON "Postulacion"("createdAt");

-- CreateIndex
CREATE INDEX "Junta_tenantId_idx" ON "Junta"("tenantId");

-- CreateIndex
CREATE INDEX "Junta_fecha_idx" ON "Junta"("fecha");

-- CreateIndex
CREATE INDEX "Junta_estado_idx" ON "Junta"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "Junta_tenantId_tipo_numero_key" ON "Junta"("tenantId", "tipo", "numero");

-- CreateIndex
CREATE INDEX "JuntaItem_tenantId_idx" ON "JuntaItem"("tenantId");

-- CreateIndex
CREATE INDEX "JuntaItem_juntaId_idx" ON "JuntaItem"("juntaId");

-- CreateIndex
CREATE INDEX "PlanMembresia_tenantId_idx" ON "PlanMembresia"("tenantId");

-- CreateIndex
CREATE INDEX "TramoMembresia_tenantId_idx" ON "TramoMembresia"("tenantId");

-- CreateIndex
CREATE INDEX "TramoMembresia_planId_idx" ON "TramoMembresia"("planId");

-- CreateIndex
CREATE UNIQUE INDEX "MovimientoFinanciero_retiroId_key" ON "MovimientoFinanciero"("retiroId");

-- CreateIndex
CREATE INDEX "MovimientoFinanciero_tenantId_fecha_idx" ON "MovimientoFinanciero"("tenantId", "fecha");

-- CreateIndex
CREATE INDEX "MovimientoFinanciero_tenantId_tipo_idx" ON "MovimientoFinanciero"("tenantId", "tipo");

-- CreateIndex
CREATE INDEX "Planta_tenantId_idx" ON "Planta"("tenantId");

-- CreateIndex
CREATE INDEX "Planta_cosechaId_idx" ON "Planta"("cosechaId");

-- CreateIndex
CREATE INDEX "Planta_geneticaId_idx" ON "Planta"("geneticaId");

-- CreateIndex
CREATE INDEX "Sanitaria_tenantId_fecha_idx" ON "Sanitaria"("tenantId", "fecha");

-- CreateIndex
CREATE INDEX "Memoria_tenantId_idx" ON "Memoria"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Memoria_tenantId_ejercicio_key" ON "Memoria"("tenantId", "ejercicio");

-- CreateIndex
CREATE INDEX "MemoriaEntrada_tenantId_idx" ON "MemoriaEntrada"("tenantId");

-- CreateIndex
CREATE INDEX "MemoriaEntrada_memoriaId_idx" ON "MemoriaEntrada"("memoriaId");

-- CreateIndex
CREATE UNIQUE INDEX "MemoriaEntrada_memoriaId_mes_key" ON "MemoriaEntrada"("memoriaId", "mes");

-- CreateIndex
CREATE INDEX "MemoriaHito_tenantId_idx" ON "MemoriaHito"("tenantId");

-- CreateIndex
CREATE INDEX "MemoriaHito_entradaId_idx" ON "MemoriaHito"("entradaId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_membershipPlanId_fkey" FOREIGN KEY ("membershipPlanId") REFERENCES "PlanMembresia"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvitacionVisitante" ADD CONSTRAINT "InvitacionVisitante_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvitacionVisitante" ADD CONSTRAINT "InvitacionVisitante_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoginAttempt" ADD CONSTRAINT "LoginAttempt_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Genetica" ADD CONSTRAINT "Genetica_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Retiro" ADD CONSTRAINT "Retiro_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Retiro" ADD CONSTRAINT "Retiro_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Retiro" ADD CONSTRAINT "Retiro_planAplicadoId_fkey" FOREIGN KEY ("planAplicadoId") REFERENCES "PlanMembresia"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RetiroItem" ADD CONSTRAINT "RetiroItem_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RetiroItem" ADD CONSTRAINT "RetiroItem_retiroId_fkey" FOREIGN KEY ("retiroId") REFERENCES "Retiro"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RetiroItem" ADD CONSTRAINT "RetiroItem_geneticaId_fkey" FOREIGN KEY ("geneticaId") REFERENCES "Genetica"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_containerItemId_fkey" FOREIGN KEY ("containerItemId") REFERENCES "ContainerItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_withdrawalItemId_fkey" FOREIGN KEY ("withdrawalItemId") REFERENCES "RetiroItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cosecha" ADD CONSTRAINT "Cosecha_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Container" ADD CONSTRAINT "Container_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Container" ADD CONSTRAINT "Container_cosechaId_fkey" FOREIGN KEY ("cosechaId") REFERENCES "Cosecha"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContainerItem" ADD CONSTRAINT "ContainerItem_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContainerItem" ADD CONSTRAINT "ContainerItem_containerId_fkey" FOREIGN KEY ("containerId") REFERENCES "Container"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContainerItem" ADD CONSTRAINT "ContainerItem_strainId_fkey" FOREIGN KEY ("strainId") REFERENCES "Genetica"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Movement" ADD CONSTRAINT "Movement_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Movement" ADD CONSTRAINT "Movement_containerItemId_fkey" FOREIGN KEY ("containerItemId") REFERENCES "ContainerItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Movement" ADD CONSTRAINT "Movement_withdrawalItemId_fkey" FOREIGN KEY ("withdrawalItemId") REFERENCES "RetiroItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Postulacion" ADD CONSTRAINT "Postulacion_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Junta" ADD CONSTRAINT "Junta_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JuntaItem" ADD CONSTRAINT "JuntaItem_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JuntaItem" ADD CONSTRAINT "JuntaItem_juntaId_fkey" FOREIGN KEY ("juntaId") REFERENCES "Junta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanMembresia" ADD CONSTRAINT "PlanMembresia_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TramoMembresia" ADD CONSTRAINT "TramoMembresia_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TramoMembresia" ADD CONSTRAINT "TramoMembresia_planId_fkey" FOREIGN KEY ("planId") REFERENCES "PlanMembresia"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoFinanciero" ADD CONSTRAINT "MovimientoFinanciero_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoFinanciero" ADD CONSTRAINT "MovimientoFinanciero_retiroId_fkey" FOREIGN KEY ("retiroId") REFERENCES "Retiro"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Planta" ADD CONSTRAINT "Planta_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Planta" ADD CONSTRAINT "Planta_cosechaId_fkey" FOREIGN KEY ("cosechaId") REFERENCES "Cosecha"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Planta" ADD CONSTRAINT "Planta_geneticaId_fkey" FOREIGN KEY ("geneticaId") REFERENCES "Genetica"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sanitaria" ADD CONSTRAINT "Sanitaria_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Memoria" ADD CONSTRAINT "Memoria_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemoriaEntrada" ADD CONSTRAINT "MemoriaEntrada_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemoriaEntrada" ADD CONSTRAINT "MemoriaEntrada_memoriaId_fkey" FOREIGN KEY ("memoriaId") REFERENCES "Memoria"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemoriaHito" ADD CONSTRAINT "MemoriaHito_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemoriaHito" ADD CONSTRAINT "MemoriaHito_entradaId_fkey" FOREIGN KEY ("entradaId") REFERENCES "MemoriaEntrada"("id") ON DELETE CASCADE ON UPDATE CASCADE;

