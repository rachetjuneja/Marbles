import type { ImageBytes } from "./util";
import { dataUri } from "./util";

/** FLUX.1 Kontext via fal.ai. Uses the multi-image endpoint when available. */
export async function fluxGenerate(
  model: string,
  prompt: string,
  scene: ImageBytes,
  stone: ImageBytes
): Promise<{ base64: string; mime: string }> {
  const key = process.env.FAL_KEY;
  if (!key) throw new Error("FAL_KEY is not set");

  const isMulti = model.includes("multi");
  const payload: Record<string, unknown> = isMulti
    ? { prompt, image_urls: [dataUri(scene), dataUri(stone)] }
    : { prompt, image_url: dataUri(scene) };

  const res = await fetch(`https://fal.run/${model}`, {
    method: "POST",
    headers: { Authorization: `Key ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`fal ${model} error ${res.status}: ${t.slice(0, 400)}`);
  }
  const json: any = await res.json();
  const url = json?.images?.[0]?.url;
  if (!url) throw new Error("fal returned no image");
  if (typeof url === "string" && url.startsWith("data:")) {
    const m = url.match(/^data:([^;]+);base64,(.*)$/);
    if (m) return { mime: m[1], base64: m[2] };
  }
  const img = await fetch(url);
  const buf = Buffer.from(await img.arrayBuffer());
  return { base64: buf.toString("base64"), mime: img.headers.get("content-type") || "image/png" };
}
