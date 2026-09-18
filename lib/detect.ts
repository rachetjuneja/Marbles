import type { DetectedSurface } from "./types";

/** Client helper: ask the server to detect applicable surfaces in a room image. */
export async function detectSurfaces(
  sceneRef: string
): Promise<{ surfaces: DetectedSurface[]; error?: string }> {
  try {
    const res = await fetch("/api/detect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sceneRef }),
    });
    const data = await res.json().catch(() => ({ surfaces: [] }));
    return { surfaces: Array.isArray(data?.surfaces) ? data.surfaces : [], error: data?.error };
  } catch (e: any) {
    return { surfaces: [], error: e?.message || "detection failed" };
  }
}
