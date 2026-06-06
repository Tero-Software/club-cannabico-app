-- CreateEnum
CREATE TYPE "EstadoComentario" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "Comentario" (
    "id" TEXT NOT NULL,
    "postSlug" TEXT NOT NULL,
    "userId" TEXT,
    "guestName" TEXT,
    "guestEmail" TEXT,
    "body" TEXT NOT NULL,
    "status" "EstadoComentario" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Comentario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Comentario_postSlug_status_createdAt_idx" ON "Comentario"("postSlug", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Comentario_status_createdAt_idx" ON "Comentario"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "Comentario" ADD CONSTRAINT "Comentario_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
