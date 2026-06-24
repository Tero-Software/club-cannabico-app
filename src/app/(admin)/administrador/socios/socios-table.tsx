"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { SocioRowMenu } from "./row-menu";

type Socio = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  active: boolean;
  retiros: number;
  ultimoRetiro: string | null;
};

const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const fmt = new Intl.DateTimeFormat("es-UY", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export function SociosTable({ socios }: { socios: Socio[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return socios;
    return socios.filter((s) => {
      const hay = normalize(
        [s.name, s.email, s.phone ?? ""].join(" "),
      );
      return hay.includes(q);
    });
  }, [socios, query]);

  return (
    <>
      <div className="mb-4">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre, email o teléfono"
          className="input max-w-md"
        />
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[var(--muted)] text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Nombre</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Teléfono</th>
              <th className="px-4 py-3 font-medium">Rol</th>
              <th className="px-4 py-3 font-medium">Retiros</th>
              <th className="px-4 py-3 font-medium">Último</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-8 text-center text-[var(--muted-foreground)]"
                >
                  Sin resultados.
                </td>
              </tr>
            ) : (
              filtered.map((s) => (
                <tr key={s.id} className="border-t border-[var(--border)]">
                  <td className="px-4 py-3 font-medium">
                    <Link
                      href={`/administrador/socios/${s.id}`}
                      className="hover:text-[var(--primary)] transition-colors"
                    >
                      {s.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[var(--muted-foreground)]">
                    {s.email}
                  </td>
                  <td className="px-4 py-3 text-[var(--muted-foreground)]">
                    {s.phone || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className="badge badge-completado">
                      {s.role === "ADMIN" ? "Administrador" : "Socio"}
                    </span>
                  </td>
                  <td className="px-4 py-3">{s.retiros}</td>
                  <td className="px-4 py-3 text-[var(--muted-foreground)]">
                    {s.ultimoRetiro
                      ? fmt.format(new Date(s.ultimoRetiro))
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        s.active
                          ? "badge badge-aprobado"
                          : "badge badge-rechazado"
                      }
                    >
                      {s.active ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {s.role !== "ADMIN" && (
                      <SocioRowMenu id={s.id} active={s.active} />
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
