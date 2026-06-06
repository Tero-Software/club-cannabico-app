-- Drop ClubConfig (moved to static config)
DROP TABLE "ClubConfig";

-- Restructure Retiro: remove productoId/cantidad, move to RetiroItem
ALTER TABLE "Retiro" DROP CONSTRAINT "Retiro_productoId_fkey";

-- CreateTable
CREATE TABLE "RetiroItem" (
    "id" TEXT NOT NULL,
    "retiroId" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "cantidad" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "RetiroItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RetiroItem_retiroId_idx" ON "RetiroItem"("retiroId");
CREATE INDEX "RetiroItem_productoId_idx" ON "RetiroItem"("productoId");

-- Migrate existing Retiro data into RetiroItem
INSERT INTO "RetiroItem" ("id", "retiroId", "productoId", "cantidad")
SELECT
    'ri_' || substr(md5(random()::text), 1, 24),
    "id",
    "productoId",
    "cantidad"
FROM "Retiro";

-- Drop old columns
ALTER TABLE "Retiro" DROP COLUMN "productoId";
ALTER TABLE "Retiro" DROP COLUMN "cantidad";

-- AddForeignKey
ALTER TABLE "RetiroItem" ADD CONSTRAINT "RetiroItem_retiroId_fkey" FOREIGN KEY ("retiroId") REFERENCES "Retiro"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RetiroItem" ADD CONSTRAINT "RetiroItem_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
