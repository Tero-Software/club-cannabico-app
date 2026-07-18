// Franja por gramos de una membresía. Cada franja fija un precio para una
// cantidad de gramos (fromGrams). El precio por gramo de la franja es
// price / fromGrams.
export type Tier = { fromGrams: number; price: number };

export type ResolvedPlan = {
  id: string;
  name: string;
  tiers: Tier[];
};

// Cómo se cobra un pedido cuya cantidad supera una franja sin llegar a la
// siguiente (ver enum CobroExcedente en el schema).
export type CobroExcedente = "PROPORCIONAL" | "FRANJA_MAS_EXCEDENTE";

// Formato de pesos uruguayos: "$ 1.800" o "$ 1.800,50". Hasta dos decimales,
// que solo se muestran cuando el monto los tiene. Separador de miles con punto,
// estilo es-UY.
export function formatMoney(amount: number): string {
  return `$ ${amount.toLocaleString("es-UY", { maximumFractionDigits: 2 })}`;
}

/**
 * Calcula el monto a cobrar por un retiro según la membresía aplicada y el modo
 * de cobro del club. El precio sale solo de las franjas por gramos.
 *
 * La franja base es la aplicable: la mayor que el retiro ya alcanzó
 * (mayor `fromGrams` ≤ gramos); si no alcanzó ninguna, la primera. Su precio por
 * gramo es `price / fromGrams`.
 *
 * Modo del club:
 * - PROPORCIONAL: todo el pedido al precio por gramo de la franja aplicable.
 *   Ej. franjas 1g=$200, 10g=$1800 (=$180/g), 20g=$3200 (=$160/g); pedir 23 g →
 *   alcanzó la de 20 → 23 × $160 = $3680.
 * - FRANJA_MAS_EXCEDENTE: la franja aplicable a precio fijo, y los gramos que
 *   sobran por encima de ella al precio por gramo de la franja base (la primera).
 *   Mismo ejemplo con base 1g=$200: $3200 (franja de 20) + 3 × $200 = $3800.
 *
 * Devuelve el monto (puede tener decimales) o null si la membresía no tiene
 * franjas con `fromGrams > 0`.
 */
export function computeWithdrawalCharge(
  plan: ResolvedPlan,
  totalGrams: number,
  modo: CobroExcedente,
): number | null {
  // Solo las franjas con fromGrams > 0 definen un precio por gramo.
  const tiers = plan.tiers
    .filter((t) => t.fromGrams > 0)
    .sort((a, b) => a.fromGrams - b.fromGrams);
  if (tiers.length === 0) return null;

  // La mayor franja que el retiro ya alcanzó; si no alcanzó ninguna, la primera.
  const applicable =
    [...tiers].reverse().find((t) => totalGrams >= t.fromGrams) ?? tiers[0];

  if (modo === "FRANJA_MAS_EXCEDENTE") {
    // Franja fija + excedente al precio por gramo de la franja base (la primera).
    const excedente = Math.max(0, totalGrams - applicable.fromGrams);
    const base = tiers[0];
    const precioBasePorGramo = base.price / base.fromGrams;
    return applicable.price + excedente * precioBasePorGramo;
  }

  // PROPORCIONAL: todo el pedido al precio por gramo de la franja aplicable.
  const pricePerGram = applicable.price / applicable.fromGrams;
  return totalGrams * pricePerGram;
}
