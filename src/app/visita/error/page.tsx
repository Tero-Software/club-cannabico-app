import { Link } from "@/components/progress/link";

export const metadata = { title: "Acceso de visitante" };

const MESSAGES: Record<string, string> = {
  not_found: "Esta invitación no existe.",
  used: "Esta invitación ya fue usada.",
  expired: "Esta invitación expiró.",
};

export default async function VisitaErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;
  const message =
    (reason && MESSAGES[reason]) ?? "Esta invitación no es válida.";

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="card max-w-md w-full text-center">
        <h1 className="text-2xl font-semibold mb-2">Acceso no disponible</h1>
        <p className="text-[var(--muted-foreground)] mb-4">{message}</p>
        <Link href="/" className="btn btn-secondary">
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
