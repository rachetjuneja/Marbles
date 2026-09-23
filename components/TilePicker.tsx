"use client";
import { useMemo, useState } from "react";
import { LIBRARY_STONES } from "@/lib/library";
import { STONE_TYPES, FINISHES } from "@/lib/types";
import type { StoneMeta } from "@/lib/types";
import { parseSlab, slabAreaSqft } from "@/lib/bookmatch-calc";
import UploadDialog from "./UploadDialog";

export type PickedStone = StoneMeta & { imageUrl: string };

const emptyForm = { name: "", stoneType: "Marble", origin: "", size: "", thickness: "", finish: "Polished", price: "", slabs: "", lotNo: "" };
const LOW_STOCK = 5;

function coverage(s: PickedStone) {
  const slab = parseSlab(s.size);
  return slab ? slabAreaSqft(slab) : 0;
}
function totalArea(s: PickedStone) {
  const c = coverage(s);
  return s.slabsInStock && c ? Math.round(s.slabsInStock * c) : 0;
}

/** An inventory card: image, specs, stock, and explicit Select / Details buttons. */
function InventoryCard({ s, on, onToggle, onInfo }: { s: PickedStone; on: boolean; onToggle: () => void; onInfo: () => void }) {
  const ta = totalArea(s);
  const low = s.slabsInStock != null && s.slabsInStock <= LOW_STOCK;
  return (
    <div className={`rounded-2xl border bg-panel2 overflow-hidden transition-all ${on ? "border-accent ring-1 ring-accent/40" : "border-line"}`}>
      <div className="relative aspect-[16/10]">
        <img src={s.imageUrl} alt={s.name} className="w-full h-full object-cover" />
        {s.slabsInStock != null && (
          <span className={`absolute top-2 right-2 text-[10px] px-2 py-0.5 rounded-full bg-black/60 border ${low ? "border-danger/60 text-danger" : "border-white/25 text-white/80"}`}>
            {low ? "Low stock" : "In stock"} · {s.slabsInStock}
          </span>
        )}
        {on && <span className="absolute top-2 left-2 w-6 h-6 rounded-full bg-accent text-[#1a1508] grid place-items-center text-xs font-bold shadow">✓</span>}
      </div>
      <div className="p-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="font-medium truncate">{s.name}</div>
            <div className="text-[11px] text-muted truncate">{[s.size, s.finish, s.origin].filter(Boolean).join(" · ")}</div>
          </div>
          {s.stoneType && <span className="text-[10px] uppercase tracking-wide text-faint border border-line rounded px-1.5 py-0.5 shrink-0">{s.stoneType}</span>}
        </div>
        <div className="flex items-center justify-between mt-2.5">
          {s.pricePerSqft ? (
            <div className="text-accent text-sm font-semibold">₹{s.pricePerSqft}<span className="text-[11px] text-muted font-normal">/sq ft</span></div>
          ) : <div />}
          {s.slabsInStock != null && <div className="text-[11px] text-muted">{s.slabsInStock} slabs{ta ? ` · ~${ta} sq ft` : ""}</div>}
        </div>
        <div className="flex gap-2 mt-3.5">
          <button className={`btn !py-1.5 text-xs flex-1 justify-center ${on ? "" : "btn-gold"}`} onClick={onToggle}>{on ? "Selected ✓" : "Select"}</button>
          <button className="btn !py-1.5 text-xs flex-1 justify-center" onClick={onInfo}>Details</button>
        </div>
      </div>
    </div>
  );
}

