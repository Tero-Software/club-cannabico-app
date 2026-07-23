"use client";

import { useState, useTransition } from "react";
import { WheelPicker, WheelPickerWrapper } from "@ncdai/react-wheel-picker";
import { updateClubFieldAction } from "./actions";
import { SavingSpinner } from "@/components/ui/saving-spinner";
import { PencilIcon } from "@/components/ui/icons";

// Paso de minutos del selector. 5 minutos es suficiente para franjas de retiro.
const MINUTE_STEP = 5;

const HOURS = Array.from({ length: 24 }, (_, h) => ({
  value: String(h).padStart(2, "0"),
  label: String(h).padStart(2, "0"),
}));
const MINUTES = Array.from({ length: 60 / MINUTE_STEP }, (_, i) => {
  const m = String(i * MINUTE_STEP).padStart(2, "0");
  return { value: m, label: m };
});

const WHEEL_WIDTH = 90;
// Alto de cada celda. Toda la geometría de la rueda escala con este valor:
// más chico = items más pegados y rueda más compacta.
const ITEM_HEIGHT = 90;
const VISIBLE_COUNT = 4;

// Velocidad del giro. La animación de un paso dura √(1/scrollSensitivity) s
// (default 5 ≈ 0.45 s; con 1 ≈ 1 s) y la inercia del arrastre desacelera a
// dragSensitivity × 10 items/s² (default 3; con 1 frena 3 veces más suave).
const DRAG_SENSITIVITY = 2;
const SCROLL_SENSITIVITY = 6;

/** Rueda de 24 hs: dos ruedas (hora y minuto) que devuelven "HH:MM". */
function TimeWheel({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [h, m] = value ? value.split(":") : ["", ""];
  const wheelClassNames = {
    optionItem: "text-[var(--muted-foreground)]",
    highlightItem: "text-[var(--foreground)] font-medium",
    highlightWrapper: "bg-[var(--surface-3)] text-[var(--foreground)]",
  };
  return (
    <div className="relative" style={{ width: WHEEL_WIDTH }}>
      <WheelPickerWrapper className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-1)]">
        <WheelPicker
          options={HOURS}
          value={h || "00"}
          onValueChange={(nh) => onChange(`${nh}:${m || "00"}`)}
          infinite
          visibleCount={VISIBLE_COUNT}
          optionItemHeight={ITEM_HEIGHT}
          dragSensitivity={DRAG_SENSITIVITY}
          scrollSensitivity={SCROLL_SENSITIVITY}
          classNames={wheelClassNames}
        />
        <WheelPicker
          options={MINUTES}
          value={m || "00"}
          onValueChange={(nm) => onChange(`${h || "00"}:${nm}`)}
          infinite
          visibleCount={VISIBLE_COUNT}
          optionItemHeight={ITEM_HEIGHT}
          dragSensitivity={DRAG_SENSITIVITY}
          scrollSensitivity={SCROLL_SENSITIVITY}
          classNames={wheelClassNames}
        />
      </WheelPickerWrapper>
      {/* Separador ":" fijo entre horas y minutos. */}
      <span
        aria-hidden
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[var(--foreground)] font-medium pointer-events-none"
      >
        :
      </span>
    </div>
  );
}

/**
 * Editor de franjas horarias. Cada franja "HH:MM-HH:MM" se muestra en su propio
 * renglón con un lápiz para editarla. El botón "Agregar franja" (arriba a la
 * derecha) abre el selector tipo rueda de 24 hs para inicio y fin. La lista se
 * guarda completa en el campo timeSlots del club.
 */
