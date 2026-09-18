import type { BookmatchPattern, Surface } from "./types";

/** Parse a slab size string like "3200 x 1600 mm" into millimetres. */
export function parseSlab(size?: string): { w: number; h: number } | null {
  if (!size) return null;
  const m = size.match(/(\d+(?:\.\d+)?)\s*[x×X]\s*(\d+(?:\.\d+)?)/);
  if (!m) return null;
  const w = Number(m[1]);
  const h = Number(m[2]);
  if (!w || !h) return null;
  return { w, h };
}

function gcd(a: number, b: number): number {
  a = Math.round(a); b = Math.round(b);
  return b ? gcd(b, a % b) : a;
}

export function ratioLabel(w: number, h: number): string {
  const g = gcd(w, h) || 1;
  return `${Math.round(w / g)}:${Math.round(h / g)}`;
}

export const SLABS_PER_UNIT: Record<BookmatchPattern, number> = { book: 2, four_way: 4, diamond: 4, slip: 1 };

export const PATTERN_LABEL: Record<BookmatchPattern, string> = {
  book: "book-match",
  four_way: "four-way book-match",
  diamond: "diamond book-match",
  slip: "slip (running) match",
};

/** Size of one repeating layout unit in mm, for the chosen pattern. */
export function unitDims(slab: { w: number; h: number }, pattern: BookmatchPattern, direction: "vertical" | "horizontal"): { w: number; h: number } {
  const { w, h } = slab;
  switch (pattern) {
    case "book":
      return direction === "horizontal" ? { w, h: h * 2 } : { w: w * 2, h };
    case "four_way":
      return { w: w * 2, h: h * 2 };
    case "diamond": {
      const s = Math.round(Math.max(w, h) * 1.4);
      return { w: s, h: s };
    }
    case "slip":
    default:
      return { w, h };
  }
}

/** How many slabs cover a surface, with a wastage allowance. */
export function slabsForArea(areaSqft: number, slab: { w: number; h: number }, wastage = 0.15): number {
  const slabSqft = (slab.w / 1000) * (slab.h / 1000) * 10.7639;
  if (!slabSqft || !areaSqft) return 0;
  return Math.ceil((areaSqft * (1 + wastage)) / slabSqft);
}

/** A sensible default pattern for a given surface. */
export function suggestPattern(surface: Surface): BookmatchPattern {
  switch (surface) {
    case "floor":
    case "all_walls":
      return "four_way";
    case "single_wall":
    case "countertops":
    case "table":
      return "book";
    case "staircase":
      return "slip";
    default:
      return "book";
  }
}

const m1 = (mm: number) => (mm / 1000).toFixed(1).replace(/\.0$/, "");

/**
 * The instruction that puts real-world scale into the render: the slab size, the
 * resulting mirrored-unit size, the pattern to preserve, and the seam spacing, so
 * the model shows the marble at true scale instead of one stretched sheet.
 */
export function layoutInstruction(opts: {
  slab: { w: number; h: number } | null;
  pattern: BookmatchPattern;
  direction: "vertical" | "horizontal";
  areaSqft: number;
  bookmatch: boolean;
}): string {
  const { slab, pattern, direction, areaSqft, bookmatch } = opts;
  const patternText = PATTERN_LABEL[pattern];

  const mirror = bookmatch
    ? pattern === "slip"
      ? "The second image shows the slab repeated as a slip match; keep that repeat and the seam lines between slabs."
      : `The second image shows the stone arranged as a ${patternText}; keep exactly that mirror geometry so the veins meet continuously across the seams.`
    : "";

  if (!slab) {
    return (
      mirror +
      " Render the marble at a realistic real-world slab scale, with the seams where individual slabs meet visible at natural spacing across the surface, not stretched into one seamless sheet."
    ).trim();
  }

  const unit = unitDims(slab, pattern, direction);
  const slabs = slabsForArea(areaSqft, slab);
  const count = slabs ? ` About ${slabs} slab${slabs === 1 ? "" : "s"} of this size cover the area, so space the seams to match.` : "";

  return (
    mirror +
    ` Each physical slab is about ${m1(slab.w)}m by ${m1(slab.h)}m, so the ${pattern === "slip" ? "repeating tile" : "mirrored unit"} is roughly ${m1(unit.w)}m by ${m1(unit.h)}m.` +
    ` Render the marble at this true real-world scale: the veining and the seams where slabs meet must appear at realistic size for the room, not stretched into one seamless sheet and not shrunk into small tiles.` +
    count
  ).trim();
}
