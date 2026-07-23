"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { buildRule } from "@/lib/ejercicio";
import { formatDateShort } from "@/lib/format";

type MeetingType = "DIRECTIVA" | "ASAMBLEA";

// Ruta de cada tipo, para revalidar la página correcta.
const PATH: Record<MeetingType, string> = {
  DIRECTIVA: "/administrador/directiva/juntas",
  ASAMBLEA: "/administrador/directiva/asambleas",
};

function parseType(value: FormDataEntryValue | null): MeetingType {
  return value === "ASAMBLEA" ? "ASAMBLEA" : "DIRECTIVA";
}

async function requireAdmin() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("No autorizado");
  }
  return session;
}

// Orden del día base de la asamblea general ordinaria: los dos puntos que el
// estatuto manda tratar siempre (Memoria y Balance del ejercicio cerrado). Se
// precargan como temas editables; el resto se agrega en vivo. La fecha del
// cierre sale de la regla configurada del club (último cierre ocurrido); si el
// club no la configuró, el texto queda sin fecha.
function ordenDelDiaAsamblea(cierre: Date | null): { title: string; body: string }[] {
  const cerrado = cierre ? ` cerrado el ${formatDateShort(cierre)}` : "";
  return [
    {
      title: "Memoria Anual.",
      body: `Se da lectura a la Memoria correspondiente al ejercicio${cerrado}. Considerada por la Asamblea, se aprueba por unanimidad.`,
    },
    {
      title: "Balance y estado de cuentas.",
      body: "Se presenta el Balance y estado de cuentas del ejercicio, con el informe favorable de la Sindicatura. Considerado por la Asamblea, se aprueba por unanimidad.",
    },
  ];
}

/* ── Iniciar reunión ──────────────────────────────────────
   Crea la junta/asamblea en borrador. El número es correlativo por club y por
   tipo. Los temas se agregan en vivo. La asamblea arranca con su orden del día
   base (Memoria y Balance) ya precargado. */
export async function startMeeting(type: MeetingType) {
  const session = await requireAdmin();
  const tenantId = session.user.tenantId;

  // Una sola reunión en borrador a la vez por tipo: si ya hay una, se reutiliza.
  const open = await prisma.meeting.findFirst({
    where: { tenantId, type, status: "DRAFT" },
    select: { id: true },
  });
  if (open) return { meetingId: open.id };

  const last = await prisma.meeting.findFirst({
    where: { tenantId, type },
    orderBy: { number: "desc" },
    select: { number: true },
  });
  const number = (last?.number ?? 0) + 1;

  const date = new Date();
  let baseItems: { tenantId: string; title: string; body: string }[] = [];
  if (type === "ASAMBLEA") {
    const tenant = await prisma.tenant.findUniqueOrThrow({
      where: { id: tenantId },
      select: { fiscalYearEndRule: true },
    });
    const cierre = buildRule(tenant.fiscalYearEndRule)?.before(date, true) ?? null;
    baseItems = ordenDelDiaAsamblea(cierre).map((it) => ({ tenantId, ...it }));
  }

  const meeting = await prisma.meeting.create({
    data: {
      tenantId,
      type,
      number,
      date,
      attendees: [],
      items: { create: baseItems },
    },
    select: { id: true, number: true },
  });

  await audit({
    tenantId,
    userId: session.user.id,
    actorEmail: session.user.email,
    action: "junta.iniciar",
    entity: "Meeting",
    entityId: meeting.id,
    metadata: { number: meeting.number, type },
  });

  revalidatePath(PATH[type]);
  return { meetingId: meeting.id };
}

/* ── Agregar tema ─────────────────────────────────────────
   Un tema se trata en el momento; se guarda con su título y contenido. */
export async function addItem(formData: FormData) {
  const session = await requireAdmin();
  const tenantId = session.user.tenantId;

  const meetingId = String(formData.get("meetingId") || "");
  const title = String(formData.get("title") || "").trim();
  const body = String(formData.get("body") || "").trim();
  if (!meetingId) return { error: "Falta la junta" };
  if (!title) return { error: "El tema no puede estar vacío" };

  const meeting = await prisma.meeting.findFirst({
    where: { id: meetingId, tenantId, status: "DRAFT" },
    select: { id: true, type: true },
  });
  if (!meeting) return { error: "La junta no está abierta" };

  const item = await prisma.meetingItem.create({
    data: { tenantId, meetingId, title, body },
    select: { id: true },
  });

  await audit({
    tenantId,
    userId: session.user.id,
    actorEmail: session.user.email,
    action: "junta.tema.agregar",
    entity: "MeetingItem",
    entityId: item.id,
    metadata: { meetingId, title },
  });

  revalidatePath(PATH[meeting.type]);
  return { ok: true };
}

