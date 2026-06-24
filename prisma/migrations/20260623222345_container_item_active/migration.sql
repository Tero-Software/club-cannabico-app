-- Estado de acopio por genética (ContainerItem) en vez de por contenedor.
ALTER TABLE "ContainerItem" ADD COLUMN "active" BOOLEAN NOT NULL DEFAULT false;
UPDATE "ContainerItem" ci SET "active" = c."active" FROM "Container" c WHERE ci."containerId" = c."id";
ALTER TABLE "Container" DROP COLUMN "active";
