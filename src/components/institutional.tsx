import Link from "next/link";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://clubcannabico.app";

export function Breadcrumbs({
  items,
}: {
  items: { name: string; path: string }[];
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: `${siteUrl}/` },
      ...items.map((it, i) => ({
        "@type": "ListItem",
        position: i + 2,
        name: it.name,
        item: `${siteUrl}${it.path}`,
      })),
    ],
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function Eyebrow({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`mb-6 sm:mb-8 ${className}`}>
      <div className="h-px w-10 bg-[var(--border)] mb-4" />
      <span className="text-[0.78rem] sm:text-[0.9rem] tracking-[0.3em] text-[var(--muted-foreground)] block">
        {children}
      </span>
    </div>
  );
}

export function PageHero({
  eyebrow,
  title,
  intro,
}: {
  eyebrow: string;
  title: string;
  intro?: React.ReactNode;
}) {
  return (
    <section className="container-page pt-16 pb-6 sm:pt-24 sm:pb-10 lg:pt-32 lg:pb-12">
      <span className="text-[0.65rem] sm:text-xs tracking-[0.3em] text-[var(--muted-foreground)] mb-6 sm:mb-8 block">
        {eyebrow}
      </span>
      <h1 className="text-3xl sm:text-4xl lg:text-5xl font-light leading-[1.15] tracking-tight text-[var(--foreground)] text-balance">
        {title}
      </h1>
      {intro && (
        <p className="mt-8 text-base sm:text-lg text-[var(--muted-foreground)] leading-relaxed font-light">
          {intro}
        </p>
      )}
    </section>
  );
}

export function Section({
  eyebrow,
  children,
}: {
  eyebrow?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="py-10 sm:py-14">
      <div className="container-page">
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        {children}
      </div>
    </section>
  );
}

export function P({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-base sm:text-lg text-[var(--muted-foreground)] leading-relaxed font-light mb-5 last:mb-0">
      {children}
    </p>
  );
}

export function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-2xl sm:text-3xl font-light leading-tight tracking-tight text-[var(--foreground)] mb-5">
      {children}
    </h2>
  );
}

export function H3({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xl sm:text-2xl font-light leading-snug text-[var(--foreground)] mb-4 mt-8">
      {children}
    </h3>
  );
}

export function ExternalLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="underline underline-offset-4 decoration-[var(--border)] hover:decoration-[var(--foreground)] transition-colors"
    >
      {children}
    </a>
  );
}

export function InternalLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="underline underline-offset-4 decoration-[var(--border)] hover:decoration-[var(--foreground)] transition-colors"
    >
      {children}
    </Link>
  );
}

export function UL({ children }: { children: React.ReactNode }) {
  return (
    <ul className="text-base sm:text-lg text-[var(--muted-foreground)] leading-relaxed font-light list-disc pl-6 mb-5 space-y-2 marker:text-[var(--border)]">
      {children}
    </ul>
  );
}

export function OL({ children }: { children: React.ReactNode }) {
  return (
    <ol className="text-base sm:text-lg text-[var(--muted-foreground)] leading-relaxed font-light list-decimal pl-6 mb-5 space-y-2 marker:text-[var(--muted-foreground)]">
      {children}
    </ol>
  );
}
