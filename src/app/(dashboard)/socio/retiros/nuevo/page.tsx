import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { getClubConfig } from "@/lib/config";
import { NuevoRetiroForm } from "./nuevo-form";

export const metadata = { title: "Agendar retiro" };

export default async function NuevoRetiroPage() {
  const session = await auth();
  const tenantId = session!.user.tenantId;
  const config = await getClubConfig(tenantId);
  // Derive available strains from active containers with stock
  const containerItems = await prisma.containerItem.findMany({
    where: {
      tenantId,
      container: { active: true },
      currentWeight: { gt: 0 },
    },
    include: { strain: true, reservations: true },
  });

  const strainMap = new Map<string, { strain: NonNullable<typeof containerItems[number]["strain"]>; stock: number }>();
  for (const item of containerItems) {
    if (!item.strain) continue;
    const reserved = item.reservations.reduce((s, r) => s + r.amount, 0);
    const free = Math.max(0, item.currentWeight - reserved);
    if (free <= 0) continue;
    const existing = strainMap.get(item.strain.id);
    if (existing) {
      existing.stock += free;
    } else {
      strainMap.set(item.strain.id, { strain: item.strain, stock: free });
    }
  }

  const geneticas = [...strainMap.values()]
    .sort((a, b) => a.strain.name.localeCompare(b.strain.name));

  if (geneticas.length === 0) {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-2">Agendar retiro</h1>
        <div className="card text-center text-[var(--muted-foreground)] py-12 mt-6">
          No hay genéticas disponibles por el momento.
        </div>
      </div>
    );
  }

  const now = new Date();
  const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1);
  const inicioMesSiguiente = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const retirosMes = await prisma.withdrawal.findMany({
    where: {
      tenantId,
      userId: session!.user.id,
      date: { gte: inicioMes, lt: inicioMesSiguiente },
      status: { notIn: ["REJECTED", "CANCELLED"] },
    },
    include: { items: true },
  });
  const gramosUsados = retirosMes.reduce(
    (s, r) => s + r.items.reduce((ss, i) => ss + i.amount, 0),
    0,
  );
  const gramosDisponibles = Math.max(0, config.maxGramosMes - gramosUsados);

  return (
    <div>
      <div className="mb-8">
        <span className="text-[0.65rem] uppercase tracking-[0.3em] text-[var(--muted-foreground)]">
          Nuevo retiro
        </span>
        <h1 className="text-4xl sm:text-5xl font-light tracking-tight mt-2 mb-2">
          Armá tu pedido
        </h1>
        <p className="text-[var(--muted-foreground)] text-base font-light max-w-xl">
          Elegí el día, la hora y las variedades.
        </p>
      </div>
      <NuevoRetiroForm
        geneticas={geneticas.map((g) => ({
          id: g.strain.id,
          code: g.strain.code,
          name: g.strain.name,
          bank: g.strain.bank,
          description: g.strain.description,
          photos: g.strain.photos,
          stock: g.stock,
        }))}
        horarios={config.horarios}
        gramosDisponibles={gramosDisponibles}
        maxGramos={config.maxGramosMes}
      />
    </div>
  );
}
