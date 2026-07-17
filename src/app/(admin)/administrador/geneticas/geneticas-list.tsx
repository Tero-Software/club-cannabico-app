"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { GeneticaCard, type Genetica } from "./genetica-card";
import { updateProductoAction } from "./actions";

export function GeneticasList({ geneticas }: { geneticas: Genetica[] }) {
  const searchParams = useSearchParams();
  // Permite abrir una genética directo en edición vía ?editar=<id> (p. ej. desde
  // el botón "Editar" del acopio). Solo se aplica una vez, al montar.
  const initialEdit = searchParams.get("editar");
  const [editingId, setEditingId] = useState<string | null>(
    initialEdit && geneticas.some((g) => g.id === initialEdit) ? initialEdit : null,
  );
  const formRefs = useRef<Record<string, HTMLFormElement | null>>({});
  const [, startTransition] = useTransition();

  // Al llegar con ?editar=<id>, lleva la card abierta a la vista.
  useEffect(() => {
    if (!editingId) return;
    formRefs.current[editingId]?.scrollIntoView({ block: "center", behavior: "smooth" });
    // Solo en el primer render con el param inicial.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const request = (id: string) => {
    if (editingId && editingId !== id) {
      const prev = formRefs.current[editingId];
      if (prev) {
        const fd = new FormData(prev);
        startTransition(() => {
          updateProductoAction(fd);
        });
      }
    }
    setEditingId(id);
  };

  return (
    <div className="space-y-3">
      {geneticas.map((g) => (
        <GeneticaCard
          key={g.id}
          genetica={g}
          editing={editingId === g.id}
          onEdit={() => request(g.id)}
          onClose={() => setEditingId((prev) => (prev === g.id ? null : prev))}
          formRef={(el) => {
            formRefs.current[g.id] = el;
          }}
        />
      ))}
    </div>
  );
}
