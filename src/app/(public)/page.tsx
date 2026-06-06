const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "Club Cannábico App";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://clubcannabico.app";

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: appName,
  url: siteUrl,
  description: `Asociación civil habilitada por el IRCCA bajo Resolución DE-127/2022, en el marco de la Ley 19.172 y el Decreto 120/014 (Uruguay).`,
  address: {
    "@type": "PostalAddress",
    addressCountry: "UY",
  },
  areaServed: {
    "@type": "Country",
    name: "Uruguay",
  },
  inLanguage: "es-UY",
};

export default function LandingPage() {
  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />

      <section className="max-w-5xl mx-auto px-5 sm:px-6 py-16 sm:py-24 lg:py-32">
        <div className="max-w-4xl mx-auto">
          <span className="text-[0.65rem] sm:text-xs tracking-[0.3em] text-[var(--muted-foreground)] mb-6 sm:mb-8 block">
            URUGUAY
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-light leading-[1.15] tracking-tight text-[var(--foreground)] text-balance">
            {appName}
          </h1>
        </div>
      </section>

    </div>
  );
}