export function TimeSlotsEditor({ initial }: { initial: string[] }) {
  const [slots, setSlots] = useState<string[]>(initial);
  // "new" mientras se agrega; el índice de la franja en edición; o null.
  const [editing, setEditing] = useState<"new" | number | null>(null);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function persist(next: string[]) {
    startTransition(async () => {
      setError(null);
      const fd = new FormData();
      fd.set("field", "timeSlots");
      for (const s of next) fd.append("value", s);
      const res = await updateClubFieldAction(null, fd);
      if (res && "error" in res && res.error) {
        setError(res.error);
      } else {
        setSlots(next);
        close();
      }
    });
  }

  function close() {
    setEditing(null);
    setStart("");
    setEnd("");
    setError(null);
  }

  function openNew() {
    setEditing("new");
    setStart("18:00");
    setEnd("19:00");
    setError(null);
  }

  function openEdit(i: number) {
    const [s, e] = slots[i].split("-");
    setEditing(i);
    setStart(s);
    setEnd(e);
    setError(null);
  }

  function save() {
    setError(null);
    if (!start || !end) {
      setError("Elegí inicio y fin.");
      return;
    }
    if (end <= start) {
      setError("El fin debe ser posterior al inicio.");
      return;
    }
    const slot = `${start}-${end}`;
    const others = editing === "new" ? slots : slots.filter((_, i) => i !== editing);
    if (others.includes(slot)) {
      setError("Esa franja ya existe.");
      return;
    }
    const next = [...others, slot].sort((a, b) => a.localeCompare(b));
    persist(next);
  }

  function remove(i: number) {
    persist(slots.filter((_, idx) => idx !== i));
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-sm font-medium inline-flex items-center gap-2">
          Franjas horarias
          {pending && <SavingSpinner />}
        </span>
        {editing === null && (
          <button
            type="button"
            onClick={openNew}
            className="btn btn-secondary text-sm"
          >
            + Agregar franja
          </button>
        )}
      </div>

      {slots.length === 0 && editing === null ? (
        <p className="text-sm text-[var(--fg-quaternary)] italic">
          Sin franjas cargadas.
        </p>
      ) : (
        <div className="card p-0 [&>*+*]:border-t [&>*+*]:border-[var(--border-subtle)]">
          {slots.map((s, i) =>
            editing === i ? (
              <SlotEditor
                key={`edit-${i}`}
                start={start}
                end={end}
                onStart={setStart}
                onEnd={setEnd}
                onSave={save}
                onCancel={close}
                onRemove={() => remove(i)}
                error={error}
                pending={pending}
              />
            ) : (
              <div
                key={s}
                className="flex items-center justify-between gap-3 px-5 py-3"
              >
                <span className="text-sm tabular-nums">{s}</span>
                <button
                  type="button"
                  aria-label={`Editar ${s}`}
                  onClick={() => openEdit(i)}
                  className="inline-flex items-center justify-center h-7 w-7 rounded-md text-[var(--muted-foreground)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)] transition-colors shrink-0"
                >
                  <PencilIcon />
                </button>
              </div>
            ),
          )}
          {editing === "new" && (
            <SlotEditor
              start={start}
              end={end}
              onStart={setStart}
              onEnd={setEnd}
              onSave={save}
              onCancel={close}
              error={error}
              pending={pending}
            />
          )}
        </div>
      )}
    </div>
  );
}

/** Fila de edición de una franja: dos ruedas (inicio/fin) con guardar/cancelar. */
function SlotEditor({
  start,
  end,
  onStart,
  onEnd,
  onSave,
  onCancel,
  onRemove,
  error,
  pending,
}: {
  start: string;
  end: string;
  onStart: (v: string) => void;
  onEnd: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
  onRemove?: () => void;
  error: string | null;
  pending: boolean;
}) {
  return (
    <div className="px-5 py-4">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-10">
          <div className="flex items-center gap-6">
            <span className="label text-xs mb-0">Inicio</span>
            <TimeWheel value={start} onChange={onStart} />
          </div>
          <div className="flex items-center gap-6">
            <span className="label text-xs mb-0">Fin</span>
            <TimeWheel value={end} onChange={onEnd} />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          {onRemove && (
            <button
              type="button"
              onClick={onRemove}
              disabled={pending}
              className="btn btn-ghost text-sm text-[var(--destructive)]"
            >
              Eliminar
            </button>
          )}
          <button type="button" onClick={onCancel} className="btn btn-ghost text-sm">
            Cancelar
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={pending}
            className="btn btn-primary text-sm inline-flex items-center gap-2"
          >
            {pending && <SavingSpinner />}
            Guardar
          </button>
        </div>
      </div>
      {error && <p className="text-sm text-[var(--destructive)] mt-2">{error}</p>}
    </div>
  );
}
