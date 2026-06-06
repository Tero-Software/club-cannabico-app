import type { Session } from "next-auth";

export const PERMISSIONS = [
  "retiros:manage",
  "socios:manage",
  "geneticas:manage",
  "containers:manage",
  "postulaciones:manage",
  "admins:manage",
  "estadisticas:view",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export const PERMISSION_LABELS: Record<Permission, string> = {
  "retiros:manage": "Gestionar retiros",
  "socios:manage": "Gestionar socios",
  "geneticas:manage": "Gestionar genéticas",
  "containers:manage": "Gestionar contenedores",
  "postulaciones:manage": "Gestionar postulaciones",
  "admins:manage": "Gestionar administradores",
  "estadisticas:view": "Ver estadísticas",
};

export function can(
  session: Session | null,
  permission: Permission,
): boolean {
  if (!session) return false;
  if (session.user.role !== "ADMIN") return false;
  return (session.user.permissions ?? []).includes(permission);
}

export function hasAnyAdminPermission(session: Session | null): boolean {
  if (!session || session.user.role !== "ADMIN") return false;
  return (session.user.permissions ?? []).length > 0;
}

export function assertCan(
  session: Session | null,
  permission: Permission,
): asserts session is Session {
  if (!can(session, permission)) {
    throw new Error("No autorizado");
  }
}
