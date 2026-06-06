-- CreateTable
CREATE TABLE "Reservation" (
    "id" TEXT NOT NULL,
    "containerItemId" TEXT NOT NULL,
    "withdrawalItemId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Reservation_containerItemId_idx" ON "Reservation"("containerItemId");

-- CreateIndex
CREATE INDEX "Reservation_withdrawalItemId_idx" ON "Reservation"("withdrawalItemId");

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_containerItemId_fkey" FOREIGN KEY ("containerItemId") REFERENCES "ContainerItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_withdrawalItemId_fkey" FOREIGN KEY ("withdrawalItemId") REFERENCES "RetiroItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
