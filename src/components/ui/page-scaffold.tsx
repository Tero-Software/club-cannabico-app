import type { ReactNode } from "react";

// Cabecera de página estándar del panel admin: título grande + descripción
// opcional + acción a la derecha (botón, link). Replica el patrón usado en
// configuración / seguridad para mantener consistencia visual.
export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
      <div className="min-w-0">
        <h1 className="text-3xl font-bold mb-1">{title}</h1>
        {description && (
          <p className="text-[var(--muted-foreground)]">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

// Estado vacío para secciones todavía sin datos. Un ícono opcional, un título
// y una bajada que explica qué va a vivir acá una vez poblada la sección.
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center text-center gap-3 py-16 px-6">
      {icon && (
        <div className="text-[var(--muted-foreground)] opacity-70">{icon}</div>
      )}
      <div className="space-y-1 max-w-md">
        <h2 className="text-lg font-semibold">{title}</h2>
        {description && (
          <p className="text-sm text-[var(--muted-foreground)]">{description}</p>
        )}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
