"use client";

import { useState, useTransition } from "react";
import { NewContainerForm } from "../../acopio/new-container-form";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { declareHarvest, deleteHarvest } from "./actions";

type Strain = { id: string; name: string };
type ItemRow = { strainName: string; plantNumber: string | null; weight: number };
type ContainerRow = { id: string; number: number; items: ItemRow[] };
type Harvest = {
  id: string;
  date: string;
  declarada: boolean;
  plan: { number: number } | null;
  notes: string | null;
  containers: ContainerRow[];
};

export function CosechasPanel({
  harvests,
  strains,
}: {
  harvests: Harvest[];
  strains: Strain[];
}) {
  const staging = harvests.filter((h) => !h.declarada);

  return (
    <div className="space-y-8">
      {staging.length > 0 && (
        <div className="space-y-4">
          {staging.map((h) => (
            <HarvestCard key={h.id} harvest={h} strains={strains} />
          ))}
        </div>
      )}
    </div>
  );
}

function HarvestCard({
  harvest,
  strains,
}: {
  harvest: Harvest;
  strains: Strain[];
}) {
  const [adding, setAdding] = useState(false);
  const [declaring, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const fecha = new Intl.DateTimeFormat("es-UY", { dateStyle: "long" }).format(
    new Date(harvest.date),
  );
  const totalWeight = harvest.containers.reduce(
    (s, c) => s + c.items.reduce((a, i) => a + i.weight, 0),
    0,
  );

  return (
    <article className="card space-y-4">
      <header className="flex items-baseline justify-between gap-3 flex-wrap">
        <h3 className="font-semibold">
          {harvest.plan
            ? `Cosecha N.º ${harvest.plan.number} — ${new Date(harvest.date).getFullYear()}`
            : `Cosecha del ${fecha}`}{" "}
          <span className="text-sm font-normal text-[var(--muted-foreground)]">
            · {harvest.containers.length} contenedor
            {harvest.containers.length === 1 ? "" : "es"} ·{" "}
            {totalWeight.toLocaleString("es-AR", { maximumFractionDigits: 2 })} g
          </span>
        </h3>
        <span className="text-sm font-normal text-[var(--primary)]">
          en curso
        </span>
      </header>

      {harvest.containers.length > 0 && (
        <div className="divide-y divide-[var(--border-subtle)]">
          {harvest.containers.map((c) => (
            <div key={c.id} className="py-2">
              <div className="text-sm font-medium">Contenedor #{c.number}</div>
              <ul className="text-sm text-[var(--muted-foreground)]">
                {c.items.map((it, i) => (
                  <li key={i}>
                    {it.strainName}
                    {it.plantNumber ? ` · planta ${it.plantNumber}` : ""} ·{" "}
                    {it.weight.toLocaleString("es-AR", {
                      maximumFractionDigits: 2,
                    })}{" "}
                    g
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      <NewContainerForm
        strains={strains}
        open={adding}
        onClose={() => setAdding(false)}
        harvestId={harvest.id}
      />

      {!adding && (
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-[var(--border-subtle)]">
          <div className="flex items-center gap-2">
            <button
              className="btn btn-secondary text-sm"
              onClick={() => setAdding(true)}
            >
              Agregar contenedor
            </button>
            <DeleteHarvest id={harvest.id} />
          </div>
          <button
            className="btn btn-primary text-sm"
            disabled={declaring || harvest.containers.length === 0}
            onClick={() =>
              start(async () => {
                setError(null);
                const fd = new FormData();
                fd.set("id", harvest.id);
                const res = await declareHarvest(fd);
                if (res?.error) setError(res.error);
              })
            }
          >
            {declaring ? "Declarando…" : "Declarar a acopio"}
          </button>
        </div>
      )}
      {error && <p className="text-sm text-[var(--destructive)]">{error}</p>}
    </article>
  );
}

function DeleteHarvest({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return (
    <ConfirmButton
      pending={pending}
      confirmLabel="¿Borrar cosecha?"
      onConfirm={() =>
        start(async () => {
          const fd = new FormData();
          fd.set("id", id);
          await deleteHarvest(fd);
        })
      }
    >
      Borrar
    </ConfirmButton>
  );
}
