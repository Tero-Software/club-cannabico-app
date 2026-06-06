export default function Loading() {
  return (
    <div className="container-page py-8 space-y-6">
      <div className="h-8 w-48 bg-[var(--muted)] rounded animate-pulse" />
      <div className="card h-64 animate-pulse" />
      <div className="grid md:grid-cols-2 gap-6">
        <div className="card h-40 animate-pulse" />
        <div className="card h-40 animate-pulse" />
      </div>
    </div>
  );
}
