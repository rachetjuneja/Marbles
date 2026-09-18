"use client";
import { useEffect, useState } from "react";
import { buildBookmatch } from "@/lib/bookmatch";
import { parseSlab, unitDims, ratioLabel, slabsForArea, PATTERN_LABEL } from "@/lib/bookmatch-calc";
import type { BookmatchOptions, BookmatchPattern } from "@/lib/types";
import type { PickedStone } from "./TilePicker";

const PATTERNS: { id: BookmatchPattern; label: string; note: string }[] = [
  { id: "book", label: "Book", note: "Two slabs mirrored, a butterfly across one seam" },
  { id: "four_way", label: "4-way", note: "Four slabs mirrored, veins radiate from the centre" },
  { id: "diamond", label: "Diamond", note: "A four-way turned on point, veins form a diamond" },
  { id: "slip", label: "Slip", note: "Same slab repeated, no mirror" },
];

const ROTATIONS: BookmatchOptions["rotation"][] = [0, 90, 180, 270];

export default function BookmatchStudio({
  tile,
  options,
  onChange,
  areaSqft,
  suggestion,
}: {
  tile: PickedStone | null;
  options: BookmatchOptions;
  onChange: (o: BookmatchOptions) => void;
  areaSqft: number;
  suggestion?: BookmatchPattern;
}) {
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    if (!tile) { setPreview(null); return; }
    buildBookmatch(tile.imageUrl, options)
      .then((u) => { if (alive) setPreview(u); })
      .catch(() => { if (alive) setPreview(null); });
    return () => { alive = false; };
  }, [tile?.imageUrl, options.pattern, options.direction, options.rotation]);

  const set = (o: Partial<BookmatchOptions>) => onChange({ ...options, ...o });
  const slab = parseSlab(tile?.size);
  const unit = slab ? unitDims(slab, options.pattern, options.direction) : null;
  const ratio = unit ? ratioLabel(unit.w, unit.h) : null;
  const slabs = slab ? slabsForArea(areaSqft, slab) : 0;
  const cur = PATTERNS.find((p) => p.id === options.pattern)!;

  return (
    <div className="card p-4">
      <h3 className="font-display text-base mb-1">Book match studio</h3>
      <p className="text-muted text-[11px] mb-3">Play with the layout live. This exact arrangement is sent to the render.</p>

      {/* Live preview with a seam-direction guide */}
      <div className="relative rounded-lg overflow-hidden border border-line bg-black aspect-[4/3] mb-3 grid place-items-center">
        {preview ? (
          <img src={preview} alt="book match preview" className="max-w-full max-h-full object-contain" />
        ) : (
          <div className="text-faint text-xs">{tile ? "Composing…" : "Pick a tile to preview"}</div>
        )}
        {preview && (
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none">
            {options.pattern === "book" && options.direction === "vertical" && <line x1="50" y1="0" x2="50" y2="100" stroke="#c9a25e" strokeWidth="0.6" strokeDasharray="3 2" />}
            {options.pattern === "book" && options.direction === "horizontal" && <line x1="0" y1="50" x2="100" y2="50" stroke="#c9a25e" strokeWidth="0.6" strokeDasharray="3 2" />}
            {options.pattern === "four_way" && <><line x1="50" y1="0" x2="50" y2="100" stroke="#c9a25e" strokeWidth="0.6" strokeDasharray="3 2" /><line x1="0" y1="50" x2="100" y2="50" stroke="#c9a25e" strokeWidth="0.6" strokeDasharray="3 2" /></>}
            {options.pattern === "diamond" && <><line x1="0" y1="0" x2="100" y2="100" stroke="#c9a25e" strokeWidth="0.6" strokeDasharray="3 2" /><line x1="100" y1="0" x2="0" y2="100" stroke="#c9a25e" strokeWidth="0.6" strokeDasharray="3 2" /></>}
            {options.pattern === "slip" && <><line x1="50" y1="0" x2="50" y2="100" stroke="#ffffff" strokeOpacity="0.4" strokeWidth="0.5" strokeDasharray="2 2" /><line x1="0" y1="50" x2="100" y2="50" stroke="#ffffff" strokeOpacity="0.4" strokeWidth="0.5" strokeDasharray="2 2" /></>}
          </svg>
        )}
      </div>

      {/* Pattern */}
      <div className="grid grid-cols-4 gap-1.5 mb-2">
        {PATTERNS.map((p) => (
          <button
            key={p.id}
            onClick={() => set({ pattern: p.id })}
            className={`px-1.5 py-1.5 rounded-lg text-xs border transition-colors ${options.pattern === p.id ? "bg-accent text-[#1a1508] border-accent font-semibold" : "border-line text-muted hover:border-accent/60"}`}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="text-faint text-[11px] mb-3">{cur.note}</div>

      {/* Direction + rotation */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {options.pattern === "book" && (
          <div className="inline-flex rounded-lg overflow-hidden border border-line">
            <button onClick={() => set({ direction: "vertical" })} className={`px-2.5 py-1.5 text-xs ${options.direction === "vertical" ? "bg-accent text-[#1a1508] font-semibold" : "text-muted"}`}>Vertical seam</button>
            <button onClick={() => set({ direction: "horizontal" })} className={`px-2.5 py-1.5 text-xs ${options.direction === "horizontal" ? "bg-accent text-[#1a1508] font-semibold" : "text-muted"}`}>Horizontal seam</button>
          </div>
        )}
        <button
          onClick={() => set({ rotation: ROTATIONS[(ROTATIONS.indexOf(options.rotation) + 1) % 4] })}
          className="btn !py-1.5 !px-2.5 text-xs"
        >
          Rotate slab ⟳ {options.rotation}°
        </button>
      </div>

      {/* Real-world info */}
      <div className="rounded-lg border border-line bg-panel2 p-3 text-xs flex flex-col gap-1">
        {slab ? (
          <>
            <div className="flex justify-between"><span className="text-muted">Slab</span><span>{(slab.w / 1000).toFixed(2)}m × {(slab.h / 1000).toFixed(2)}m</span></div>
            <div className="flex justify-between"><span className="text-muted">Layout unit</span><span>{ratio} ({(unit!.w / 1000).toFixed(2)}m × {(unit!.h / 1000).toFixed(2)}m)</span></div>
            {slabs > 0 && <div className="flex justify-between"><span className="text-muted">Slabs for this area</span><span className="text-accent">~{slabs}</span></div>}
          </>
        ) : (
          <div className="text-faint">Add the slab size on the tile to compute the layout ratio and slab count.</div>
        )}
      </div>

      {suggestion && suggestion !== options.pattern && (
        <button className="text-[11px] text-accent mt-2 hover:underline" onClick={() => set({ pattern: suggestion })}>
          Suggested for this surface: {PATTERN_LABEL[suggestion]} · use it
        </button>
      )}
    </div>
  );
}
