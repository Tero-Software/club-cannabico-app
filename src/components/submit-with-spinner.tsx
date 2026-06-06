"use client";

import { useFormStatus } from "react-dom";
import { SavingSpinner } from "@/components/saving-spinner";

export function SubmitWithSpinner({
  children,
  className = "",
  disabled,
}: {
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className={`${className} inline-flex items-center justify-center gap-2`}
    >
      {pending && <SavingSpinner />}
      {children}
    </button>
  );
}
