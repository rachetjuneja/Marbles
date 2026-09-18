import type { ImageBytes } from "./util";

/** OpenAI GPT Image via the image edits endpoint (scene + reference stone). */
export async function openaiGenerate(
  model: string,
  prompt: string,
  scene: ImageBytes,
  stone: ImageBytes
): Promise<{ base64: string; mime: string }> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY is not set");

  const form = new FormData();
  form.append("model", model);
  form.append("prompt", prompt);
  form.append("size", "1024x1024");
  form.append("n", "1");
  // gpt-image models accept multiple input images under the image[] field.
  form.append("image[]", new Blob([new Uint8Array(scene.buffer)], { type: scene.mime }), "scene.png");
  form.append("image[]", new Blob([new Uint8Array(stone.buffer)], { type: stone.mime }), "stone.png");

  const res = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}` },
    body: form,
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`OpenAI ${model} error ${res.status}: ${t.slice(0, 400)}`);
  }
  const json: any = await res.json();
  const b64 = json?.data?.[0]?.b64_json;
  if (!b64) throw new Error("OpenAI returned no image");
  return { base64: b64, mime: "image/png" };
}
