"use client";

export function PrintTrigger() {
  return (
    <button type="button" className="btn btn-primary text-sm" onClick={() => window.print()}>
      Imprimir
    </button>
  );
}
