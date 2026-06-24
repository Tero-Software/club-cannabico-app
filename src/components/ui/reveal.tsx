"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Scroll-reveal estilo Linear. Envuelve contenido que aparece (fade + leve
 * subida) cuando entra al viewport. El estilo vive en globals.css
 * ([data-reveal] / [data-revealed]); acá solo se observa la entrada.
 *
 * `delay` (ms) escalona varios elementos en una misma sección.
 * `as` permite renderizar otro tag (por defecto div).
 */
export function Reveal({
  children,
  delay = 0,
  className = "",
  as: Tag = "div",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  as?: React.ElementType;
}) {
  const ref = useRef<HTMLElement>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || revealed) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          obs.disconnect();
        }
      },
      // Dispara apenas el bloque asoma al viewport.
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [revealed]);

  return (
    <Tag
      ref={ref}
      data-reveal=""
      {...(revealed ? { "data-revealed": "" } : {})}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      className={className}
    >
      {children}
    </Tag>
  );
}
