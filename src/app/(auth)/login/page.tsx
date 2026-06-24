import Link from "next/link";
import { LoginForm } from "./login-form";

export const metadata = { title: "Ingresar" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ cambio?: string }>;
}) {
  const { cambio } = await searchParams;
  return (
    <div className="w-full max-w-md">
      <div className="card">
        <h1 className="text-2xl font-bold mb-1">Ingresar</h1>
        <p className="text-sm text-[var(--muted-foreground)] mb-6">
          Accedé al panel de socios.
        </p>
        {cambio === "ok" && (
          <div className="mb-4 p-3 rounded-md bg-[var(--success)]/10 text-sm text-[var(--success)]">
            Contraseña actualizada. Ingresá con la nueva.
          </div>
        )}
        <LoginForm />
      </div>
      <p className="text-center text-sm text-[var(--muted-foreground)] mt-4">
        ¿Querés ser socio?{" "}
        <Link
          href="/postulacion"
          className="text-[var(--primary)] font-medium"
        >
          Postulate
        </Link>
      </p>
    </div>
  );
}
