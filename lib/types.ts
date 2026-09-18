export type Surface =
  | "single_wall"
  | "all_walls"
  | "floor"
  | "countertops"
  | "staircase"
  | "table";

export const SURFACES: { id: Surface; label: string }[] = [
  { id: "single_wall", label: "Single Wall" },
  { id: "all_walls", label: "All Walls" },
  { id: "floor", label: "Floor" },
  { id: "countertops", label: "Countertops" },
  { id: "staircase", label: "Staircase" },
  { id: "table", label: "Table" },
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
  table: 18,
};

// Raw detection as returned by the vision model (box in 0..1000, model's own labels).
export interface RawDetection {
  label: string;
  category: string;
  box_2d: [number, number, number, number]; // ymin, xmin, ymax, xmax on a 0..1000 scale
}

// A surface the vision model found in the room where stone can be applied.
export interface DetectedSurface {
  id: string;
  label: string; // human name, e.g. "Floor", "Left wall", "Kitchen countertop"
  category: string; // raw category from the model
  surface: Surface; // mapped canonical surface (drives area + prompt phrasing)
  box: [number, number, number, number]; // y0, x0, y1, x1 normalised 0..1
}

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
