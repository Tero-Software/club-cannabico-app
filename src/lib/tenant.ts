import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { TENANT_HEADER } from "@/lib/tenant-host";

// Re-export edge-safe helpers para quien importe todo desde "@/lib/tenant".
export { TENANT_HEADER, slugFromHost } from "@/lib/tenant-host";

/**
 * Resuelve el tenant activo del request actual leyendo el header que dejó
 * el middleware. Devuelve null si no hay tenant (apex/landing) o no existe.
 * Solo en runtime Node (usa Prisma).
 */
export async function getCurrentTenant() {
  const slug = (await headers()).get(TENANT_HEADER);
  if (!slug) return null;
  return prisma.tenant.findUnique({ where: { slug } });
}

/**
 * Igual que getCurrentTenant pero tira si no hay tenant resuelto.
 */
export async function requireTenant() {
  const tenant = await getCurrentTenant();
  if (!tenant || !tenant.active) {
    throw new Error("Tenant no encontrado o inactivo");
  }
  return tenant;
}
