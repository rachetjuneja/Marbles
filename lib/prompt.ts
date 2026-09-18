import type { Surface } from "./types";

const SURFACE_PHRASE: Record<Surface, string> = {
  single_wall: "the single main feature wall",
  all_walls: "all of the visible walls",
  floor: "the floor",
  countertops: "the countertop surfaces",
  staircase: "the staircase steps and risers",
};

/**
 * Instruction for an image-editing model. First image = the room. Second image =
 * the marble/stone to apply (already book-matched if that option is on).
 */
export function buildPrompt(surface: Surface, bookmatch: boolean, stoneName?: string): string {
  const where = SURFACE_PHRASE[surface];
  const name = stoneName ? ` (${stoneName})` : "";
  const bm = bookmatch
    ? " The stone image is a book-matched slab layout — preserve its mirror symmetry so the veins meet as a continuous book-match across the surface."
    : "";
  return (
    `Take the first image (a real interior photo) and replace only ${where} with the marble/stone shown in the second image${name}. ` +
    `Keep the room's exact geometry, camera angle, perspective, proportions, lighting, shadows, reflections, and every other object and surface completely unchanged. ` +
    `Apply the stone photorealistically: correct perspective and real-world scale, natural polished reflections and soft shadowing consistent with the room's existing light. ` +
    `Do not add, remove, or move any objects. Do not restyle the room. Change ${where} and nothing else.` +
    bm
  );
}
