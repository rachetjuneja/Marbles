import { NextRequest, NextResponse } from "next/server";
import { createSession, createToken, getToken, listRenders, setShortlist } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body.action as string;

    if (action === "create") {
      const name = (body.name || "").trim();
      const mobile = (body.mobile || "").trim();
      if (!name || !mobile) return NextResponse.json({ error: "Name and mobile required" }, { status: 400 });
      const s = await createSession(name, mobile);
      return NextResponse.json({ session: s });
    }

    if (action === "token") {
      if (!body.projectId || !body.kind) return NextResponse.json({ error: "projectId and kind required" }, { status: 400 });
      const t = await createToken(body.projectId, body.kind);
      return NextResponse.json({ token: t.token });
    }

    if (action === "shortlist") {
      await setShortlist(body.renderId, Boolean(body.on));
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "unknown action" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const renders = req.nextUrl.searchParams.get("renders");
  if (token) {
    const t = await getToken(token);
    if (!t) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json({ status: t.status, url: t.url ?? null, kind: t.kind });
  }
  if (renders) {
    return NextResponse.json({ renders: await listRenders(renders) });
  }
  return NextResponse.json({ error: "nothing to do" }, { status: 400 });
}
