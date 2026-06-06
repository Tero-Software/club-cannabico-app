import { NextResponse } from "next/server";
import { del } from "@vercel/blob";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";

const BLOB_HOST_SUFFIX = ".public.blob.vercel-storage.com";

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
  try {
    const host = new URL(url).hostname;
    if (!host.endsWith(BLOB_HOST_SUFFIX)) {
      return NextResponse.json({ error: "invalid host" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "invalid url" }, { status: 400 });
  }

  try {
    await del(url);
  } catch (e) {
    console.error("blob delete failed", e);
    return NextResponse.json({ error: "delete failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
