"use client";
import type { SavedRender } from "@/lib/types";

export default function CartDrawer({
  open,
  onClose,
  items,
  onRemove,
  onQty,
  onInvoice,
}: {
  open: boolean;
  onClose: () => void;
  items: SavedRender[];
  onRemove: (key: string) => void;
  onQty: (key: string, qty: number) => void;
  onInvoice: () => void;
}) {
  if (!open) return null;
  const inr = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");
  const lineAmt = (it: SavedRender) => (it.qty || 0) * (it.stone.pricePerSqft || 0);
  const subtotal = items.reduce((s, it) => s + lineAmt(it), 0);
  const gst = subtotal * 0.18;

  return (
    <div className="fixed inset-0 z-50 flex" onClick={onClose}>
      <div className="flex-1 bg-black/60" />
      <div className="w-[400px] max-w-[94vw] h-full bg-panel border-l border-line flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-line">
          <h3 className="font-display text-lg">Cart</h3>
          <button className="btn !py-1.5 text-xs" onClick={onClose}>Close ✕</button>
        </div>
        <div className="flex-1 overflow-auto p-4 flex flex-col gap-2.5">
          {items.length === 0 ? (
            <div className="text-faint text-sm text-center border border-dashed border-line rounded-lg py-10">
              Add renders here with the cart button to build a proforma invoice.
            </div>
          ) : (
            items.map((it) => (
              <div key={it.key} className="bg-panel2 border border-line rounded-lg p-2.5">
                <div className="flex gap-3 items-center">
                  <img src={it.resultUrl} alt="" className="w-14 h-11 object-cover rounded-md border border-line" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium truncate">{it.stone.name}</div>
                    <div className="text-[11px] text-muted truncate">
                      {[it.surface.replace("_", " "), it.stone.finish, `₹${it.stone.pricePerSqft || "?"}/sq ft`].filter(Boolean).join(" · ")}
                    </div>
                  </div>
                  <button className="text-faint hover:text-danger text-base px-1" onClick={() => onRemove(it.key)}>✕</button>
                </div>
                <div className="flex items-center justify-between mt-2 gap-2">
                  <label className="text-[11px] text-muted flex items-center gap-1.5">
                    Area
                    <input
                      type="number"
                      min={0}
                      value={it.qty ?? 0}
                      onChange={(e) => onQty(it.key, Number(e.target.value))}
                      className="input !py-1 !px-2 w-20 text-xs"
                    />
                    sq ft
                  </label>
                  <div className="text-accent text-[13px] font-semibold">{inr(lineAmt(it))}</div>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="p-4 border-t border-line">
          <div className="flex justify-between text-sm mb-1"><span className="text-muted">Subtotal</span><span>{inr(subtotal)}</span></div>
          <div className="flex justify-between text-sm mb-1"><span className="text-muted">GST 18%</span><span>{inr(gst)}</span></div>
          <div className="flex justify-between text-base font-semibold mb-3"><span>Total</span><span className="text-accent">{inr(subtotal + gst)}</span></div>
          <button className="btn btn-gold w-full justify-center" disabled={!items.length} onClick={onInvoice}>
            Generate proforma invoice
          </button>
        </div>
      </div>
    </div>
  );
}
