"use client";

import { useEffect, useRef, useState } from "react";
import { SavingSpinner } from "@/components/saving-spinner";

type Props = {
  onConfirm: () => void | Promise<void>;
  children: React.ReactNode;
  confirmLabel?: string;
  pending?: boolean;
  disabled?: boolean;
  className?: string;
  variant?: "solid" | "ghost";
  timeoutMs?: number;
};

export function ConfirmButton({
  onConfirm,
  children,
  confirmLabel = "¿Seguro?",
  pending = false,
  disabled = false,
  className = "",
  variant = "ghost",
  timeoutMs = 3000,
}: Props) {
  const [armed, setArmed] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const click = () => {
    if (!armed) {
      setArmed(true);
      timerRef.current = setTimeout(() => setArmed(false), timeoutMs);
      return;
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    setArmed(false);
    onConfirm();
  };

  const base = "text-sm disabled:opacity-50 transition-colors";
  const armedCls = "btn btn-destructive";
  const restingCls =
    variant === "solid"
      ? "btn btn-destructive"
      : "btn btn-ghost text-[var(--destructive)] hover:bg-[color-mix(in_oklab,var(--destructive)_15%,transparent)]";

  return (
    <button
      type="button"
      disabled={disabled || pending}
      onClick={click}
      className={`${base} ${armed ? armedCls : restingCls} ${className} inline-flex items-center gap-2`}
    >
      {pending && <SavingSpinner />}
      {armed ? confirmLabel : children}
    </button>
  );
}
