export function SavingSpinner({ className = "" }: { className?: string }) {
  return (
    <span
      aria-label="Guardando"
      role="status"
      className={`inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin opacity-60 ${className}`}
    />
  );
}
