import type { ReactNode } from "react";

export type Column<Row> = {
  /** Encabezado de la columna. */
  label: ReactNode;
  /** Contenido de la celda para una fila. */
  cell: (row: Row) => ReactNode;
  /** Alineación del texto de la columna. Por defecto izquierda. */
  align?: "left" | "right" | "center";
  /** Atenúa el texto de la celda (para datos secundarios). */
  muted?: boolean;
  /** Ancho fijo opcional (cualquier valor CSS, p. ej. "12rem", "2.5rem"). */
  width?: string;
  /** Clase extra para el <th>. */
  headClassName?: string;
  /** Clase extra para el <td>. */
  cellClassName?: string;
};

/**
 * Tabla de datos plana con header de columnas sticky. Es el patrón HTML común
 * de la app (socios, finanzas, sanitaria, estadísticas…), centralizado en un
 * solo lugar para que los labels queden anclados arriba al hacer scroll.
 *
 * El sticky del thead requiere que el scroll vertical viva en un ancestro (el
 * panel de contenido). Un ancestro con overflow-x/overflow-y propio rompería el
 * anclado; por eso el contenedor de la tabla no impone overflow.
 */
export function DataTable<Row>({
  columns,
  rows,
  getRowKey,
  onRowClassName,
  empty = "Sin resultados.",
  footer,
}: {
  columns: Column<Row>[];
  rows: Row[];
  getRowKey: (row: Row) => string;
  /** Clase extra por fila (según la fila). */
  onRowClassName?: (row: Row) => string;
  empty?: ReactNode;
  /** Contenido opcional del <tfoot> (p. ej. fila de totales). */
  footer?: ReactNode;
}) {
  const alignClass = (a?: Column<Row>["align"]) =>
    a === "right" ? "text-right" : a === "center" ? "text-center" : "text-left";

  return (
    <div className="card p-0 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="sticky top-0 z-10 bg-[var(--surface-3)] text-left text-[0.7rem] font-normal text-[var(--fg-quaternary)] uppercase tracking-wide">
          <tr>
            {columns.map((c, i) => (
              <th
                key={i}
                className={`px-4 py-2 font-normal ${alignClass(c.align)} ${c.headClassName ?? ""}`}
                style={c.width ? { width: c.width } : undefined}
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-8 text-center text-[var(--muted-foreground)]"
              >
                {empty}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={getRowKey(row)}
                className={`border-t border-[var(--border)] ${onRowClassName?.(row) ?? ""}`}
              >
                {columns.map((c, i) => (
                  <td
                    key={i}
                    className={`px-4 py-3 ${alignClass(c.align)} ${
                      c.muted ? "text-[var(--muted-foreground)]" : ""
                    } ${c.cellClassName ?? ""}`}
                  >
                    {c.cell(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
        {footer && <tfoot>{footer}</tfoot>}
      </table>
    </div>
  );
}
