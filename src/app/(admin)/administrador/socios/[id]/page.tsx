import { notFound } from "next/navigation";
import { Link } from "@/components/progress/link";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { DatosEditor } from "./datos-editor";
import { ToggleActivoSection } from "./toggle-activo";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { id }, select: { name: true } });
  return { title: user ? `${user.name} — Socios` : "Socio" };
}

export default async function SocioDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ edit?: string }>;
}) {
  const session = await auth();
  if (!can(session, "socios:manage")) notFound();

  const { id } = await params;
  const { edit } = await searchParams;
  const initialEditing = edit === "1";
  const tenantId = session!.user.tenantId;

  const socio = await prisma.user.findFirst({
    where: { id, tenantId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      active: true,
      createdAt: true,
      lastLoginAt: true,
      failedLoginCount: true,
      lockedUntil: true,
    },
  });

  if (!socio) notFound();

  const logs = await prisma.auditLog.findMany({
    where: { userId: id, tenantId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const loginLogs = logs.filter((l) =>
    l.action.startsWith("login."),
  );
  const otherLogs = logs.filter((l) => !l.action.startsWith("login."));

  const fmt = new Intl.DateTimeFormat("es-UY", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div>
      <Link
        href="/administrador/socios"
        className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
      >
        ← Socios
      </Link>

      <div className="mt-4 mb-8">
        <h1 className="text-3xl font-bold mb-1">{socio.name}</h1>
        <p className="text-[var(--muted-foreground)]">{socio.email}</p>
      </div>

      <DatosEditor
        socio={{
          id: socio.id,
          name: socio.name,
          email: socio.email,
          phone: socio.phone,
        }}
        initialEditing={initialEditing}
      />

      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <div className="card">
          <div className="text-xs text-[var(--muted-foreground)] mb-1">Estado</div>
          <span className={socio.active ? "badge badge-aprobado" : "badge badge-rechazado"}>
            {socio.active ? "Activo" : "Inactivo"}
          </span>
        </div>
        <div className="card">
          <div className="text-xs text-[var(--muted-foreground)] mb-1">Último login</div>
          <div className="font-medium">
            {socio.lastLoginAt ? fmt.format(socio.lastLoginAt) : "Nunca"}
          </div>
        </div>
        <div className="card">
          <div className="text-xs text-[var(--muted-foreground)] mb-1">Intentos fallidos</div>
          <div className="font-medium">
            {socio.failedLoginCount}
            {socio.lockedUntil && socio.lockedUntil > new Date() && (
              <span className="text-[var(--destructive)] text-xs ml-2">
                Bloqueado hasta {fmt.format(socio.lockedUntil)}
              </span>
            )}
          </div>
        </div>
      </div>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Historial de logins</h2>
        {loginLogs.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)]">Sin registros.</p>
        ) : (
          <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[var(--muted)] text-left">
                  <tr>
                    <th className="px-4 py-3 font-medium">Fecha</th>
                    <th className="px-4 py-3 font-medium">Acción</th>
                    <th className="px-4 py-3 font-medium">IP</th>
                  </tr>
                </thead>
                <tbody>
                  {loginLogs.map((l) => (
                    <tr key={l.id} className="border-t border-[var(--border)]">
                      <td className="px-4 py-2.5 text-[var(--muted-foreground)] whitespace-nowrap">
                        {fmt.format(l.createdAt)}
                      </td>
                      <td className="px-4 py-2.5">
                        <ActionBadge action={l.action} />
                      </td>
                      <td className="px-4 py-2.5 font-mono text-xs text-[var(--muted-foreground)]">
                        {l.ip || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {otherLogs.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold mb-4">Otra actividad</h2>
          <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[var(--muted)] text-left">
                  <tr>
                    <th className="px-4 py-3 font-medium">Fecha</th>
                    <th className="px-4 py-3 font-medium">Acción</th>
                    <th className="px-4 py-3 font-medium">Entidad</th>
                    <th className="px-4 py-3 font-medium">IP</th>
                  </tr>
                </thead>
                <tbody>
                  {otherLogs.map((l) => (
                    <tr key={l.id} className="border-t border-[var(--border)]">
                      <td className="px-4 py-2.5 text-[var(--muted-foreground)] whitespace-nowrap">
                        {fmt.format(l.createdAt)}
                      </td>
                      <td className="px-4 py-2.5">
                        <ActionBadge action={l.action} />
                      </td>
                      <td className="px-4 py-2.5 text-[var(--muted-foreground)]">
                        {l.entity ?? "—"}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-xs text-[var(--muted-foreground)]">
                        {l.ip || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      <ToggleActivoSection id={socio.id} active={socio.active} />
    </div>
  );
}

const ACTION_LABELS: Record<string, { label: string; className: string }> = {
  "login.success": { label: "Login exitoso", className: "badge badge-aprobado" },
  "login.failed": { label: "Login fallido", className: "badge badge-rechazado" },
  "login.locked": { label: "Cuenta bloqueada", className: "badge badge-rechazado" },
  "password.change.success": { label: "Cambio de contraseña", className: "badge badge-aprobado" },
  "password.change.failed": { label: "Cambio fallido", className: "badge badge-rechazado" },
};

function ActionBadge({ action }: { action: string }) {
  const info = ACTION_LABELS[action];
  if (info) return <span className={info.className}>{info.label}</span>;
  return <span className="badge badge-completado">{action}</span>;
}