/* ── Editar tema ──────────────────────────────────────── */
export async function updateItem(formData: FormData) {
  const session = await requireAdmin();
  const tenantId = session.user.tenantId;

  const id = String(formData.get("id") || "");
  const title = String(formData.get("title") || "").trim();
  const body = String(formData.get("body") || "").trim();
  if (!id) return { error: "Falta el tema" };
  if (!title) return { error: "El tema no puede estar vacío" };

  const item = await prisma.meetingItem.findFirst({
    where: { id, tenantId, meeting: { status: "DRAFT" } },
    select: { id: true, meeting: { select: { type: true } } },
  });
  if (!item) return { error: "No se puede editar" };

  await prisma.meetingItem.update({ where: { id }, data: { title, body } });

  await audit({
    tenantId,
    userId: session.user.id,
    actorEmail: session.user.email,
    action: "junta.tema.editar",
    entity: "MeetingItem",
    entityId: id,
    metadata: { title },
  });

  revalidatePath(PATH[item.meeting.type]);
  return { ok: true };
}

/* ── Borrar tema ──────────────────────────────────────── */
export async function deleteItem(formData: FormData) {
  const session = await requireAdmin();
  const tenantId = session.user.tenantId;

  const id = String(formData.get("id") || "");
  if (!id) return { error: "Falta el tema" };

  const item = await prisma.meetingItem.findFirst({
    where: { id, tenantId, meeting: { status: "DRAFT" } },
    select: { id: true, meeting: { select: { type: true } } },
  });
  if (!item) return { error: "No se puede borrar" };

  await prisma.meetingItem.delete({ where: { id } });

  await audit({
    tenantId,
    userId: session.user.id,
    actorEmail: session.user.email,
    action: "junta.tema.borrar",
    entity: "MeetingItem",
    entityId: id,
  });

  revalidatePath(PATH[item.meeting.type]);
  return { ok: true };
}

/* ── Terminar junta ───────────────────────────────────────
   Cierra el acta. Persiste presentes y fecha definitivos. La fecha del acta es
   la del día en que se genera; se puede pisar a mano desde el formulario. */
export async function finishMeeting(formData: FormData) {
  const session = await requireAdmin();
  const tenantId = session.user.tenantId;

  const meetingId = String(formData.get("meetingId") || "");
  if (!meetingId) return { error: "Falta la junta" };

  const attendees = formData
    .getAll("attendees")
    .map((a) => String(a).trim())
    .filter(Boolean);

  const dateStr = String(formData.get("date") || "").trim();
  if (dateStr && !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return { error: "Fecha inválida" };
  }
  const date = dateStr ? new Date(`${dateStr}T00:00:00.000Z`) : new Date();

  const meeting = await prisma.meeting.findFirst({
    where: { id: meetingId, tenantId, status: "DRAFT" },
    select: { id: true, number: true, type: true },
  });
  if (!meeting) return { error: "La junta no está abierta" };

  await prisma.meeting.update({
    where: { id: meetingId },
    data: { status: "CLOSED", attendees, date },
  });

  await audit({
    tenantId,
    userId: session.user.id,
    actorEmail: session.user.email,
    action: "junta.terminar",
    entity: "Meeting",
    entityId: meetingId,
    metadata: { number: meeting.number, type: meeting.type },
  });

  revalidatePath(PATH[meeting.type]);
  return { ok: true };
}

/* ── Cancelar junta ───────────────────────────────────────
   Descarta una junta en borrador: la borra junto con sus temas. No queda acta. */
export async function cancelMeeting(formData: FormData) {
  const session = await requireAdmin();
  const tenantId = session.user.tenantId;

  const meetingId = String(formData.get("meetingId") || "");
  if (!meetingId) return { error: "Falta la junta" };

  const meeting = await prisma.meeting.findFirst({
    where: { id: meetingId, tenantId, status: "DRAFT" },
    select: { id: true, number: true, type: true },
  });
  if (!meeting) return { error: "La junta no está abierta" };

  await prisma.meeting.delete({ where: { id: meetingId } });

  await audit({
    tenantId,
    userId: session.user.id,
    actorEmail: session.user.email,
    action: "junta.cancelar",
    entity: "Meeting",
    entityId: meetingId,
    metadata: { number: meeting.number, type: meeting.type },
  });

  revalidatePath(PATH[meeting.type]);
  return { ok: true };
}
