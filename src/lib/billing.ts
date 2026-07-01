// Franja por gramos de una membresía. Cada franja fija un precio de referencia
// para una cantidad de gramos (fromGrams), del que se deriva un precio por gramo
// (price / fromGrams). El cobro es proporcional a los gramos retirados.
export type Tier = { fromGrams: number; price: number };

export type ResolvedPlan = {
  id: string;
  name: string;
  monthlyPrice: number;
  tiers: Tier[];
};

// Formato de pesos uruguayos: "$ 1.800" o "$ 1.800,50". Hasta dos decimales,
// que solo se muestran cuando el monto los tiene. Separador de miles con punto,
// estilo es-UY.
export function formatMoney(amount: number): string {
  return `$ ${amount.toLocaleString("es-UY", { maximumFractionDigits: 2 })}`;
}

/**
 * Calcula el monto a cobrar por un retiro según la membresía aplicada.
 *
 * Una membresía tiene una cuota mensual (la completa) y franjas por gramos:
 * - Si el retiro alcanza el cupo máximo mensual del club, se cobra la cuota
 *   mensual completa (el socio retiró todo el mes).
 * - Si retira menos, el cobro es proporcional: gramos × precio por gramo de la
 *   franja aplicable. La franja aplicable es la mayor que el retiro ya superó
 *   (mayor `fromGrams` ≤ gramos); si no superó ninguna, se usa la primera franja
 *   (siempre hay un precio por gramo). El precio por gramo de una franja es
 *   `price / fromGrams`. Ej.: franjas 1g=$200, 10g=$1800 (=$180/g), 20g=$3200
 *   (=$160/g); retirar 15 g → superó la de 10 g → 15 × $180 = $2700.
 *
 * Devuelve el monto (puede tener decimales) o null si la membresía no tiene
 * franjas con `fromGrams > 0` para derivar un precio por gramo.
 */
export function computeWithdrawalCharge(
  plan: ResolvedPlan,
  totalGrams: number,
  monthlyCapGrams: number,
): number | null {
  if (totalGrams >= monthlyCapGrams) {
    return plan.monthlyPrice;
  }

  // Solo las franjas con fromGrams > 0 definen un precio por gramo.
  const tiers = plan.tiers
    .filter((t) => t.fromGrams > 0)
    .sort((a, b) => a.fromGrams - b.fromGrams);
  if (tiers.length === 0) return null;

  // La mayor franja que el retiro ya superó; si no superó ninguna, la primera.
  const applicable =
    [...tiers].reverse().find((t) => totalGrams >= t.fromGrams) ?? tiers[0];

  const pricePerGram = applicable.price / applicable.fromGrams;
  return totalGrams * pricePerGram;
}
