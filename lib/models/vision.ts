import type { ImageBytes } from "./util";
import type { RawDetection } from "../types";

/**
 * Gemini vision: studies an interior photo and returns the surfaces where stone
 * or tile could be applied (floors, walls, countertops, tables, stairs...), each
 * with a tight 2D bounding box. Uses a text/vision Gemini model (not an image
 * model) so we get structured JSON with spatial coordinates back.
 */
export async function geminiDetectSurfaces(image: ImageBytes): Promise<RawDetection[]> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not set");
  const model = process.env.GEMINI_VISION_MODEL || "gemini-2.5-flash";
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const instruction =
    "You are the surface detector for a tile and marble sales visualiser. " +
    "Study this interior photo and find every distinct surface where a marble, granite or tile slab could realistically be applied: " +
    "floors, each individual wall, countertops, kitchen islands, backsplashes, table tops, vanity tops, and staircase treads or risers. " +
    "Return a tight 2D bounding box around each one. " +
    "Give each a short human label a salesperson would recognise (for example \"Floor\", \"Left wall\", \"Back wall\", \"Kitchen countertop\", \"Coffee table\", \"Staircase\"). " +
    "Respond with ONLY a JSON array. Each item must be exactly: " +
    '{"label": string, "category": one of ["floor","wall","countertop","backsplash","table","staircase","other"], "box_2d": [ymin, xmin, ymax, xmax]} ' +
    "where box_2d uses integers on a 0-1000 scale (y is top-to-bottom, x is left-to-right). " +
    "List at most 8 surfaces, largest and most useful first. Do not include furniture you cannot tile, people, plants, windows or ceilings. No prose, no markdown, JSON array only.";

  const body = {
    contents: [
      {
        role: "user",
        parts: [
          { text: instruction },
          { inlineData: { mimeType: image.mime, data: image.base64 } },
        ],
      },
    ],
    generationConfig: { temperature: 0, responseMimeType: "application/json" },
  };

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Gemini vision ${model} error ${res.status}: ${t.slice(0, 400)}`);
  }
  const json: any = await res.json();
  const text: string =
    (json?.candidates?.[0]?.content?.parts ?? [])
      .map((p: any) => p?.text)
      .filter(Boolean)
      .join("") || "";
  return parseDetections(text);
}

function parseDetections(text: string): RawDetection[] {
  let raw = (text || "").trim();
  raw = raw.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  let data: any;
  try {
    data = JSON.parse(raw);
  } catch {
    const m = raw.match(/\[[\s\S]*\]/);
    if (!m) return [];
    try {
      data = JSON.parse(m[0]);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(data)) {
    if (Array.isArray(data?.surfaces)) data = data.surfaces;
    else if (Array.isArray(data?.detections)) data = data.detections;
    else return [];
  }
  return data
    .filter((d: any) => d && Array.isArray(d.box_2d) && d.box_2d.length === 4)
    .map((d: any) => ({
      label: String(d.label ?? d.name ?? "Surface"),
      category: String(d.category ?? d.type ?? "other").toLowerCase(),
      box_2d: d.box_2d.map((n: any) => Number(n)) as [number, number, number, number],
    }));
}
