"use client";

import { ProgressProvider } from "@bprogress/next/app";
import type { ReactNode } from "react";

// Barra de carga superior estilo Linear: fina, monocroma con el acento, sin
// spinner. Usa @bprogress/next, que intercepta next/link automáticamente.
export function ProgressBar({ children }: { children: ReactNode }) {
  return (
    <ProgressProvider
      height="1px"
      color="var(--accent)"
      options={{ showSpinner: false }}
      shallowRouting
    >
      {children}
    </ProgressProvider>
  );
}
