import type { ImageBytes } from "./util";

/** Google Gemini "Nano Banana" image models via REST. Returns generated image bytes. */
export async function geminiGenerate(
  model: string,
  prompt: string,
  scene: ImageBytes,
  stone: ImageBytes
): Promise<{ base64: string; mime: string }> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not set");

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const body = {
    contents: [
      {
        role: "user",
        parts: [
          { text: prompt },
          { inlineData: { mimeType: scene.mime, data: scene.base64 } },
          { inlineData: { mimeType: stone.mime, data: stone.base64 } },
        ],
      },
    ],
  };

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Gemini ${model} error ${res.status}: ${t.slice(0, 400)}`);
  }
  const json: any = await res.json();
  const parts = json?.candidates?.[0]?.content?.parts ?? [];
  for (const p of parts) {
    const inline = p.inlineData || p.inline_data;
    if (inline?.data) {
      return { base64: inline.data, mime: inline.mimeType || inline.mime_type || "image/png" };
    }
  }
  throw new Error("Gemini returned no image (check the model id supports image output)");
}
