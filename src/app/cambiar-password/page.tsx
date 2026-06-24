import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { CambiarPasswordForm } from "./cambiar-password-form";

export const metadata = { title: "Cambiar contraseña" };

export default async function CambiarPasswordPage() {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-[var(--border)] bg-[var(--card)]">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <Logo href="/cambiar-password" />
          <ThemeToggle />
        </div>
      </header>
      <main className="flex-1 max-w-md w-full mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold mb-2">Cambiar contraseña</h1>
        <p className="text-[var(--muted-foreground)] mb-6 text-sm">
          Estás usando la contraseña genérica. Cambiala antes de continuar.
        </p>
        <CambiarPasswordForm />
      </main>
    </div>
  );
}
