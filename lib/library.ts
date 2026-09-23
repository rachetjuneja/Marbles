import type { SceneRef, StoneMeta } from "./types";

// Starter library. Replace these with your own scenes and real slab scans.
// Files live in /public/library so they work with zero backend config.

export const LIBRARY_SCENES: (SceneRef & { id: string; name: string })[] = [
  { id: "scene-living", name: "Living room feature wall", imageUrl: "/library/scene_living.png", source: "library" },
  { id: "scene-hall", name: "Marble hall", imageUrl: "/library/scene_hall.png", source: "library" },
  { id: "scene-foyer", name: "Grand foyer floor", imageUrl: "/library/scene_foyer.png", source: "library" },
];

// NOTE: names, sizes, thickness and prices below are PLACEHOLDERS. Send me the
// real values (or edit here) and they flow straight through to the sales pack.
export const LIBRARY_STONES: (StoneMeta & { id: string; imageUrl: string })[] = [
  {
    id: "alaska-white",
    name: "Alaska White",
    stoneType: "Quartzite",
    origin: "Brazil",
    size: "3200 x 1600 mm",
    thicknessMm: 20,
    finish: "Polished",
    pricePerSqft: 1250,
    slabsInStock: 14,
    lotNo: "AW-2231",
    source: "library",
    imageUrl: "/library/stone_white.png",
  },
  {
    id: "cappuccino",
    name: "Cappuccino Marble",
    stoneType: "Marble",
    origin: "Italy",
    size: "2800 x 1600 mm",
    thicknessMm: 18,
    finish: "Polished",
    pricePerSqft: 780,
    slabsInStock: 8,
    lotNo: "CP-1187",
    source: "library",
    imageUrl: "/library/stone_brown.png",
  },
  {
    id: "crema-marfil",
    name: "Crema Marfil",
    stoneType: "Marble",
    origin: "Spain",
    size: "3050 x 1550 mm",
    thicknessMm: 18,
    finish: "Polished",
    pricePerSqft: 620,
    slabsInStock: 22,
    lotNo: "CM-0642",
    source: "library",
    imageUrl: "/library/stone_cream.png",
  },
];
