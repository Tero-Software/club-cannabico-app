export default function Loading() {
  return (
    <div className="space-y-10">
      <div>
        <div className="h-8 w-48 bg-[var(--muted)] rounded animate-pulse mb-2" />
        <div className="h-4 w-72 bg-[var(--muted)] rounded animate-pulse" />
      </div>
      <section className="space-y-6">
        <div className="h-6 w-32 bg-[var(--muted)] rounded animate-pulse" />
        <div className="card h-72 animate-pulse" />
        <div className="grid md:grid-cols-2 gap-6">
          <div className="card h-64 animate-pulse" />
          <div className="card h-64 animate-pulse" />
        </div>
        <div className="card h-64 animate-pulse" />
      </section>
      <section className="space-y-6">
        <div className="h-6 w-24 bg-[var(--muted)] rounded animate-pulse" />
        <div className="card h-72 animate-pulse" />
        <div className="grid md:grid-cols-2 gap-6">
          <div className="card h-64 animate-pulse" />
          <div className="card h-64 animate-pulse" />
        </div>
      </section>
    </div>
  );
}
