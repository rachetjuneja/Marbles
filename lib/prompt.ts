import type { Surface } from "./types";

const SURFACE_PHRASE: Record<Surface, string> = {
  single_wall: "the single main feature wall",
  all_walls: "all of the visible walls",
  floor: "the floor",
  countertops: "the countertop surfaces",
  staircase: "the staircase steps and risers",
  table: "the table top",
};

export interface Target {
  surface: Surface;
  label?: string;
}

function phraseFor(surface: Surface, targetLabel?: string): string {
  const t = (targetLabel || "").trim().toLowerCase();
  if (!t) return SURFACE_PHRASE[surface];
  return t.startsWith("the ") ? t : "the " + t;
}

function joinNatural(parts: string[]): string {
  if (parts.length <= 1) return parts[0] || "the chosen surface";
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
  return `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
}

/**
 * Instruction for an image-editing model. First image = the room. Second image =
 * the marble/stone to apply (already book-matched if that option is on).
 * scaleNote carries the book-match pattern and the real-world slab scale so the
 * veins and seams render at true size on the surface.
 */
export function buildPrompt(targets: Target[], stoneName?: string, scaleNote?: string): string {
  const list = targets.length ? targets : [{ surface: "single_wall" as Surface }];
  const where = joinNatural(list.map((t) => phraseFor(t.surface, t.label)));
  const name = stoneName ? ` (${stoneName})` : "";
  const scale = scaleNote ? " " + scaleNote.trim() : "";
  return (
    `Take the first image (a real interior photo) and replace only ${where} with the marble/stone shown in the second image${name}. ` +
    `Apply the same stone to ${list.length > 1 ? "every one of those surfaces" : "that surface"}. ` +
    `Keep the room's exact geometry, camera angle, perspective, proportions, lighting, shadows, reflections, and every other object and surface completely unchanged. ` +
    `Apply the stone photorealistically: correct perspective and real-world scale, natural polished reflections and soft shadowing consistent with the room's existing light. ` +
    `Do not add, remove, or move any objects. Do not restyle the room. Change ${where} and nothing else.` +
    scale
  );
}
