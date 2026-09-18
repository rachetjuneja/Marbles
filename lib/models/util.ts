export interface ImageBytes {
  buffer: Buffer;
  base64: string;
  mime: string;
}

const BASE =
  process.env.NEXT_PUBLIC_BASE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

/** Resolve an image reference (data: URL, absolute URL, or /public path) to bytes. */
export async function refToBytes(ref: string): Promise<ImageBytes> {
  if (ref.startsWith("data:")) {
    const m = ref.match(/^data:([^;]+);base64,(.*)$/);
    if (!m) throw new Error("bad data url");
    const buffer = Buffer.from(m[2], "base64");
    return { buffer, base64: m[2], mime: m[1] };
  }
  const url = ref.startsWith("/") ? BASE.replace(/\/$/, "") + ref : ref;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetch image failed (${res.status}) for ${url}`);
  const mime = res.headers.get("content-type") || "image/jpeg";
  const buffer = Buffer.from(await res.arrayBuffer());
  return { buffer, base64: buffer.toString("base64"), mime };
}

export function dataUri(b: ImageBytes): string {
  return `data:${b.mime};base64,${b.base64}`;
}
