"use client";

import { useFormStatus } from "react-dom";
import { SavingSpinner } from "@/components/saving-spinner";

export function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn btn-primary inline-flex items-center justify-center gap-2"
    >
      {pending && <SavingSpinner />}
      Entrar
    </button>
  );
}
