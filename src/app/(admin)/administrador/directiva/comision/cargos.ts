// Cargos de la comisión directiva y sindicatura, en orden de jerarquía, con su
// etiqueta para mostrar. El valor coincide con el enum CargoDirectiva de Prisma.
export const CARGOS = [
  { value: "PRESIDENTE", label: "Presidente" },
  { value: "SECRETARIO", label: "Secretario" },
  { value: "TESORERO", label: "Tesorero" },
  { value: "SUPLENTE_1", label: "1er Suplente" },
  { value: "SUPLENTE_2", label: "2º Suplente" },
  { value: "SUPLENTE_3", label: "3er Suplente" },
  { value: "SINDICO", label: "Síndico" },
  { value: "SINDICO_SUPLENTE", label: "Síndico suplente" },
] as const;

export type Cargo = (typeof CARGOS)[number]["value"];

export function cargoLabel(value: string): string {
  return CARGOS.find((c) => c.value === value)?.label ?? value;
}
