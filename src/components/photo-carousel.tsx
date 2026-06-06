"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

export function PhotoCarousel({
  photos,
  alt,
  priority = false,
}: {
  photos: string[];
  alt: string;
  priority?: boolean;
}) {
  const n = photos.length;
  const multi = n > 1;

  const slides = useMemo(
    () => (multi ? [photos[n - 1], ...photos, photos[0]] : photos),
    [photos, multi, n],
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

  if (n === 0) {
    return (
      <div className="relative aspect-square bg-[var(--muted)] flex items-center justify-center text-sm text-[var(--muted-foreground)] rounded-2xl">
        Sin foto
      </div>
    );
  }

  return (
    <div
      className="relative overflow-hidden rounded-2xl"
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
              alt={`${alt} — foto ${i}`}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
              priority={priority && i === 0}
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
            {photos.map((_, i) => (
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
    </div>
  );
}
