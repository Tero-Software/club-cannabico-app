"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { SocioRowMenu } from "./row-menu";
import { cargoLabel } from "../directiva/comision/cargos";
import { DataTable, type Column } from "@/components/ui/data-table";

type Socio = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  cargo: string | null;
  active: boolean;
};

const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

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

  const columns: Column<Socio>[] = [
    {
      label: "Nombre",
      cellClassName: "font-medium",
      cell: (s) => (
        <Link
          href={`/administrador/socios/${s.id}`}
          className="hover:text-[var(--primary)] transition-colors"
        >
          {s.name}
        </Link>
      ),
    },
    { label: "Email", muted: true, cell: (s) => s.email },
    { label: "Teléfono", muted: true, cell: (s) => s.phone || "—" },
    {
      label: "Rol",
      cell: (s) => (
        <span className="badge badge-completado">
          {s.cargo
            ? cargoLabel(s.cargo)
            : s.role === "ADMIN"
              ? "Administrador"
              : "Socio"}
        </span>
      ),
    },
    {
      label: "Estado",
      cell: (s) => (
        <span
          className={s.active ? "badge badge-aprobado" : "badge badge-rechazado"}
        >
          {s.active ? "Activo" : "Inactivo"}
        </span>
      ),
    },
    {
      label: "",
      align: "right",
      width: "3rem",
      cell: (s) =>
        s.role !== "ADMIN" ? (
          <SocioRowMenu id={s.id} active={s.active} />
        ) : null,
    },
  ];

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

      <DataTable
        columns={columns}
        rows={filtered}
        getRowKey={(s) => s.id}
      />
    </>
  );
}
