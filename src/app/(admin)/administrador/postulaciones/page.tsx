import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import {
  AprobarButton,
  RechazarForm,
  EliminarForm,
} from "./row-actions";

export const metadata = { title: "Postulaciones (administrador)" };

const estadoLabel: Record<string, string> = {
  PENDIENTE: "Pendiente",
  APROBADA: "Aprobada",
  RECHAZADA: "Rechazada",
};

export default async function AdminPostulacionesPage() {
  const session = await auth();
  if (!can(session, "postulaciones:manage")) notFound();

  const postulaciones = await prisma.application.findMany({
    where: { tenantId: session!.user.tenantId },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Postulaciones</h1>
      {postulaciones.length === 0 ? (
        <div className="card text-center text-[var(--muted-foreground)] py-12">
          No hay postulaciones.
        </div>
      ) : (
        <div className="space-y-3">
          {postulaciones.map((p) => (
            <div key={p.id} className="card">
              <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
                <div>
                  <div className="font-medium">{p.name}</div>
                  <div className="text-sm text-[var(--muted-foreground)]">
                    {p.email}
                    {p.phone ? ` · ${p.phone}` : ""}
                  </div>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    p.status === "PENDING"
                      ? "bg-[var(--accent-yellow)] text-black"
                      : p.status === "APPROVED"
                        ? "bg-[color-mix(in_oklab,var(--primary)_25%,transparent)]"
                        : "bg-[var(--muted)]"
                  }`}
                >
                  {estadoLabel[p.status]}
                </span>
              </div>
              {p.message && (
                <p className="text-sm leading-relaxed mb-3 whitespace-pre-wrap">
                  {p.message}
                </p>
              )}
              <div className="text-xs text-[var(--muted-foreground)] mb-3">
                Recibida el {p.createdAt.toLocaleDateString("es-UY")}
              </div>
              {p.status === "PENDING" ? (
                <div className="flex gap-2 items-center flex-wrap">
                  <AprobarButton id={p.id} />
                  <RechazarForm id={p.id} />
                </div>
              ) : (
                <div className="flex justify-end">
                  <EliminarForm id={p.id} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
