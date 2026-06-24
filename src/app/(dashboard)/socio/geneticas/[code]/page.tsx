import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PhotoCarousel } from "@/components/photo-carousel";
import { requireTenant } from "@/lib/tenant";

export const metadata = { title: "Genética" };

type Params = Promise<{ code: string }>;

export default async function GeneticaPage({ params }: { params: Params }) {
  const { code } = await params;
  const tenant = await requireTenant();
  const g = await prisma.strain.findUnique({
    where: { tenantId_code: { tenantId: tenant.id, code } },
  });
  if (!g) notFound();

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-32 sm:pb-24">
      <div>
        <Link
          href="/socio/retiros/nuevo"
          className="text-sm text-[var(--muted-foreground)] hover:underline"
        >
          ← Volver al catálogo
        </Link>
      </div>

      <PhotoCarousel photos={g.photos} alt={g.name} priority />

      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <h1 className="text-3xl font-semibold tracking-tight">{g.name}</h1>
        {g.bank && (
          <span className="text-[0.7rem] uppercase tracking-[0.15em] text-[var(--muted-foreground)]">
            {g.bank}
          </span>
        )}
      </div>

      {g.description && (
        <p className="text-base text-[var(--muted-foreground)] leading-relaxed whitespace-pre-line">
          {g.description}
        </p>
      )}

      {g.sourceUrl && (
        <div>
          <a
            href={g.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-block text-sm text-[var(--primary)] hover:underline"
          >
            Ver en BSF →
          </a>
        </div>
      )}
    </div>
  );
}
