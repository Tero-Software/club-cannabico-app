import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PerfilForm } from "./perfil-form";

export const metadata = { title: "Mi perfil" };

export default async function PerfilPage() {
  const session = await auth();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, phone: true, createdAt: true, role: true },
  });

  if (!user) return null;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Mi perfil</h1>
      <p className="text-[var(--muted-foreground)] mb-6">
        Actualizá tus datos personales.
      </p>
      <div className="card mb-4">
        <PerfilForm
          initialName={user.name}
          initialPhone={user.phone ?? ""}
          email={user.email}
        />
      </div>
      <div className="card">
        <h2 className="font-semibold mb-3">Cuenta</h2>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <dt className="text-[var(--muted-foreground)]">Rol</dt>
          <dd>
            {user.role === "ADMIN"
              ? "Administrador"
              : user.role === "VISITANTE"
                ? "Visitante"
                : "Socio"}
          </dd>
          <dt className="text-[var(--muted-foreground)]">Miembro desde</dt>
          <dd>{user.createdAt.toLocaleDateString("es-AR")}</dd>
        </dl>
      </div>
    </div>
  );
}
