-- Rename Producto -> Genetica
ALTER TABLE "Producto" RENAME TO "Genetica";
ALTER TABLE "Genetica" RENAME CONSTRAINT "Producto_pkey" TO "Genetica_pkey";

-- Add new columns
ALTER TABLE "Genetica" ADD COLUMN "bank" TEXT;
ALTER TABLE "Genetica" ADD COLUMN "photos" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Genetica" ADD COLUMN "sourceUrl" TEXT;

-- Rename RetiroItem.productoId -> geneticaId
ALTER TABLE "RetiroItem" RENAME COLUMN "productoId" TO "geneticaId";
ALTER TABLE "RetiroItem" RENAME CONSTRAINT "RetiroItem_productoId_fkey" TO "RetiroItem_geneticaId_fkey";
ALTER INDEX "RetiroItem_productoId_idx" RENAME TO "RetiroItem_geneticaId_idx";
