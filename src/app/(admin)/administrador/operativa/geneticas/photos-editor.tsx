"use client";

import Image from "next/image";
import { useRef, useState } from "react";

export function PhotosEditor({ initial }: { initial: string[] }) {
  const [photos, setPhotos] = useState<string[]>(initial);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const uploadedThisSession = useRef<Set<string>>(new Set());

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= photos.length) return;
    const next = [...photos];
    [next[i], next[j]] = [next[j], next[i]];
    setPhotos(next);
  };

  const remove = (i: number) => {
    const url = photos[i];
    setPhotos((prev) => prev.filter((_, k) => k !== i));
    if (uploadedThisSession.current.has(url)) {
      uploadedThisSession.current.delete(url);
      fetch("/api/blob/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      }).catch(() => {});
    }
  };

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;

    setError(null);
    setUploading(true);
    const added: string[] = [];
    try {
      for (const file of files) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/blob/upload", {
          method: "POST",
          body: fd,
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || `Error ${res.status}`);
        }
        const { url } = (await res.json()) as { url: string };
        added.push(url);
        uploadedThisSession.current.add(url);
      }
      setPhotos((prev) => [...prev, ...added]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al subir");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <label className="label">Fotos</label>
      <input type="hidden" name="photos" value={photos.join("\n")} />

      {photos.length > 0 && (
        <ul className="space-y-2 mb-3">
          {photos.map((src, i) => (
            <li
              key={`${src}-${i}`}
              className="flex items-center gap-3 p-2 rounded-md border border-[var(--border)] bg-[var(--muted)]"
            >
              <div className="relative w-14 h-14 shrink-0 rounded overflow-hidden bg-[var(--card)]">
                <Image src={src} alt="" fill sizes="56px" className="object-cover" />
              </div>
              <div className="flex-1 min-w-0 text-xs font-mono break-all text-[var(--muted-foreground)]">
                {src}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  className="btn btn-ghost text-xs px-2 py-1 disabled:opacity-30"
                  aria-label="Mover arriba"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === photos.length - 1}
                  className="btn btn-ghost text-xs px-2 py-1 disabled:opacity-30"
                  aria-label="Mover abajo"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="btn btn-ghost text-xs px-2 py-1 text-[var(--destructive)]"
                  aria-label="Eliminar"
                >
                  ✕
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div>
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          multiple
          onChange={onPick}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="btn btn-secondary text-sm"
        >
          {uploading ? "Subiendo..." : "Subir fotos"}
        </button>
        {error && (
          <p className="mt-2 text-xs text-[var(--destructive)]">{error}</p>
        )}
      </div>
    </div>
  );
}
