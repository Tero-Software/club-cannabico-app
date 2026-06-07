import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { can } from "@/lib/permissions";
import { AdminCard } from "./administrador-card";
import { PromoteForm } from "./promote-form";

export const metadata = { title: "Administradores" };

export default async function AdminAdminsPage() {
  const session = await auth();
  if (!can(session, "admins:manage")) notFound();

  const tenantId = session!.user.tenantId;
  const [admins, socios] = await Promise.all([
    prisma.user.findMany({
      where: { tenantId, role: "ADMIN" },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        permissions: true,
        isOwner: true,
      },
    }),
    prisma.user.findMany({
      where: { tenantId, role: "MEMBER", active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true },
    }),
  ]);

  const viewer = admins.find((a) => a.id === session!.user.id);
  const viewerIsOwner = !!viewer?.isOwner;
  const viewerPermissions = viewer?.permissions ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-1">Administradores</h1>
        <p className="text-[var(--muted-foreground)] text-sm">
          Asigná o quitá permisos por administrador.
        </p>
      </div>

      <section>
        <h2 className="text-xl font-semibold mb-4">
          Administradores actuales ({admins.length})
        </h2>
        <div className="space-y-3">
          {admins.map((a) => (
            <AdminCard
              key={a.id}
              id={a.id}
              name={a.name}
              email={a.email}
              permissions={a.permissions}
              esTuyo={a.id === session!.user.id}
              isOwner={a.isOwner}
              viewerIsOwner={viewerIsOwner}
              viewerPermissions={viewerPermissions}
            />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Promover socio a admin</h2>
        {socios.length === 0 ? (
          <div className="card text-center text-[var(--muted-foreground)] py-8">
            No hay socios activos.
          </div>
        ) : (
          <PromoteForm socios={socios} />
        )}
      </section>
    </div>
  );
}
