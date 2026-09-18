import { NextRequest, NextResponse } from "next/server";
import { completeToken, getToken, putImage } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Phone posts the photo here after scanning the QR code. */
export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const token = String(form.get("token") || "");
    const file = form.get("file") as File | null;
    if (!token || !file) return NextResponse.json({ error: "token and file required" }, { status: 400 });

    const t = await getToken(token);
    if (!t) return NextResponse.json({ error: "invalid token" }, { status: 404 });

    const bytes = Buffer.from(await file.arrayBuffer());
    const mime = file.type || "image/jpeg";
    const ext = mime.split("/")[1] || "jpg";
    const url = await putImage("uploads", `${token}/${Date.now()}.${ext}`, bytes, mime);
    await completeToken(token, url);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "error" }, { status: 500 });
  }
}
