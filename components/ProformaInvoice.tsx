"use client";
import type { SavedRender } from "@/lib/types";

export default function ProformaInvoice({
  open,
  onClose,
  items,
  customerName,
  customerMobile,
}: {
  open: boolean;
  onClose: () => void;
  items: SavedRender[];
  customerName: string;
  customerMobile: string;
}) {
  if (!open) return null;

  const inr = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");
  const rows = items.map((it) => {
    const qty = it.qty || 0;
    const rate = it.stone.pricePerSqft || 0;
    return { name: it.stone.name, detail: [it.stone.stoneType, it.stone.finish, it.surface.replace("_", " ")].filter(Boolean).join(", "), qty, rate, amount: qty * rate };
  });
  const subtotal = rows.reduce((s, r) => s + r.amount, 0);
  const cgst = subtotal * 0.09;
  const sgst = subtotal * 0.09;
  const total = subtotal + cgst + sgst;
  const invNo = "PI-" + new Date().toISOString().slice(0, 10).replace(/-/g, "") + "-" + String(Date.now()).slice(-4);
  const dateStr = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  function printInvoice() {
    const rowsHtml = rows
      .map(
        (r) =>
          `<tr><td>${r.name}<div class="sub">${r.detail}</div></td><td class="num">${r.qty}</td><td class="num">${inr(r.rate)}</td><td class="num">${inr(r.amount)}</td></tr>`
      )
      .join("");
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${invNo}</title>
    <style>
      *{font-family:Georgia,serif;color:#1a1a1a}
      body{margin:40px;font-size:13px}
      .top{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #c9a25e;padding-bottom:16px}
      .brand{font-size:20px;font-weight:bold}
      .muted{color:#666;font-size:12px}
      h1{font-size:22px;margin:20px 0 4px}
      .meta{display:flex;justify-content:space-between;margin:16px 0}
      table{width:100%;border-collapse:collapse;margin-top:10px}
      th,td{text-align:left;padding:9px 8px;border-bottom:1px solid #ddd;vertical-align:top}
      th{font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#666}
      .num{text-align:right;white-space:nowrap}
      .sub{color:#888;font-size:11px;margin-top:2px}
      .totals{margin-left:auto;width:280px;margin-top:14px}
      .totals div{display:flex;justify-content:space-between;padding:5px 8px}
      .totals .grand{border-top:2px solid #c9a25e;font-weight:bold;font-size:15px;margin-top:4px}
      .foot{margin-top:28px;color:#888;font-size:11px;line-height:1.5}
    </style></head><body>
      <div class="top">
        <div><div class="brand">The Sales OS</div><div class="muted">Tile &amp; Marble Showroom</div></div>
        <div style="text-align:right"><h1 style="margin:0">Proforma Invoice</h1><div class="muted">${invNo}<br>${dateStr}</div></div>
      </div>
      <div class="meta">
        <div><div class="muted">Bill to</div><b>${customerName || "Customer"}</b><div class="muted">${customerMobile || ""}</div></div>
      </div>
      <table><thead><tr><th>Item</th><th class="num">Area (sq ft)</th><th class="num">Rate</th><th class="num">Amount</th></tr></thead>
      <tbody>${rowsHtml}</tbody></table>
      <div class="totals">
        <div><span>Subtotal</span><span>${inr(subtotal)}</span></div>
        <div><span>CGST 9%</span><span>${inr(cgst)}</span></div>
        <div><span>SGST 9%</span><span>${inr(sgst)}</span></div>
        <div class="grand"><span>Total</span><span>${inr(total)}</span></div>
      </div>
      <div class="foot">This is a proforma invoice, not a tax invoice. Prices are indicative and exclude wastage, edge profiling, fixing and delivery unless stated. Valid for 15 days.</div>
    </body></html>`;
    const w = window.open("", "_blank", "width=800,height=900");
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 300);
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center p-5" onClick={onClose}>
      <div className="card w-[min(620px,96vw)] max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-line sticky top-0 bg-panel">
          <h3 className="font-display text-lg">Proforma invoice</h3>
          <div className="flex gap-2">
            <button className="btn btn-gold !py-1.5 text-xs" onClick={printInvoice}>Print / Save PDF</button>
            <button className="btn !py-1.5 text-xs" onClick={onClose}>Close ✕</button>
          </div>
        </div>
        <div className="p-5">
          <div className="flex justify-between items-start pb-3 border-b border-line">
            <div>
              <div className="font-display text-lg">The Sales OS</div>
              <div className="text-muted text-xs">Tile &amp; Marble Showroom</div>
            </div>
            <div className="text-right text-xs text-muted">
              <div className="text-ink text-sm font-medium">{invNo}</div>
              <div>{dateStr}</div>
            </div>
          </div>
          <div className="my-3 text-sm">
            <div className="text-muted text-[11px] uppercase tracking-widest">Bill to</div>
            <div className="font-medium">{customerName || "Customer"}</div>
            <div className="text-muted text-xs">{customerMobile}</div>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted text-[11px] uppercase tracking-wider">
                <th className="text-left py-2">Item</th>
                <th className="text-right py-2">Area</th>
                <th className="text-right py-2">Rate</th>
                <th className="text-right py-2">Amount</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-t border-line align-top">
                  <td className="py-2">{r.name}<div className="text-muted text-[11px]">{r.detail}</div></td>
                  <td className="py-2 text-right whitespace-nowrap">{r.qty} sq ft</td>
                  <td className="py-2 text-right whitespace-nowrap">{inr(r.rate)}</td>
                  <td className="py-2 text-right whitespace-nowrap">{inr(r.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="ml-auto w-[260px] mt-3 text-sm">
            <div className="flex justify-between py-1"><span className="text-muted">Subtotal</span><span>{inr(subtotal)}</span></div>
            <div className="flex justify-between py-1"><span className="text-muted">CGST 9%</span><span>{inr(cgst)}</span></div>
            <div className="flex justify-between py-1"><span className="text-muted">SGST 9%</span><span>{inr(sgst)}</span></div>
            <div className="flex justify-between py-2 border-t border-accent font-semibold text-base"><span>Total</span><span className="text-accent">{inr(total)}</span></div>
          </div>
          <div className="text-faint text-[11px] mt-4 leading-relaxed">
            This is a proforma invoice, not a tax invoice. Prices are indicative and exclude wastage, edge profiling, fixing and delivery unless stated. Valid for 15 days.
          </div>
        </div>
      </div>
    </div>
  );
}
