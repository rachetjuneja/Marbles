/** Browser-only helpers. Only call these from client components. */

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Build a deterministic 2x2 book-match tile from a slab image: the source is
 * mirrored horizontally, vertically and both, so veins meet exactly at the seams.
 * This gives accurate book-match geometry which we then hand to the image model.
 */
export async function makeBookmatch(src: string): Promise<string> {
  const img = await loadImage(src);
  const nw = img.naturalWidth || img.width;
  const nh = img.naturalHeight || img.height;
  // Cap the per-tile working size so the 2x2 book-match stays a sane payload for
  // the model. This affects the model input only; the stored library asset is
  // left at full resolution.
  const MAX = 1500;
  const s = Math.min(1, MAX / Math.max(nw, nh));
  const w = Math.round(nw * s);
  const h = Math.round(nh * s);
  const c = document.createElement("canvas");
  c.width = w * 2;
  c.height = h * 2;
  const ctx = c.getContext("2d")!;
  // top-left: original
  ctx.drawImage(img, 0, 0, w, h);
  // top-right: mirror X
  ctx.save(); ctx.translate(w * 2, 0); ctx.scale(-1, 1); ctx.drawImage(img, 0, 0, w, h); ctx.restore();
  // bottom-left: mirror Y
  ctx.save(); ctx.translate(0, h * 2); ctx.scale(1, -1); ctx.drawImage(img, 0, 0, w, h); ctx.restore();
  // bottom-right: mirror both
  ctx.save(); ctx.translate(w * 2, h * 2); ctx.scale(-1, -1); ctx.drawImage(img, 0, 0, w, h); ctx.restore();
  // Lossless PNG so the book-matched reference keeps full quality for the model.
  return c.toDataURL("image/png");
}
