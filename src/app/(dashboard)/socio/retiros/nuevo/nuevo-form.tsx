"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { crearRetiroAction, type RetiroFormState } from "../actions";
import { SavingSpinner } from "@/components/ui/saving-spinner";

type Genetica = {
  id: string;
  code: string | null;
  name: string;
  bank: string | null;
  description: string | null;
  photos: string[];
  stock: number;
};

type Seleccion = Record<string, number>;

const STEP = 10;
const MIN_RETIRO = 20;

const DIAS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function fmtFechaLarga(d: Date): string {
  return `${DIAS[d.getDay()]} ${d.getDate()} de ${MESES[d.getMonth()].toLowerCase()}`;
}

function toISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function NuevoRetiroForm({
  geneticas,
  horarios,
  gramosDisponibles,
  maxGramos,
}: {
  geneticas: Genetica[];
  horarios: string[];
  gramosDisponibles: number;
  maxGramos: number;
}) {
  const [state, action, pending] = useActionState<RetiroFormState, FormData>(
    crearRetiroAction,
    null,
  );
  const [seleccion, setSeleccion] = useState<Seleccion>({});
  const [fecha, setFecha] = useState<string>("");
  const [horario, setHorario] = useState<string>("");

  const total = useMemo(
    () => Object.values(seleccion).reduce((s, n) => s + n, 0),
    [seleccion],
  );
  const restante = Math.max(0, gramosDisponibles - total);
  const puedeSumar = restante >= STEP;
  const items = useMemo(
    () =>
      Object.entries(seleccion)
        .filter(([, cant]) => cant > 0)
        .map(([strainId, amount]) => ({ strainId, amount })),
    [seleccion],
  );
  const valido = total >= MIN_RETIRO && items.length > 0 && !!fecha && !!horario;

  const proximasFechas = useMemo(() => {
    const out: Date[] = [];
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    for (let i = 0; i < 14; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      if (d.getDay() === 0) continue;
      out.push(d);
    }
    return out;
  }, []);

  const sumar = (id: string) => {
    if (!puedeSumar) return;
    setSeleccion((s) => ({ ...s, [id]: (s[id] ?? 0) + STEP }));
  };
  const restar = (id: string) => {
    setSeleccion((s) => {
      const next = { ...s };
      const v = (next[id] ?? 0) - STEP;
      if (v <= 0) delete next[id];
      else next[id] = v;
      return next;
    });
  };

  const usadoPct = Math.min(100, ((maxGramos - gramosDisponibles) / maxGramos) * 100);
  const previewPct = Math.min(100, ((maxGramos - gramosDisponibles + total) / maxGramos) * 100);

  return (
    <form action={action} className="space-y-8">
      <input type="hidden" name="items" value={JSON.stringify(items)} />
      <input type="hidden" name="fecha" value={fecha} />
      <input type="hidden" name="horario" value={horario} />

      <section className="card">
        <div className="flex items-baseline justify-between mb-2">
          <h2 className="text-sm font-medium tracking-wide uppercase text-[var(--muted-foreground)]">
            Cupo mensual
          </h2>
          <span className="text-sm tabular-nums">
            {total > 0 && (
              <>
                <span className="font-semibold text-[var(--foreground)]">{total} g</span>
                {" · "}
              </>
            )}
            {gramosDisponibles - total} g disponibles
          </span>
        </div>
        <div className="h-3 rounded-full bg-[var(--muted)] overflow-hidden relative">
          <div
            className="absolute inset-y-0 left-0 bg-[color-mix(in_oklab,var(--primary)_40%,transparent)] transition-[width] duration-300"
            style={{ width: `${previewPct}%` }}
          />
          <div
            className="absolute inset-y-0 left-0 bg-[var(--primary)] transition-[width] duration-300"
            style={{ width: `${usadoPct}%` }}
          />
        </div>
        <p className="text-xs text-[var(--muted-foreground)] mt-2">
          mínimo {MIN_RETIRO} g por retiro
        </p>
      </section>

      <section>
        <h2 className="text-sm font-medium tracking-wide uppercase text-[var(--muted-foreground)] mb-4">
          Fecha
        </h2>
        <DateSlider
          fechas={proximasFechas}
          fecha={fecha}
          onSelect={setFecha}
        />
        {fecha && (
          <p className="text-xs text-[var(--muted-foreground)] mt-2">
            {fmtFechaLarga(new Date(`${fecha}T12:00:00`))}
          </p>
        )}
        {state?.fieldErrors?.date && (
          <p className="text-sm text-[var(--destructive)] mt-2">
            {state.fieldErrors.date}
          </p>
        )}
      </section>

      <section>
        <h2 className="text-sm font-medium tracking-wide uppercase text-[var(--muted-foreground)] mb-4">
          Horario
        </h2>
        <div className="flex flex-wrap gap-2">
          {horarios.map((h) => {
            const activa = h === horario;
            return (
              <button
                key={h}
                type="button"
                onClick={() => setHorario(h)}
                className={`px-4 py-2 rounded-full border text-sm transition-all ${
                  activa
                    ? "border-[var(--primary)] bg-[var(--primary)] text-white shadow-sm"
                    : "border-[var(--border)] hover:border-[var(--primary)] hover:bg-[var(--muted)]"
                }`}
              >
                {h}
              </button>
            );
          })}
        </div>
        {state?.fieldErrors?.timeSlot && (
          <p className="text-sm text-[var(--destructive)] mt-2">
            {state.fieldErrors.timeSlot}
          </p>
        )}
      </section>

      <section>
        <div className="flex items-baseline justify-between mb-4 flex-wrap gap-2">
          <h2 className="text-2xl font-light tracking-tight">Catálogo</h2>
          {total > 0 && (
            <span className="text-sm font-medium">
              Seleccionado: <span className="text-[var(--primary)]">{total} g</span>
            </span>
          )}
        </div>
        <div className="space-y-5">
          {geneticas.map((g) => (
            <GeneticaShopCard
              key={g.id}
              genetica={g}
              cant={seleccion[g.id] ?? 0}
              onSumar={() => sumar(g.id)}
              onRestar={() => restar(g.id)}
              puedeSumar={puedeSumar && (seleccion[g.id] ?? 0) + STEP <= g.stock}
            />
          ))}
        </div>
        {total > 0 && total < MIN_RETIRO && (
          <p className="text-xs text-[var(--muted-foreground)] mt-2">
            Mínimo {MIN_RETIRO} g por retiro.
          </p>
        )}
        {state?.fieldErrors?.items && (
          <p className="text-sm text-[var(--destructive)] mt-2">
            {state.fieldErrors.items}
          </p>
        )}
      </section>

      <section>
        <label htmlFor="notas" className="label">Notas (opcional)</label>
        <textarea
          id="notas"
          name="notas"
          rows={2}
          className="input"
          placeholder="Alguna observación o preferencia…"
        />
      </section>

      {state?.error && (
        <div className="text-sm text-[var(--destructive)] bg-[color-mix(in_oklab,var(--destructive)_10%,transparent)] p-3 rounded-lg">
          {state.error}
        </div>
      )}

      <div className="h-20" aria-hidden />
      <div className="fixed bottom-4 left-0 right-0 px-4 sm:px-6 z-20 pointer-events-none">
        <div className="max-w-4xl mx-auto pointer-events-auto">
        <button
          type="submit"
          disabled={pending || !valido}
          className="btn btn-primary w-full text-base py-3 shadow-lg inline-flex items-center justify-center gap-2"
        >
          {pending && <SavingSpinner />}
          {pending
            ? "Agendando…"
            : valido
              ? `Agendar retiro · ${total} g`
              : total === 0
                ? "Elegí al menos una variedad"
                : !fecha
                  ? "Elegí una fecha"
                  : !horario
                    ? "Elegí un horario"
                    : `Mínimo ${MIN_RETIRO} g`}
        </button>
        </div>
      </div>
    </form>
  );
}

