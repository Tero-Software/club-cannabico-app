import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { ContainersPanel } from "./containers-panel";
import { AcopioStats } from "./acopio-stats";
import type { Container } from "./containers-list";

export const metadata = { title: "Acopio (administrador)" };

export default async function ContainersPage() {
  const session = await auth();
  if (!can(session, "containers:manage")) notFound();

  const tenantId = session!.user.tenantId;
  const [containersRaw, strains] = await Promise.all([
    prisma.container.findMany({
      // Acopio muestra contenedores ya en acopio: los sueltos (sin cosecha) y los
      // de cosechas declaradas. Los de cosechas en staging viven en Cosecha.
      where: {
        tenantId,
        OR: [{ harvestId: null }, { harvest: { declarada: true } }],
      },
      orderBy: { number: "asc" },
      include: {
        harvest: { select: { date: true } },
        items: {
          include: {
            strain: { select: { id: true, name: true } },
            movements: { orderBy: { createdAt: "desc" }, take: 20 },
            reservations: { select: { amount: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    }),
    prisma.strain.findMany({
      where: { tenantId },
      orderBy: { name: "asc" },
      select: { id: true, name: true, photos: true, description: true },
    }),
  ]);

  const containers: Container[] = containersRaw.map((c) => ({
    id: c.id,
    number: c.number,
    notes: c.notes,
    // Bloque en acopio: uno por cosecha (rotulado con su fecha). Los sueltos
    // (sin cosecha) van todos juntos en un bloque al final.
    harvestId: c.harvestId,
    harvestDate: c.harvest?.date.toISOString() ?? null,
    items: c.items.map((item) => ({
      id: item.id,
      strainName: item.strain?.name ?? "Sin genética",
      strainId: item.strain?.id ?? null,
      plantNumber: item.plantNumber,
      initialWeight: item.initialWeight,
      currentWeight: item.currentWeight,
      active: item.active,
      reservedAmount: item.reservations.reduce((s, r) => s + r.amount, 0),
      movements: item.movements.map((m) => ({
        id: m.id,
        type: m.type,
        amount: m.amount,
        notes: m.notes,
        createdAt: m.createdAt.toISOString(),
      })),
    })),
  }));

  // Totals over ALL containers (active flag is for the socio catalog only)
  let totalInitial = 0;
  let totalCurrent = 0;
  for (const c of containers) {
    for (const item of c.items) {
      totalInitial += item.initialWeight;
      totalCurrent += item.currentWeight;
    }
  }
  // Genéticas distintas disponibles (por strainId): las que tienen al menos un
  // item con existencia (currentWeight > 0), activo o no. Una genética repartida
  // en varios contenedores cuenta una vez.
  const strainsActivas = new Set<string>();
  for (const c of containers) {
    for (const item of c.items) {
      if (item.strainId && item.currentWeight > 0) strainsActivas.add(item.strainId);
    }
  }
  const activeCount = strainsActivas.size;

  // Detalle por cosecha: stock disponible (currentWeight) y retirado
  // (initialWeight - currentWeight) de cada cosecha con producto en existencia.
  // Se agrupa por harvestId; los sueltos (sin cosecha) van bajo la clave "".
  const porCosecha = new Map<
    string,
    { harvestDate: string | null; stock: number; retirado: number }
  >();
  for (const c of containers) {
    const key = c.harvestId ?? "";
    const acc =
      porCosecha.get(key) ??
      { harvestDate: c.harvestDate, stock: 0, retirado: 0 };
    for (const item of c.items) {
      acc.stock += item.currentWeight;
      acc.retirado += item.initialWeight - item.currentWeight;
    }
    porCosecha.set(key, acc);
  }
  const cosechaStock = [...porCosecha.entries()]
    .map(([id, v]) => ({ id, ...v }))
    .filter((v) => v.stock > 0)
    .sort((a, b) => (b.harvestDate ?? "").localeCompare(a.harvestDate ?? ""));
  const cosechaRetiro = [...porCosecha.entries()]
    .map(([id, v]) => ({ id, ...v }))
    .filter((v) => v.retirado > 0)
    .sort((a, b) => (b.harvestDate ?? "").localeCompare(a.harvestDate ?? ""));

  // Detalle por genética: lo disponible (currentWeight) de cada una con foto.
  const porGenetica = new Map<
    string,
    { name: string; photo: string | null; description: string | null; disponible: number }
  >();
  for (const s of strains) {
    porGenetica.set(s.id, {
      name: s.name,
      photo: s.photos[0] ?? null,
      description: s.description,
      disponible: 0,
    });
  }
  for (const c of containers) {
    for (const item of c.items) {
      if (!item.strainId) continue;
      const acc = porGenetica.get(item.strainId);
      if (acc) acc.disponible += item.currentWeight;
    }
  }
  const geneticaStock = [...porGenetica.entries()]
    .map(([id, v]) => ({ id, ...v }))
    .filter((v) => v.disponible > 0)
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-8">
      <ContainersPanel
        containers={containers}
        strains={strains}
        stats={
          <AcopioStats
            stockTotal={totalCurrent}
            geneticasCount={activeCount}
            cosechaStock={cosechaStock}
            geneticaStock={geneticaStock}
          />
        }
      />
    </div>
  );
}
