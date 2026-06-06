"use client";

import { useRef, useState, useTransition } from "react";
import { GeneticaCard, type Genetica } from "./genetica-card";
import { updateProductoAction } from "./actions";

export function GeneticasList({ geneticas }: { geneticas: Genetica[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const formRefs = useRef<Record<string, HTMLFormElement | null>>({});
  const [, startTransition] = useTransition();

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
