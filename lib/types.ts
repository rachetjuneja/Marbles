export type Surface =
  | "single_wall"
  | "all_walls"
  | "floor"
  | "countertops"
  | "staircase";

export const SURFACES: { id: Surface; label: string }[] = [
  { id: "single_wall", label: "Single Wall" },
  { id: "all_walls", label: "All Walls" },
  { id: "floor", label: "Floor" },
  { id: "countertops", label: "Countertops" },
  { id: "staircase", label: "Staircase" },
];

export interface StoneMeta {
  id?: string;
  name: string;
  stoneType?: string; // Marble / Granite / Quartzite / Onyx / Quartz
  origin?: string; // country or region
  size?: string; // slab size, e.g. "3200 x 1600 mm"
  thicknessMm?: number; // slab thickness in mm
  finish?: string; // Polished / Honed / Leather / Brushed
  pricePerSqft?: number;
  source: "library" | "upload";
}

export const STONE_TYPES = ["Marble", "Granite", "Quartzite", "Onyx", "Quartz"];
export const FINISHES = ["Polished", "Honed", "Leather", "Brushed"];

// Indicative area per surface (sq ft), used as the default quantity in the cart.
export const SURFACE_AREA: Record<Surface, number> = {
  single_wall: 96,
  all_walls: 210,
  floor: 140,
  countertops: 28,
  staircase: 60,
};

export interface SavedRender {
  key: string;
  resultUrl: string;
  surface: Surface;
  stone: StoneMeta;
  qty?: number; // sq ft, used in the cart
}

export interface SceneRef {
  id?: string;
  name?: string;
  imageUrl: string; // URL or data: URL
  source: "library" | "upload";
}

export interface RenderRow {
  id: string;
  projectId: string;
  sceneUrl: string;
  resultUrl: string;
  surface: Surface;
  model: string;
  bookmatch: boolean;
  stone: StoneMeta;
  shortlisted: boolean;
  createdAt: string;
}

export interface SessionRow {
  id: string;
  customerName: string;
  customerMobile: string;
  createdAt: string;
}

export interface UploadToken {
  token: string;
  projectId: string;
  kind: "scene" | "stone";
  status: "pending" | "done";
  url?: string;
  createdAt: string;
}
