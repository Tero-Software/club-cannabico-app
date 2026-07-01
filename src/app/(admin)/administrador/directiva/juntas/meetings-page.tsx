import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader, EmptyState } from "@/components/ui/page-scaffold";
import { buildActa, type Acta } from "./acta";
import { ActaView, tituloActa } from "./acta-view";
import { JuntasPanel } from "./juntas-panel";

type MeetingType = "DIRECTIVA" | "ASAMBLEA";

// Página de reuniones (junta de directiva o asamblea). Lista las actas cerradas
// del tipo y maneja la reunión en curso. Misma lógica para los dos tipos.
export async function MeetingsPage({
  type,
  title,
  description,
  emptyTitle,
  emptyDescription,
  icon,
}: {
  type: MeetingType;
  title: string;
  description: string;
  emptyTitle: string;
  emptyDescription: string;
  icon: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/socio");

  const tenantId = session.user.tenantId;

  const meetings = await prisma.meeting.findMany({
    where: { tenantId, type },
    orderBy: { number: "desc" },
    select: { id: true, number: true, status: true },
  });

  const draft = meetings.find((m) => m.status === "DRAFT") ?? null;
  const closed = meetings.filter((m) => m.status === "CLOSED");

  const draftActa = draft ? await buildActa(draft.id) : null;
  const closedActas = (
    await Promise.all(closed.map((m) => buildActa(m.id)))
  ).filter((a): a is Acta => a !== null);

  const draftItems = draft
    ? await prisma.meetingItem.findMany({
        where: { meetingId: draft.id },
        orderBy: { createdAt: "asc" },
        select: { id: true, title: true, body: true },
      })
    : [];

  return (
    <div className="space-y-8">
      <PageHeader title={title} description={description} />

      <JuntasPanel
        type={type}
        draft={
          draft && draftActa
            ? { id: draft.id, acta: draftActa, items: draftItems }
            : null
        }
      />

      {closedActas.length === 0 && !draft && (
        <EmptyState
          icon={icon}
          title={emptyTitle}
          description={emptyDescription}
        />
      )}

      {closedActas.length > 0 && (
        <div className="space-y-4">
          {closedActas.map((acta) => (
            <article key={acta.number} className="card space-y-5">
              <header className="flex items-baseline justify-between gap-3 flex-wrap">
                <h2 className="text-xl font-semibold">
                  Acta de {tituloActa(acta)}
                </h2>
              </header>
              <ActaView acta={acta} />
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
