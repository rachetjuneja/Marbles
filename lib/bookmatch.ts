/** Browser-only helpers. Only call these from client components. */
import type { BookmatchOptions } from "./types";

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

// Cap the per-tile working size so the composed layout stays a sane payload for
// the model. Affects the model input only, not the stored library asset.
const MAX = 900;

/**
 * Build a deterministic book-match layout from a slab image. Mirrors are exact,
 * so the veins meet correctly at the seams, and the result is handed to the
 * image model as the reference so it applies the true pattern, not a guess.
 *
 *  - book:     two slabs mirrored across one seam (a butterfly)
 *  - four_way: 2x2, mirrored on both axes, veins radiate from the centre
 *  - diamond:  a four-way turned 45 degrees so the veins form a diamond
 *  - slip:     the same slab repeated, no mirror (a slip / running match)
 */
export async function buildBookmatch(src: string, opts: BookmatchOptions): Promise<string> {
  const img = await loadImage(src);
  const nw = img.naturalWidth || img.width;
  const nh = img.naturalHeight || img.height;

  const rot = ((opts.rotation % 360) + 360) % 360;
  const swap = rot === 90 || rot === 270;
  const rawW = swap ? nh : nw;
  const rawH = swap ? nw : nh;
  const scale = Math.min(1, MAX / Math.max(rawW, rawH));
  const bw = Math.max(1, Math.round(rawW * scale));
  const bh = Math.max(1, Math.round(rawH * scale));

  // Base slab canvas, with the chosen rotation baked in.
  const base = document.createElement("canvas");
  base.width = bw;
  base.height = bh;
  const bctx = base.getContext("2d")!;
  bctx.save();
  bctx.translate(bw / 2, bh / 2);
  bctx.rotate((rot * Math.PI) / 180);
  const dw = swap ? bh : bw;
  const dh = swap ? bw : bh;
  bctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
  bctx.restore();

  const tile = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fx: boolean, fy: boolean) => {
    ctx.save();
    ctx.translate(x + (fx ? w : 0), y + (fy ? h : 0));
    ctx.scale(fx ? -1 : 1, fy ? -1 : 1);
    ctx.drawImage(base, 0, 0, w, h);
    ctx.restore();
  };

  const out = document.createElement("canvas");
  let ctx: CanvasRenderingContext2D;

  if (opts.pattern === "slip") {
    out.width = bw * 2; out.height = bh * 2; ctx = out.getContext("2d")!;
    tile(ctx, 0, 0, bw, bh, false, false); tile(ctx, bw, 0, bw, bh, false, false);
    tile(ctx, 0, bh, bw, bh, false, false); tile(ctx, bw, bh, bw, bh, false, false);
  } else if (opts.pattern === "book") {
    if (opts.direction === "horizontal") {
      out.width = bw; out.height = bh * 2; ctx = out.getContext("2d")!;
      tile(ctx, 0, 0, bw, bh, false, false); tile(ctx, 0, bh, bw, bh, false, true);
    } else {
      out.width = bw * 2; out.height = bh; ctx = out.getContext("2d")!;
      tile(ctx, 0, 0, bw, bh, false, false); tile(ctx, bw, 0, bw, bh, true, false);
    }
  } else if (opts.pattern === "four_way") {
    out.width = bw * 2; out.height = bh * 2; ctx = out.getContext("2d")!;
    tile(ctx, 0, 0, bw, bh, false, false); tile(ctx, bw, 0, bw, bh, true, false);
    tile(ctx, 0, bh, bw, bh, false, true); tile(ctx, bw, bh, bw, bh, true, true);
  } else {
    // diamond: compose a four-way, then draw it rotated 45 degrees onto a square,
    // over-scaled so it fills the frame. Veins converge to a diamond.
    const fw = document.createElement("canvas");
    fw.width = bw * 2; fw.height = bh * 2;
    const fctx = fw.getContext("2d")!;
    const q = (x: number, y: number, fx: boolean, fy: boolean) => {
      fctx.save();
      fctx.translate(x + (fx ? bw : 0), y + (fy ? bh : 0));
      fctx.scale(fx ? -1 : 1, fy ? -1 : 1);
      fctx.drawImage(base, 0, 0, bw, bh);
      fctx.restore();
    };
    q(0, 0, false, false); q(bw, 0, true, false); q(0, bh, false, true); q(bw, bh, true, true);
    const side = Math.round(Math.max(bw, bh) * 2);
    out.width = side; out.height = side; ctx = out.getContext("2d")!;
    ctx.save();
    ctx.translate(side / 2, side / 2);
    ctx.rotate(Math.PI / 4);
    const cover = Math.hypot(fw.width, fw.height);
    const s = cover / Math.max(fw.width, fw.height);
    ctx.drawImage(fw, (-fw.width * s) / 2, (-fw.height * s) / 2, fw.width * s, fw.height * s);
    ctx.restore();
  }

  return out.toDataURL("image/png");
}

/** Backwards-compatible helper: a plain four-way book-match. */
export function makeBookmatch(src: string): Promise<string> {
  return buildBookmatch(src, { pattern: "four_way", direction: "vertical", rotation: 0 });
}
