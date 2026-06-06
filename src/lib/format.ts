export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("es-AR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatDateShort(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("es-AR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export function formatGramos(g: number): string {
  return `${g.toLocaleString("es-AR", { maximumFractionDigits: 2 })} g`;
}

export function estadoLabel(status: string): string {
  const map: Record<string, string> = {
    PENDING: "Pendiente",
    APPROVED: "Aprobado",
    REJECTED: "Rechazado",
    COMPLETED: "Completado",
    CANCELLED: "Cancelado",
  };
  return map[status] ?? status;
}

export function estadoBadgeClass(status: string): string {
  const map: Record<string, string> = {
    PENDING: "pendiente",
    APPROVED: "aprobado",
    REJECTED: "rechazado",
    COMPLETED: "completado",
    CANCELLED: "cancelado",
  };
  return `badge badge-${map[status] ?? status.toLowerCase()}`;
}
