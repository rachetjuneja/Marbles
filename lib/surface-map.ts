import type { DetectedSurface, RawDetection, Surface } from "./types";

/** Map a free-text category from the vision model onto a canonical surface. */
export function categoryToSurface(category: string): Surface {
  const c = (category || "").toLowerCase();
  if (c.includes("floor") || c.includes("ground")) return "floor";
  if (c.includes("stair") || c.includes("step") || c.includes("riser")) return "staircase";
  if (c.includes("counter") || c.includes("backsplash") || c.includes("island") || c.includes("vanity") || c.includes("splash")) return "countertops";
  if (c.includes("table") || c.includes("desk") || c.includes("top")) return "table";
  if (c.includes("wall")) return "single_wall";
  return "single_wall";
}

const clamp = (n: number) => Math.max(0, Math.min(1, n));
const areaOf = (b: [number, number, number, number]) => (b[2] - b[0]) * (b[3] - b[1]);

/**
 * Turn raw model detections (boxes on a 0..1000 scale) into DetectedSurface
 * objects with normalised 0..1 boxes, canonical surfaces, and specks removed.
 */
export function toDetectedSurfaces(raw: RawDetection[]): DetectedSurface[] {
  const out: DetectedSurface[] = [];
  raw.forEach((d, i) => {
    if (!Array.isArray(d.box_2d) || d.box_2d.length !== 4) return;
    const [a, b, c, e] = d.box_2d.map((n) => Number(n) / 1000);
    if ([a, b, c, e].some((n) => Number.isNaN(n))) return;
    const y0 = clamp(Math.min(a, c));
    const y1 = clamp(Math.max(a, c));
    const x0 = clamp(Math.min(b, e));
    const x1 = clamp(Math.max(b, e));
    if (x1 - x0 < 0.02 || y1 - y0 < 0.02) return; // drop specks
    out.push({
      id: `det-${i}`,
      label: (d.label || "Surface").trim(),
      category: (d.category || "other").toLowerCase(),
      surface: categoryToSurface(d.category),
      box: [y0, x0, y1, x1],
    });
  });
  // biggest first so the primary surfaces lead, cap the list so the UI stays clean.
  out.sort((p, q) => areaOf(q.box) - areaOf(p.box));
  return out.slice(0, 8);
}
