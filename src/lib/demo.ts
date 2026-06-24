import type { Session } from "next-auth";
import { PERMISSIONS } from "@/lib/permissions";

/**
 * Tenant de demostración. Su app corre sin login: el hero de la landing la
 * embebe (en `demo.<APP_DOMAIN>`) para mostrar la aplicación real navegable.
 * Las server actions están cortadas para este tenant: se ve y se toca todo,
 * pero nada muta la base. Ver [[isDemoSession]] y el guard en permissions.
 */
export const DEMO_TENANT_SLUG = "demo";

/** True si el slug del host corresponde al tenant demo. */
export function isDemoSlug(slug: string | null | undefined): boolean {
  return slug === DEMO_TENANT_SLUG;
}

/** True si la sesión es la sesión demo de solo lectura. */
export function isDemoSession(session: Session | null): boolean {
  return session?.user?.tenantSlug === DEMO_TENANT_SLUG && session.user.id === DEMO_USER_ID;
}

const DEMO_USER_ID = "__demo__";

/**
 * Sesión sintética de admin para el tenant demo: todos los permisos, sin
 * login. No sale de la DB; se inyecta cuando el request viene del host demo.
 * El tenantId real (para que las queries de las páginas devuelvan los datos
 * de muestra) lo resuelve quien la consume a partir del tenant demo.
 */
export function demoSession(tenantId: string): Session {
  return {
    user: {
      id: DEMO_USER_ID,
      email: "demo@clubcannabico.app",
      name: "Club Demo",
      role: "ADMIN",
      permissions: [...PERMISSIONS],
      mustChangePassword: false,
      totpEnabled: true,
      expiresAt: null,
      tenantId,
      tenantSlug: DEMO_TENANT_SLUG,
    },
    expires: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
  };
}
