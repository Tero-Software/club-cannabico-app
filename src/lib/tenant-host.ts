/**
 * Resolución de tenant a partir del host. Edge-safe: sin Prisma ni APIs de
 * Node, para poder importarse desde el middleware (Edge Runtime).
 */

/**
 * Header interno donde el middleware deja el slug del tenant resuelto del host.
 * No es seteable por el cliente: el middleware lo reescribe en cada request.
 */
export const TENANT_HEADER = "x-tenant-slug";

/**
 * Dominio base del producto. El apex pelado es la landing (sin tenant);
 * cualquier subdominio `<slug>.<APP_DOMAIN>` identifica un tenant.
 */
const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN ?? "clubcannabico.app";

/**
 * Dominios propios de clubes, mapeados a su slug de tenant. Formato del env:
 * pares "dominio=slug" separados por coma, ej:
 * `TENANT_CUSTOM_DOMAINS="elgordito.club=elgordito"`.
 * El dominio debe además estar agregado al proyecto en Vercel para que el
 * tráfico llegue a la app. `www.<dominio>` resuelve al mismo slug.
 */
const CUSTOM_DOMAINS: Record<string, string> = Object.fromEntries(
  (process.env.TENANT_CUSTOM_DOMAINS ?? "")
    .split(",")
    .map((pair) => pair.split("=").map((part) => part.trim().toLowerCase()))
    .filter((pair) => pair.length === 2 && pair[0] && pair[1]),
);

/**
 * Extrae el slug de tenant de un host.
 * - `demo.clubcannabico.app` → "demo"
 * - `clubcannabico.app` (apex) → null (es la landing)
 * - dominio custom mapeado en TENANT_CUSTOM_DOMAINS → su slug
 * - `localhost:3000` → null
 * En dev se puede forzar con un host tipo `demo.localhost:3000`.
 */
export function slugFromHost(host: string | null): string | null {
  if (!host) return null;
  const hostname = host.split(":")[0]!.toLowerCase();

  if (hostname.endsWith(".localhost")) {
    const sub = hostname.slice(0, -".localhost".length);
    return sub || null;
  }
  if (hostname === "localhost") return null;

  const bare = hostname.startsWith("www.") ? hostname.slice(4) : hostname;
  const custom = CUSTOM_DOMAINS[hostname] ?? CUSTOM_DOMAINS[bare];
  if (custom) return custom;

  if (hostname === APP_DOMAIN || hostname === `www.${APP_DOMAIN}`) {
    return null; // apex = landing
  }
  if (hostname.endsWith(`.${APP_DOMAIN}`)) {
    const sub = hostname.slice(0, -(APP_DOMAIN.length + 1));
    if (sub && !sub.includes(".")) return sub;
  }
  return null;
}