function DateSlider({
  fechas,
  fecha,
  onSelect,
}: {
  fechas: Date[];
  fecha: string;
  onSelect: (iso: string) => void;
}) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{
    startX: number;
    startScroll: number;
    moved: boolean;
  } | null>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const updateArrows = () => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 2);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
  };

  useEffect(() => {
    updateArrows();
    const el = scrollerRef.current;
    if (!el) return;
    const onScroll = () => updateArrows();
    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", updateArrows);
    return () => {
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", updateArrows);
    };
  }, []);

  const scrollBy = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.max(160, el.clientWidth * 0.6), behavior: "smooth" });
  };

  const onMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = scrollerRef.current;
    if (!el) return;
    dragRef.current = {
      startX: e.clientX,
      startScroll: el.scrollLeft,
      moved: false,
    };
    el.style.cursor = "grabbing";
  };
  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = scrollerRef.current;
    const d = dragRef.current;
    if (!el || !d) return;
    const dx = e.clientX - d.startX;
    if (Math.abs(dx) > 3) d.moved = true;
    el.scrollLeft = d.startScroll - dx;
  };
  const endDrag = () => {
    const el = scrollerRef.current;
    if (!el) return;
    el.style.cursor = "";
    dragRef.current = null;
  };

  return (
    <div className="relative -mx-2">
      <div
        ref={scrollerRef}
        className="flex gap-2 overflow-x-auto no-scrollbar px-2 snap-x cursor-grab select-none"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={endDrag}
        onMouseLeave={endDrag}
      >
        {fechas.map((d) => {
          const iso = toISO(d);
          const activa = iso === fecha;
          return (
            <button
              key={iso}
              type="button"
              onClick={(e) => {
                if (dragRef.current?.moved) {
                  e.preventDefault();
                  return;
                }
                onSelect(iso);
              }}
              className={`shrink-0 snap-start rounded-xl border px-4 py-3 transition-all min-w-[4.5rem] text-center ${
                activa
                  ? "border-[var(--primary)] bg-[var(--primary)] text-white shadow-md scale-[1.02]"
                  : "border-[var(--border)] hover:border-[var(--primary)] hover:bg-[var(--muted)]"
              }`}
            >
              <div className={`text-[0.7rem] uppercase tracking-wide ${activa ? "opacity-90" : "text-[var(--muted-foreground)]"}`}>
                {DIAS[d.getDay()]}
              </div>
              <div className="text-xl font-semibold tabular-nums leading-tight">
                {d.getDate()}
              </div>
              <div className={`text-[0.65rem] ${activa ? "opacity-80" : "text-[var(--muted-foreground)]"}`}>
                {MESES[d.getMonth()].slice(0, 3).toLowerCase()}
              </div>
            </button>
          );
        })}
      </div>
      {canPrev && (
        <button
          type="button"
          onClick={() => scrollBy(-1)}
          aria-label="Fechas anteriores"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-7 h-7 md:w-9 md:h-9 rounded-full bg-[var(--card)]/80 md:bg-[var(--card)] border border-[var(--border)] shadow-sm md:shadow-md flex items-center justify-center text-[var(--muted-foreground)] md:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors z-10 text-sm md:text-base"
        >
          ‹
        </button>
      )}
      {canNext && (
        <button
          type="button"
          onClick={() => scrollBy(1)}
          aria-label="Fechas siguientes"
          className="absolute right-0 top-1/2 -translate-y-1/2 w-7 h-7 md:w-9 md:h-9 rounded-full bg-[var(--card)]/80 md:bg-[var(--card)] border border-[var(--border)] shadow-sm md:shadow-md flex items-center justify-center text-[var(--muted-foreground)] md:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors z-10 text-sm md:text-base"
        >
          ›
        </button>
      )}
    </div>
  );
}

