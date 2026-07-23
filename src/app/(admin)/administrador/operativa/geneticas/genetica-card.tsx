"use client";

import Image from "next/image";
import { useEffect, useState, useTransition } from "react";
import { updateProductoAction, deleteProductoAction } from "./actions";
import { PhotosEditor } from "./photos-editor";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { SavingSpinner } from "@/components/ui/saving-spinner";

export type Genetica = {
  id: string;
  name: string;
  bank: string | null;
  description: string | null;
  photos: string[];
  sourceUrl: string | null;
};

export function GeneticaCard({
  genetica: g,
  editing,
  onEdit,
  onClose,
  formRef,
}: {
  genetica: Genetica;
  editing: boolean;
  onEdit: () => void;
  onClose: () => void;
  formRef: (el: HTMLFormElement | null) => void;
}) {
  const [photoIdx, setPhotoIdx] = useState(0);
  const [preview, setPreview] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!preview) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPreview(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [preview]);

  if (editing) {
    return (
      <form
        ref={formRef}
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          startTransition(async () => {
            await updateProductoAction(fd);
            onClose();
          });
        }}
        className="card"
      >
        <input type="hidden" name="id" value={g.id} />
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Editando: {g.name}</h3>
        </div>

        <div className="grid sm:grid-cols-3 gap-3 mb-3">
          <div>
            <label className="label">Nombre</label>
            <input name="name" defaultValue={g.name} required className="input" />
          </div>
          <div>
            <label className="label">Banco</label>
            <input name="bank" defaultValue={g.bank ?? ""} className="input" />
          </div>
        </div>

        <div className="mb-3">
          <label className="label">Descripción</label>
          <textarea
            name="description"
            rows={3}
            defaultValue={g.description ?? ""}
            className="input"
          />
        </div>

        <div className="mb-3">
          <PhotosEditor initial={g.photos} />
        </div>

        <div className="mb-3">
          <label className="label">URL de origen</label>
          <input
            name="sourceUrl"
            type="url"
            defaultValue={g.sourceUrl ?? ""}
            className="input"
          />
        </div>

        <div className="flex items-center justify-between gap-3 flex-wrap pt-3 border-t border-[var(--border)]">
          <DeleteButton id={g.id} />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={pending}
              className="btn btn-primary text-sm inline-flex items-center gap-2"
            >
              {pending && <SavingSpinner />}
              Guardar
            </button>
          </div>
        </div>
      </form>
    );
  }

  const hasPhotos = g.photos.length > 0;
  const current = hasPhotos ? g.photos[photoIdx] : null;

  return (
    <div className="card">
      <div className="grid sm:grid-cols-[160px_1fr] gap-4">
        <div>
          <div className="relative aspect-square rounded-md overflow-hidden bg-[var(--muted)]">
            {current ? (
              <button
                type="button"
                aria-label="Ver foto más grande"
                onClick={() => setPreview(true)}
                className="absolute inset-0 cursor-lupa transition-opacity hover:opacity-90"
              >
                <Image
                  src={current}
                  alt={g.name}
                  fill
                  sizes="160px"
                  className="object-cover"
                />
              </button>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-xs text-[var(--muted-foreground)]">
                Sin foto
              </div>
            )}
          </div>
          {g.photos.length > 1 && (
            <div className="flex gap-1.5 mt-2">
              {g.photos.map((src, i) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => setPhotoIdx(i)}
                  className={`relative w-12 h-12 rounded overflow-hidden border-2 transition-colors ${
                    i === photoIdx
                      ? "border-[var(--primary)]"
                      : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                >
                  <Image src={src} alt="" fill sizes="48px" className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="min-w-0">
          <div className="mb-2 min-w-0 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-lg font-semibold leading-tight">{g.name}</h3>
              {g.bank && (
                <p className="text-sm text-[var(--muted-foreground)]">
                  {g.bank}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onEdit}
              className="btn btn-secondary text-sm shrink-0"
            >
              Editar
            </button>
          </div>

          {g.description && (
            <p className="text-sm text-[var(--muted-foreground)] leading-relaxed mt-6">
              {g.description}
            </p>
          )}
        </div>
      </div>

      {/* Preview de la foto a pantalla completa: se cierra tocando afuera o con Esc. */}
      {preview && current && (
        <div
          role="dialog"
          aria-label={`Foto de ${g.name}`}
          onClick={() => setPreview(false)}
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-6"
        >
          <div
            className="relative w-full max-w-3xl aspect-square"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={current}
              alt={g.name}
              fill
              sizes="(max-width: 768px) 100vw, 768px"
              className="object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function DeleteButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <ConfirmButton
      pending={pending}
      variant="solid"
      confirmLabel="Confirmar eliminación"
      onConfirm={() => {
        const fd = new FormData();
        fd.set("id", id);
        startTransition(() => {
          deleteProductoAction(fd);
        });
      }}
    >
      Eliminar
    </ConfirmButton>
  );
}
