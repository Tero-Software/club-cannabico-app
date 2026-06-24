/**
 * Convención de paths de Vercel Blob por tenant. Cada tenant tiene su propio
 * prefijo, de modo que un admin solo puede operar (subir/borrar) sobre blobs
 * dentro de su namespace. El delete valida contra este prefijo, no solo contra
 * el host de Vercel: sin esto, un admin podría borrar blobs de otro tenant.
 */

const BLOB_HOST_SUFFIX = ".public.blob.vercel-storage.com";

/** Prefijo de carpeta para las fotos de genéticas de un tenant. */
export function geneticasPrefix(tenantSlug: string): string {
  return `tenants/${tenantSlug}/geneticas/`;
}

/** Path completo de una foto de genética nueva para un tenant. */
export function geneticasBlobPath(tenantSlug: string, fileName: string): string {
  return `${geneticasPrefix(tenantSlug)}${fileName}`;
}

/**
 * Verifica que una URL de blob pertenezca al namespace del tenant: host de
 * Vercel Blob y path bajo el prefijo del tenant. Las URLs legacy sin prefijo
 * de tenant quedan fuera (no se pueden borrar vía API; se limpian aparte).
 */
export function isOwnTenantBlob(url: string, tenantSlug: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (!parsed.hostname.endsWith(BLOB_HOST_SUFFIX)) return false;
  const path = parsed.pathname.replace(/^\/+/, "");
  return path.startsWith(geneticasPrefix(tenantSlug));
}
