-- AlterTable
ALTER TABLE "User" ADD COLUMN "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Seed: all existing ADMIN users get all permissions
UPDATE "User"
SET "permissions" = ARRAY[
  'retiros:manage',
  'socios:manage',
  'productos:manage',
  'postulaciones:manage',
  'admins:manage'
]::TEXT[]
WHERE "role" = 'ADMIN';
