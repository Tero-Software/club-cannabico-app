import { NextResponse } from "next/server";
import { del } from "@vercel/blob";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { isOwnTenantBlob } from "@/lib/blob";

export async function POST(req: Request) {
  const session = await auth();
  if (!can(session, "geneticas:manage")) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const body = (await req.json().catch(() => null)) as { url?: string } | null;
  const url = body?.url;
  if (!url) {
    return NextResponse.json({ error: "no url" }, { status: 400 });
  }
  // Nada se comparte entre clubes: solo se puede borrar un blob que esté bajo el
  // prefijo del propio club. Esto valida host de Vercel Blob y namespace del tenant.
  if (!isOwnTenantBlob(url, session!.user.tenantSlug)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  try {
    await del(url);
  } catch (e) {
    console.error("blob delete failed", e);
    return NextResponse.json({ error: "delete failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
