-- Add expiresAt to User (used by visitors)
ALTER TABLE "User" ADD COLUMN "expiresAt" TIMESTAMP(3);

-- VisitorInvite table
CREATE TABLE "InvitacionVisitante" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "userId" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvitacionVisitante_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "InvitacionVisitante_token_key" ON "InvitacionVisitante"("token");
CREATE INDEX "InvitacionVisitante_expiresAt_idx" ON "InvitacionVisitante"("expiresAt");

ALTER TABLE "InvitacionVisitante"
  ADD CONSTRAINT "InvitacionVisitante_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
