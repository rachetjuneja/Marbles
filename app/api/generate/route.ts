import { NextRequest, NextResponse } from "next/server";
import { runGenerate } from "@/lib/models";
import { buildPrompt, type Target } from "@/lib/prompt";
import { putImage, saveRender } from "@/lib/store";
import type { StoneMeta, Surface } from "@/lib/types";
import { randomUUID } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      projectId,
      sceneRef,
      stoneRef,
      surface,
      targets,
      model,
      bookmatch,
      stone,
      targetLabel,
    }: {
      projectId: string;
      sceneRef: string;
      stoneRef: string;
      surface?: Surface;
      targets?: Target[];
      model: string;
      bookmatch: boolean;
      stone: StoneMeta;
      targetLabel?: string;
    } = body;

    // Prefer the multi-surface `targets` array; fall back to a single surface.
    const targetList: Target[] =
      Array.isArray(targets) && targets.length
        ? targets
        : surface
        ? [{ surface, label: targetLabel }]
        : [];

    if (!sceneRef || !stoneRef || !targetList.length || !model) {
      return NextResponse.json({ error: "sceneRef, stoneRef, at least one surface and model are required" }, { status: 400 });
    }

    const prompt = buildPrompt(targetList, Boolean(bookmatch), stone?.name);
    const out = await runGenerate({ modelId: model, prompt, sceneRef, stoneRef });

    // Persist the render image (Supabase storage, or a data URL in dev).
    const resultUrl = await putImage(
      "renders",
      `${projectId || "anon"}/${randomUUID()}.png`,
      Buffer.from(out.base64, "base64"),
      out.mime
    );

    let renderId: string = randomUUID();
    if (projectId) {
      const row = await saveRender({
        projectId,
        sceneUrl: typeof sceneRef === "string" && sceneRef.startsWith("data:") ? resultUrl : sceneRef,
        resultUrl,
        surface: targetList[0].surface,
        model,
        bookmatch: Boolean(bookmatch),
        stone: stone || { name: "Stone", source: "upload" },
      });
      renderId = row.id;
    }

    return NextResponse.json({ resultUrl, renderId });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "generation failed" }, { status: 500 });
  }
}
