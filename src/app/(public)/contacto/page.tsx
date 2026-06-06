import type { Metadata } from "next";
import { PageHero, Section } from "@/components/institutional";
import { ContactForm } from "@/components/contact-form";

function WhatsAppIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="shrink-0"
    >
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

export const metadata: Metadata = {
  title: "Contacto | Escribinos a Club Cannábico App",
  description:
    "Escribinos para consultas sobre clubes cannábicos en Uruguay, el proceso de postulación o el marco regulatorio. Te respondemos por el medio que indiques.",
  alternates: { canonical: "/contacto" },
};

export default function ContactoPage() {
  return (
    <article>
      <PageHero
        eyebrow="CONTACTO"
        title="Escribinos"
        intro="¿Tenés una consulta?"
      />

      <Section>
        <div className="space-y-3 mb-12">
          <p className="text-base sm:text-lg text-[var(--muted-foreground)] leading-relaxed font-light">
            Podés escribirnos directamente por WhatsApp.
          </p>
          <a
            href="https://wa.me/59891530062"
            target="_blank"
            rel="noreferrer"
            className="card hover:border-[var(--primary)] transition-colors flex items-center gap-4 p-5"
          >
            <WhatsAppIcon />
            <div className="font-medium text-base sm:text-lg">WhatsApp</div>
          </a>
        </div>

        <div className="border-t border-[var(--border)] pt-10">
          <p className="text-base sm:text-lg text-[var(--muted-foreground)] leading-relaxed font-light mb-6">
            O dejanos un mensaje y te respondemos por el medio que indiques.
          </p>
          <ContactForm />
        </div>
      </Section>
    </article>
  );
}
