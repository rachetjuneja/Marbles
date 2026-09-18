"use client";
import type { SavedRender } from "@/lib/types";

export default function WishlistDrawer({
  open,
  onClose,
  items,
  onRemove,
  customerName,
  customerMobile,
}: {
  open: boolean;
  onClose: () => void;
  items: SavedRender[];
  onRemove: (key: string) => void;
  customerName: string;
  customerMobile: string;
}) {
  if (!open) return null;

  function shareWhatsApp() {
    const num = (customerMobile || "").replace(/\D/g, "");
    const wa = num.length === 10 ? "91" + num : num;
    const lines = items.map((it, i) => {
      const bits = [it.stone.name, it.stone.size, it.stone.pricePerSqft ? `₹${it.stone.pricePerSqft}/sq ft` : null]
        .filter(Boolean)
        .join(", ");
      const link = it.resultUrl.startsWith("http") ? `\n   ${it.resultUrl}` : "";
      return `${i + 1}. ${bits}${link}`;
    });
    const text =
      `Hi ${customerName || "there"}, here are the marble options from your visit:\n\n` +
      `${lines.join("\n")}\n\nShared by The Sales OS.`;
    window.open(`https://wa.me/${wa}?text=${encodeURIComponent(text)}`, "_blank");
  }

  const hasLinks = items.some((it) => it.resultUrl.startsWith("http"));

  return (
    <div className="fixed inset-0 z-50 flex" onClick={onClose}>
      <div className="flex-1 bg-black/60" />
      <div className="w-[380px] max-w-[92vw] h-full bg-panel border-l border-line flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-line">
          <h3 className="font-display text-lg">Wishlist</h3>
          <button className="btn !py-1.5 text-xs" onClick={onClose}>Close ✕</button>
        </div>
        <div className="flex-1 overflow-auto p-4 flex flex-col gap-2.5">
          {items.length === 0 ? (
            <div className="text-faint text-sm text-center border border-dashed border-line rounded-lg py-10">
              Add renders here with the ♥ button, then share them with the customer.
            </div>
          ) : (
            items.map((it) => (
              <div key={it.key} className="flex gap-3 items-center bg-panel2 border border-line rounded-lg p-2">
                <img src={it.resultUrl} alt="" className="w-16 h-12 object-cover rounded-md border border-line" />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium truncate">{it.stone.name}</div>
                  <div className="text-[11px] text-muted truncate">
                    {[it.surface.replace("_", " "), it.stone.size, it.stone.pricePerSqft ? `₹${it.stone.pricePerSqft}/sq ft` : null].filter(Boolean).join(" · ")}
                  </div>
                </div>
                <button className="text-faint hover:text-danger text-base px-1" onClick={() => onRemove(it.key)}>✕</button>
              </div>
            ))
          )}
        </div>
        <div className="p-4 border-t border-line">
          <button className="btn btn-gold w-full justify-center" disabled={!items.length} onClick={shareWhatsApp}>
            Share on WhatsApp
          </button>
          <div className="text-faint text-[11px] mt-2 leading-relaxed">
            {hasLinks
              ? "Opens WhatsApp to the customer's number with the options and render links."
              : "Opens WhatsApp with a text summary. Render image links are included once the app runs on a deployed URL (local renders are not shareable as links)."}
          </div>
        </div>
      </div>
    </div>
  );
}
