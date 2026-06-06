export function BadgeCount({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span
      aria-label={`${count} pendiente${count === 1 ? "" : "s"}`}
      title={`${count} pendiente${count === 1 ? "" : "s"}`}
      className="inline-block align-middle ml-2 w-1.5 h-1.5 rounded-full bg-[var(--accent-red)] pointer-events-none dot-pulse"
    />
  );
}
