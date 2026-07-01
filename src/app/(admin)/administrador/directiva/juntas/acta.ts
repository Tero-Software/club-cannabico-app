import { prisma } from "@/lib/db";

// Un punto del orden del día tal como va en el acta: un título (índice) y un
// cuerpo en prosa. `list` son nombres que se enumeran debajo del cuerpo (altas,
// bajas), fiel al formato impreso.
export type ActaItem = {
  title: string;
  body: string;
  list?: string[];
};

export type Acta = {
  type: "DIRECTIVA" | "ASAMBLEA";
  number: number;
  date: Date;
  city: string;
  clubName: string;
  attendees: string[];
  items: ActaItem[];
  closing: string;
};

// Socios con alta (createdAt) o baja (alguna fecha de deactivatedAt) entre la
// junta anterior y esta. Si no hay junta anterior, el período arranca desde el
// inicio del club. Un socio puede tener varias bajas (historial); cuenta como
// baja del período si alguna de sus fechas cae en el rango.
async function membershipChanges(
  tenantId: string,
  from: Date | null,
  to: Date,
): Promise<{ altas: string[]; bajas: string[] }> {
  const gteFrom = from ?? new Date(0);
  const inRange = (d: Date) => d > gteFrom && d <= to;

  const [altas, bajasRaw] = await Promise.all([
    prisma.user.findMany({
      where: { tenantId, role: "MEMBER", createdAt: { gt: gteFrom, lte: to } },
      orderBy: { createdAt: "asc" },
      select: { name: true },
    }),
    // Candidatos: socios con al menos una baja en el rango. El operador `hasSome`
    // no acepta rango, así que se filtra por límite superior en DB y el rango
    // exacto en memoria, tomando la baja más temprana del período para ordenar.
    prisma.user.findMany({
      where: {
        tenantId,
        role: "MEMBER",
        deactivatedAt: { isEmpty: false },
      },
      select: { name: true, deactivatedAt: true },
    }),
  ]);

  const bajas = bajasRaw
    .map((u) => ({
      name: u.name,
      at: u.deactivatedAt.filter(inRange).sort((a, b) => +a - +b)[0],
    }))
    .filter((u): u is { name: string; at: Date } => u.at !== undefined)
    .sort((a, b) => +a.at - +b.at)
    .map((u) => u.name);

  return { altas: altas.map((u) => u.name), bajas };
}

// Construye el acta de una junta, fiel a MODELO-ACTA-DIRECTIVA.md:
//   1. Lectura y aprobación del acta anterior (fijo).
//   2. Solicitudes de ingreso / bajas (automático, si hubo movimiento).
//   3..N. Temas tratados (texto libre, en orden).
export async function buildActa(meetingId: string): Promise<Acta | null> {
  const meeting = await prisma.meeting.findUnique({
    where: { id: meetingId },
    include: {
      items: { orderBy: { createdAt: "asc" } },
      tenant: { select: { name: true, city: true } },
    },
  });
  if (!meeting) return null;

  const items: ActaItem[] = [];

  // Las juntas de directiva abren con la aprobación del acta anterior (fija) y,
  // si hubo movimiento de socios en el período, el ítem automático de altas/bajas.
  // Las asambleas no llevan ninguno de los dos: sus temas son todos manuales.
  if (meeting.type === "DIRECTIVA") {
    items.push({
      title: "Lectura y aprobación del acta anterior.",
      body: "Se lee y aprueba por unanimidad el acta de la sesión anterior.",
    });

    const prev = await prisma.meeting.findFirst({
      where: {
        tenantId: meeting.tenantId,
        type: "DIRECTIVA",
        number: { lt: meeting.number },
      },
      orderBy: { number: "desc" },
      select: { date: true },
    });

    const { altas, bajas } = await membershipChanges(
      meeting.tenantId,
      prev?.date ?? null,
      meeting.date,
    );

    if (altas.length) {
      items.push({
        title: "Solicitudes de ingreso.",
        body: "Habiéndose presentado las solicitudes escritas correspondientes, se resuelve por unanimidad admitir como socios a:",
        list: altas,
      });
    }

    if (bajas.length) {
      items.push({
        title: "Bajas de socios.",
        body: "Se deja constancia de la baja del registro de socios de:",
        list: bajas,
      });
    }
  }

  for (const it of meeting.items) {
    items.push({ title: it.title, body: it.body });
  }

  const closing =
    meeting.type === "ASAMBLEA"
      ? "No habiendo más asuntos que tratar, se levanta la sesión."
      : "No siendo para más, se levanta la sesión.";

  return {
    type: meeting.type,
    number: meeting.number,
    date: meeting.date,
    city: meeting.tenant.city ?? "",
    clubName: meeting.tenant.name,
    attendees: meeting.attendees,
    items,
    closing,
  };
}