/** Full spec sheet for one marble. */
function StoneDetails({ stone, on, onToggle, onClose }: { stone: PickedStone; on: boolean; onToggle: () => void; onClose: () => void }) {
  const c = coverage(stone);
  const ta = totalArea(stone);
  const rows: [string, string | null][] = [
    ["Type", stone.stoneType || null],
    ["Origin", stone.origin || null],
    ["Finish", stone.finish || null],
    ["Slab size", stone.size || null],
    ["Thickness", stone.thicknessMm ? `${stone.thicknessMm} mm` : null],
    ["Coverage per slab", c ? `~${c.toFixed(1)} sq ft` : null],
    ["Slabs in stock", stone.slabsInStock != null ? String(stone.slabsInStock) : null],
    ["Total area in stock", ta ? `~${ta} sq ft` : null],
    ["Price", stone.pricePerSqft ? `₹${stone.pricePerSqft}/sq ft` : null],
    ["Lot / block no", stone.lotNo || null],
  ];
  return (
    <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-5" onClick={onClose}>
      <div className="card w-[min(560px,96vw)] max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-line">
          <h3 className="font-display text-lg">{stone.name}</h3>
          <button className="btn !py-1.5 text-xs" onClick={onClose}>Close ✕</button>
        </div>
        <div className="p-5 flex flex-col sm:flex-row gap-5">
          <div className="w-full sm:w-44 shrink-0">
            <div className="aspect-square rounded-xl overflow-hidden border border-line"><img src={stone.imageUrl} alt={stone.name} className="w-full h-full object-cover" /></div>
          </div>
          <div className="flex-1">
            <table className="w-full text-sm">
              <tbody>
                {rows.filter(([, v]) => v).map(([k, v]) => (
                  <tr key={k} className="border-b border-line/70 last:border-0">
                    <td className="py-1.5 text-muted pr-4 whitespace-nowrap">{k}</td>
                    <td className="py-1.5 text-right">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button className={`btn w-full justify-center mt-4 ${on ? "" : "btn-gold"}`} onClick={onToggle}>
              {on ? "Remove from selection" : "Add to selection"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Multi-select tile catalogue with inventory search + filters. */
export default function TilePicker({
  projectId,
  value,
  onChange,
}: {
  projectId: string;
  value: PickedStone[];
  onChange: (s: PickedStone[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [detail, setDetail] = useState<PickedStone | null>(null);

  // Inventory controls
  const [q, setQ] = useState("");
  const [typeF, setTypeF] = useState("");
  const [finishF, setFinishF] = useState("");
  const [sort, setSort] = useState("featured");

  const has = (url: string) => value.some((v) => v.imageUrl === url);
  const toggle = (s: PickedStone) => {
    if (has(s.imageUrl)) onChange(value.filter((v) => v.imageUrl !== s.imageUrl));
    else onChange([...value, s]);
  };
  const uploads = value.filter((v) => v.source === "upload");

  const all = useMemo<PickedStone[]>(() => [...(LIBRARY_STONES as PickedStone[]), ...uploads], [uploads]);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let list = all.filter((s) => {
      if (typeF && (s.stoneType || "") !== typeF) return false;
      if (finishF && (s.finish || "") !== finishF) return false;
      if (needle) {
        const hay = [s.name, s.stoneType, s.origin, s.lotNo].filter(Boolean).join(" ").toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
    if (sort === "price-asc") list = [...list].sort((a, b) => (a.pricePerSqft || 0) - (b.pricePerSqft || 0));
    else if (sort === "price-desc") list = [...list].sort((a, b) => (b.pricePerSqft || 0) - (a.pricePerSqft || 0));
    else if (sort === "name") list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === "stock") list = [...list].sort((a, b) => (b.slabsInStock || 0) - (a.slabsInStock || 0));
    return list;
  }, [all, q, typeF, finishF, sort]);

  function saveDetails() {
    if (!pending) return;
    const stone: PickedStone = {
      imageUrl: pending,
      name: form.name || "Custom stone",
      stoneType: form.stoneType || undefined,
      origin: form.origin || undefined,
      size: form.size || undefined,
      thicknessMm: form.thickness ? Number(form.thickness) : undefined,
      finish: form.finish || undefined,
      pricePerSqft: form.price ? Number(form.price) : undefined,
      slabsInStock: form.slabs ? Number(form.slabs) : undefined,
      lotNo: form.lotNo || undefined,
      source: "upload",
    };
    onChange([...value, stone]);
    setPending(null);
  }

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm({ ...form, [k]: e.target.value });
  const activeFilters = q || typeF || finishF || sort !== "featured";

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-display text-lg">
          Tiles {value.length > 0 && <span className="text-accent text-base">· {value.length} selected</span>}
        </h3>
        <button className="btn !py-1.5 !px-3 text-xs" onClick={() => setOpen(true)}>Upload</button>
      </div>
      <p className="text-muted text-xs mb-4">Pick as many marbles as you want to compare. Each one is rendered into the room.</p>

      {/* Inventory toolbar */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <div className="relative flex-1 min-w-[180px]">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-faint text-xs">⌕</span>
          <input className="input !py-1.5 !pl-7 text-xs w-full" placeholder="Search by name, type, origin or lot" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className="input !py-1.5 text-xs" value={typeF} onChange={(e) => setTypeF(e.target.value)}>
          <option value="">All types</option>
          {STONE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select className="input !py-1.5 text-xs" value={finishF} onChange={(e) => setFinishF(e.target.value)}>
          <option value="">All finishes</option>
          {FINISHES.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
        <select className="input !py-1.5 text-xs" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="featured">Featured</option>
          <option value="price-asc">Price: low to high</option>
          <option value="price-desc">Price: high to low</option>
          <option value="stock">Most in stock</option>
          <option value="name">Name A to Z</option>
        </select>
        {activeFilters && (
          <button className="text-[11px] text-muted hover:text-ink" onClick={() => { setQ(""); setTypeF(""); setFinishF(""); setSort("featured"); }}>Clear</button>
        )}
      </div>

      {shown.length === 0 ? (
        <div className="text-faint text-sm text-center border border-dashed border-line rounded-xl py-12">No marbles match. Adjust the filters, or upload a slab.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {shown.map((s) => <InventoryCard key={s.imageUrl} s={s} on={has(s.imageUrl)} onToggle={() => toggle(s)} onInfo={() => setDetail(s)} />)}
        </div>
      )}

      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-5 pt-4 border-t border-line">
          <span className="text-[11px] text-muted mr-1">Selected:</span>
          {value.map((s) => (
            <span key={s.imageUrl} className="inline-flex items-center gap-1 text-[11px] bg-panel2 border border-line rounded-full pl-2.5 pr-1 py-0.5">
              {s.name}
              <button className="text-faint hover:text-danger px-0.5" onClick={() => toggle(s)}>✕</button>
            </span>
          ))}
        </div>
      )}

      {pending && (
        <div className="mt-5 border-t border-line pt-4">
          <div className="flex gap-3 items-start">
            <img src={pending} alt="" className="w-16 h-16 rounded-lg object-cover border border-line flex-shrink-0" />
            <div className="flex-1 grid grid-cols-2 gap-2">
              <input className="input !py-1.5 text-xs col-span-2" placeholder="Stone name" value={form.name} onChange={set("name")} />
              <select className="input !py-1.5 text-xs" value={form.stoneType} onChange={set("stoneType")}>
                {STONE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <input className="input !py-1.5 text-xs" placeholder="Origin (e.g. Italy)" value={form.origin} onChange={set("origin")} />
              <input className="input !py-1.5 text-xs" placeholder="Slab size e.g. 3200 x 1600 mm" value={form.size} onChange={set("size")} />
              <input className="input !py-1.5 text-xs" placeholder="Thickness (mm)" inputMode="numeric" value={form.thickness} onChange={set("thickness")} />
              <select className="input !py-1.5 text-xs" value={form.finish} onChange={set("finish")}>
                {FINISHES.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
              <input className="input !py-1.5 text-xs" placeholder="₹ / sq ft" inputMode="numeric" value={form.price} onChange={set("price")} />
              <input className="input !py-1.5 text-xs" placeholder="Slabs in stock" inputMode="numeric" value={form.slabs} onChange={set("slabs")} />
              <input className="input !py-1.5 text-xs" placeholder="Lot / block no" value={form.lotNo} onChange={set("lotNo")} />
            </div>
          </div>
          <div className="flex gap-2 mt-2">
            <button className="btn btn-gold !py-1.5 text-xs justify-center flex-1" onClick={saveDetails}>Add this tile</button>
            <button className="btn !py-1.5 text-xs" onClick={() => setPending(null)}>Cancel</button>
          </div>
        </div>
      )}

      {detail && (
        <StoneDetails
          stone={detail}
          on={has(detail.imageUrl)}
          onToggle={() => { toggle(detail); }}
          onClose={() => setDetail(null)}
        />
      )}

      {open && (
        <UploadDialog
          projectId={projectId}
          kind="stone"
          onImage={(url) => { setPending(url); setForm({ ...emptyForm }); setOpen(false); }}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}
