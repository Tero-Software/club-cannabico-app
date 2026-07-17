import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { DatosEditor } from "./datos-editor";
import { ToggleActivoSection } from "./toggle-activo";
import { PlanSelector } from "./plan-selector";
import { DataTable, type Column } from "@/components/ui/data-table";

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
      membershipPlanId: true,
    },
  });

  if (!socio) notFound();

  const [plans, defaultPlan] = await Promise.all([
    prisma.membershipPlan.findMany({
      where: { tenantId, active: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.membershipPlan.findFirst({
      where: { tenantId, isDefault: true, active: true },
      select: { name: true },
    }),
  ]);

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

      <PlanSelector
        socioId={socio.id}
        planId={socio.membershipPlanId}
        defaultPlanName={defaultPlan?.name ?? null}
        plans={plans}
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
          <DataTable
            rows={loginLogs}
            getRowKey={(l) => l.id}
            columns={
              [
                {
                  label: "Fecha",
                  muted: true,
                  cellClassName: "whitespace-nowrap",
                  cell: (l) => fmt.format(l.createdAt),
                },
                { label: "Acción", cell: (l) => <ActionBadge action={l.action} /> },
                {
                  label: "IP",
                  muted: true,
                  cellClassName: "font-mono text-xs",
                  cell: (l) => l.ip || "—",
                },
              ] as Column<(typeof loginLogs)[number]>[]
            }
          />
        )}
      </section>

      {otherLogs.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold mb-4">Otra actividad</h2>
          <DataTable
            rows={otherLogs}
            getRowKey={(l) => l.id}
            columns={
              [
                {
                  label: "Fecha",
                  muted: true,
                  cellClassName: "whitespace-nowrap",
                  cell: (l) => fmt.format(l.createdAt),
                },
                { label: "Acción", cell: (l) => <ActionBadge action={l.action} /> },
                { label: "Entidad", muted: true, cell: (l) => l.entity ?? "—" },
                {
                  label: "IP",
                  muted: true,
                  cellClassName: "font-mono text-xs",
                  cell: (l) => l.ip || "—",
                },
              ] as Column<(typeof otherLogs)[number]>[]
            }
          />
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