function GeneticaShopCard({
  genetica: g,
  cant,
  onSumar,
  onRestar,
  puedeSumar,
}: {
  genetica: Genetica;
  cant: number;
  onSumar: () => void;
  onRestar: () => void;
  puedeSumar: boolean;
}) {
  const activa = cant > 0;
  const hasPhotos = g.photos.length > 0;
  const n = g.photos.length;
  const multi = n > 1;

  const slides = useMemo(
    () => (multi ? [g.photos[n - 1], ...g.photos, g.photos[0]] : g.photos),
    [g.photos, multi, n],
  );
  const [position, setPosition] = useState(multi ? 1 : 0);
  const [animate, setAnimate] = useState(true);
  const idx = multi ? ((position - 1) % n + n) % n : 0;

  const touchStartX = useRef<number | null>(null);

  const next = () => {
    if (!multi) return;
    setAnimate(true);
    setPosition((p) => p + 1);
  };
  const prev = () => {
    if (!multi) return;
    setAnimate(true);
    setPosition((p) => p - 1);
  };
  const goTo = (i: number) => {
    if (!multi) return;
    setAnimate(true);
    setPosition(i + 1);
  };

  const onTransitionEnd = () => {
    if (!multi) return;
    if (position === n + 1) {
      setAnimate(false);
      setPosition(1);
    } else if (position === 0) {
      setAnimate(false);
      setPosition(n);
    }
  };

  useEffect(() => {
    if (!animate) {
      const id = requestAnimationFrame(() => setAnimate(true));
      return () => cancelAnimationFrame(id);
    }
  }, [animate]);

  return (
    <article
      className={`rounded-2xl border overflow-hidden transition-all ${
        activa
          ? "border-[var(--primary)] bg-[color-mix(in_oklab,var(--primary)_4%,var(--card))] shadow-lg"
          : "border-[var(--border)] bg-[var(--card)] shadow-sm"
      }`}
    >
      <div className="grid md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="relative">
          {hasPhotos ? (
            <div
              className="relative overflow-hidden"
              onTouchStart={(e) => {
                touchStartX.current = e.touches[0].clientX;
              }}
              onTouchEnd={(e) => {
                if (touchStartX.current == null) return;
                const dx = e.changedTouches[0].clientX - touchStartX.current;
                touchStartX.current = null;
                if (Math.abs(dx) < 40) return;
                if (dx < 0) next();
                else prev();
              }}
            >
              <div
                className="flex"
                style={{
                  transform: `translateX(-${position * 100}%)`,
                  transition: animate ? "transform 0.35s ease" : "none",
                }}
                onTransitionEnd={onTransitionEnd}
              >
                {slides.map((src, i) => (
                  <div
                    key={`${src}-${i}`}
                    className="relative aspect-square w-full shrink-0 bg-[var(--muted)]"
                  >
                    <Image
                      src={src}
                      alt={`${g.name} — foto ${i}`}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover"
                      priority={i === 0}
                    />
                  </div>
                ))}
              </div>
              {multi && (
                <>
                  <button
                    type="button"
                    onClick={prev}
                    aria-label="Foto anterior"
                    className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 text-white items-center justify-center hover:bg-black/60 transition-colors"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={next}
                    aria-label="Foto siguiente"
                    className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 text-white items-center justify-center hover:bg-black/60 transition-colors"
                  >
                    ›
                  </button>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {g.photos.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => goTo(i)}
                        aria-label={`Foto ${i + 1}`}
                        className={`w-2 h-2 rounded-full transition-all ${
                          i === idx ? "bg-white scale-125" : "bg-white/50"
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
              {activa && (
                <div className="absolute top-3 right-3 bg-[var(--primary)] text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  {cant} g
                </div>
              )}
            </div>
          ) : (
            <div className="relative aspect-square bg-[var(--muted)] flex items-center justify-center text-sm text-[var(--muted-foreground)]">
              Sin foto
            </div>
          )}
        </div>

        <div className="p-5 sm:p-6 flex flex-col gap-4">
          <div className="flex items-baseline justify-between gap-3 flex-wrap">
            <h3 className="text-2xl font-semibold tracking-tight">{g.name}</h3>
            {g.bank && (
              <span className="text-[0.7rem] uppercase tracking-[0.15em] text-[var(--muted-foreground)]">
                {g.bank}
              </span>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-[7] min-w-0">
              {g.description && (
                <p className="text-sm text-[var(--muted-foreground)] leading-relaxed line-clamp-3">
                  {g.description}
                </p>
              )}
              {g.code && (
                <Link
                  href={`/socio/geneticas/${g.code}`}
                  className="inline-block mt-2 text-sm text-[var(--primary)] hover:underline"
                >
                  Visitar genética →
                </Link>
              )}
            </div>
            <div className="flex-[3] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onRestar}
                disabled={cant === 0}
                aria-label={`Restar 10g de ${g.name}`}
                className="w-11 h-11 rounded-full border border-[var(--border)] hover:border-[var(--primary)] hover:bg-[var(--muted)] disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-xl leading-none transition-colors shrink-0"
              >
                −
              </button>
              <button
                type="button"
                onClick={onSumar}
                disabled={!puedeSumar}
                aria-label={`Sumar 10g de ${g.name}`}
                className="h-11 px-5 rounded-full bg-[var(--primary)] text-white disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1 text-sm font-medium transition-all hover:scale-[1.03] shadow-sm shrink-0"
              >
                <span className="text-lg leading-none">+</span>
                <span>10 g</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
