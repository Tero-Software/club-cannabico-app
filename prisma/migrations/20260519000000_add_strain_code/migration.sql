ALTER TABLE "Genetica" ADD COLUMN "code" TEXT;
CREATE UNIQUE INDEX "Genetica_code_key" ON "Genetica"("code");
