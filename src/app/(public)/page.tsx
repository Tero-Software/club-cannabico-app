import { notFound } from "next/navigation";
import { getCurrentTenant } from "@/lib/tenant";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://clubcannabico.app";

export default async function ClubHomePage() {
  // Portada pública del club. Todo el contenido sale del tenant resuelto del
  // host (lo inyecta el middleware): nada hardcodeado ni leído de env. Esta es
  // la base genérica sobre la que después montamos un editor de landing.
  // Sin tenant no hay club: el apex se reescribe a /producto en el middleware,
  // así que llegar acá sin tenant es una ruta inexistente.
  const tenant = await getCurrentTenant();
  if (!tenant || !tenant.active) notFound();

  const { name, city, tagline, description } = tenant;

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name,
    url: siteUrl,
    ...(description ? { description } : {}),
    address: {
      "@type": "PostalAddress",
      addressCountry: "UY",
      ...(city ? { addressLocality: city } : {}),
    },
    areaServed: { "@type": "Country", name: "Uruguay" },
    inLanguage: "es-UY",
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />

      <section className="container-page pt-20 pb-12 sm:pt-28 sm:pb-16 lg:pt-36">
        <div className="max-w-3xl">
          <span className="text-[0.65rem] sm:text-xs tracking-[0.3em] text-[var(--muted-foreground)] mb-6 sm:mb-8 block">
            {city ? city.toUpperCase() : "URUGUAY"}
          </span>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-light leading-[1.15] tracking-tight text-[var(--foreground)] text-balance">
            {name}
          </h1>

          {tagline ? (
            <p className="mt-6 text-lg sm:text-xl text-[var(--muted-foreground)] font-light leading-relaxed text-balance">
              {tagline}
            </p>
          ) : null}

          {description ? (
            <p className="mt-8 max-w-2xl text-base text-[var(--muted-foreground)] leading-relaxed font-light whitespace-pre-line">
              {description}
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
