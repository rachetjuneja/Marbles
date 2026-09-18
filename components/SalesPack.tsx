"use client";
import type { StoneMeta, Surface } from "@/lib/types";

export interface PackItem {
  resultUrl: string;
  stone: StoneMeta;
  surface: Surface;
}

const AREA: Record<Surface, number> = {
  single_wall: 96,
  all_walls: 210,
  floor: 140,
  countertops: 28,
  staircase: 60,
  table: 18,
};

export default function SalesPack({
  open,
  onClose,
  customerName,
  customerMobile,
  items,
}: {
  open: boolean;
  onClose: () => void;
  customerName: string;
  customerMobile: string;
  items: PackItem[];
}) {
  if (!open) return null;
  const rows = items.length ? items : [];
  const inr = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");

  function copy() {
    const lines = rows.map((r) => {
      const area = AREA[r.surface];
      const est = (r.stone.pricePerSqft || 0) * area;
      return `• ${r.stone.name}: ₹${r.stone.pricePerSqft || "?"}/sq ft, ${r.surface.replace("_", " ")} ~${area} sq ft, est ${inr(est)}`;
    });
    const text = `Sales pack for ${customerName} (${customerMobile})\n` + lines.join("\n");
    navigator.clipboard?.writeText(text).catch(() => {});
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-5" onClick={onClose}>
      <div className="card w-[min(560px,96vw)] max-h-[88vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-line sticky top-0 bg-panel">
          <h3 className="font-display text-lg">Client sales pack</h3>
          <button className="btn !py-1.5 text-xs" onClick={onClose}>Close ✕</button>
        </div>
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-display text-lg">{customerName}</div>
              <div className="text-muted text-xs">{customerMobile}</div>
            </div>
            <div className="text-right text-xs text-muted">
              <div className="uppercase tracking-widest text-[10px]">Prepared by</div>
              <div>Showroom · The Sales OS</div>
            </div>
          </div>

          {rows.length === 0 ? (
            <div className="text-faint text-sm text-center border border-dashed border-line rounded-lg py-8">
              Nothing shortlisted yet. Star a render to add it here.
            </div>
          ) : (
            rows.map((r, i) => {
              const area = AREA[r.surface];
              const est = (r.stone.pricePerSqft || 0) * area;
              return (
                <div key={i} className="flex gap-3 items-center py-2.5 border-b border-line">
                  <img src={r.resultUrl} alt="" className="w-16 h-12 object-cover rounded-md border border-line" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{r.stone.name}</div>
                    <div className="text-muted text-[11.5px]">
                      {[r.surface.replace("_", " "), r.stone.stoneType, r.stone.size,
                        r.stone.thicknessMm ? `${r.stone.thicknessMm}mm` : null, r.stone.finish,
                        `₹${r.stone.pricePerSqft || "?"}/sq ft`].filter(Boolean).join(" · ")}
                    </div>
                  </div>
                  <div className="text-accent font-semibold text-sm whitespace-nowrap">{est ? inr(est) : "—"}</div>
                </div>
              );
            })
          )}

          <div className="flex gap-2 mt-4">
            <button className="btn btn-gold" onClick={() => alert("WhatsApp hand-off is stubbed in this concept.")}>Send on WhatsApp</button>
            <button className="btn" onClick={copy}>Copy summary</button>
          </div>
          <div className="text-faint text-[11px] mt-3 leading-relaxed">
            Concept demo. Material estimate only (excludes wastage, edge profiling, fixing and taxes). In the
            full Sales OS this pack renders as a branded PDF and starts an automated follow up sequence.
          </div>
        </div>
      </div>
    </div>
  );
}
