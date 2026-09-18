import { NextRequest, NextResponse } from "next/server";
import { refToBytes } from "@/lib/models/util";
import { geminiDetectSurfaces } from "@/lib/models/vision";
import { toDetectedSurfaces } from "@/lib/surface-map";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 45;

export async function POST(req: NextRequest) {
  try {
    const { sceneRef } = await req.json();
    if (!sceneRef) {
      return NextResponse.json({ surfaces: [], error: "sceneRef is required" }, { status: 400 });
    }
    const bytes = await refToBytes(sceneRef);
    const raw = await geminiDetectSurfaces(bytes);
    const surfaces = toDetectedSurfaces(raw);
    return NextResponse.json({ surfaces });
  } catch (e: any) {
    // Never hard-fail the UI on detection: return empty surfaces + a hint so the
    // workspace quietly falls back to manual surface selection.
    return NextResponse.json({ surfaces: [], error: e?.message || "detection failed" });
  }
}
