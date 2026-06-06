import type { Metadata } from "next";
import { PostulacionForm } from "./postulacion-form";

export const metadata: Metadata = {
  title: "Postulación",
  description:
    "Postulate a Club Cannábico App. Asociación civil habilitada por el IRCCA en Uruguay. Revisamos en orden de llegada y respondemos cuando hay cupo.",
  alternates: { canonical: "/postulacion" },
};

export default function PostulacionPage() {
  return (
    <section className="container-page py-12 sm:py-20">
      <div className="max-w-xl">
        <h1 className="text-2xl sm:text-3xl font-light tracking-tight mb-3">
          Postulate para una membresía
        </h1>
        <p className="text-sm sm:text-base text-[var(--muted-foreground)] leading-relaxed mb-8">
          Revisamos las postulaciones en orden de llegada y respondemos por tu
          medio preferido cuando hay cupo disponible.
        </p>
        <PostulacionForm />
      </div>
    </section>
  );
}
