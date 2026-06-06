import { NextResponse } from "next/server";
import { z } from "zod";
import { getClientIp } from "@/lib/security";
import { sendContactEmail } from "@/lib/resend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Schema = z.object({
  message: z.string().trim().min(5, "El mensaje es muy corto").max(2000),
  contact: z.string().trim().min(3, "Indicá un email o teléfono").max(200),
});

const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const cutoff = now - WINDOW_MS;
  const arr = (hits.get(ip) ?? []).filter((t) => t > cutoff);
  if (arr.length >= MAX_PER_WINDOW) {
    hits.set(ip, arr);
    return true;
  }
  arr.push(now);
  hits.set(ip, arr);
  return false;
}

export async function POST(req: Request) {
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
  }

  const parsed = Schema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const ip = (await getClientIp()) ?? "unknown";
  if (rateLimited(ip)) {
    return NextResponse.json(
      { error: "Demasiados envíos desde tu red. Esperá unos minutos." },
      { status: 429 }
    );
  }

  try {
    await sendContactEmail({
      message: parsed.data.message,
      contact: parsed.data.contact,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[contact] error enviando email", err);
    return NextResponse.json(
      { error: "No pudimos enviar el mensaje. Probá de nuevo en un rato." },
      { status: 500 }
    );
  }
}
