"use client";
import type { DetectedSurface } from "@/lib/types";

/**
 * Draws the detected surfaces on top of the room image. The wrapper it sits in
 * is sized exactly to the rendered image, so a box at [y0,x0,y1,x1] (0..1) lines
 * up with the real surface. The active surface gets a spotlight so the rep sees
 * exactly where the stone will land.
 */
export default function SurfaceOverlay({
  surfaces,
  activeIds,
  hoverId,
  onPick,
  onHover,
}: {
  surfaces: DetectedSurface[];
  activeIds: string[];
  hoverId: string | null;
  onPick: (s: DetectedSurface) => void;
  onHover: (id: string | null) => void;
}) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {surfaces.map((s) => {
        const [y0, x0, y1, x1] = s.box;
        const active = activeIds.includes(s.id);
        const hover = s.id === hoverId;
        const style = {
          top: `${y0 * 100}%`,
          left: `${x0 * 100}%`,
          width: `${(x1 - x0) * 100}%`,
          height: `${(y1 - y0) * 100}%`,
        };
        return (
          <button
            key={s.id}
            type="button"
            style={style}
            onClick={() => onPick(s)}
            onMouseEnter={() => onHover(s.id)}
            onMouseLeave={() => onHover(null)}
            className={[
              "absolute rounded-md pointer-events-auto cursor-pointer transition-all group",
              active
                ? "border-2 border-accent bg-accent/25 z-10"
                : hover
                ? "border-2 border-accent/80 bg-accent/10"
                : "border border-dashed border-white/50 hover:border-accent/70",
            ].join(" ")}
          >
            <span
              className={[
                "absolute top-1 left-1 text-[10px] font-medium px-1.5 py-0.5 rounded whitespace-nowrap max-w-[95%] truncate",
                active ? "bg-accent text-[#1a1508]" : "bg-black/70 text-white group-hover:bg-accent group-hover:text-[#1a1508]",
              ].join(" ")}
            >
              {active ? "◉ " : ""}
              {s.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
