"use client";
import { useMemo, useState } from "react";
import { LIBRARY_STONES } from "@/lib/library";
import { STONE_TYPES, FINISHES } from "@/lib/types";
import type { StoneMeta } from "@/lib/types";
import UploadDialog from "./UploadDialog";

export type PickedStone = StoneMeta & { imageUrl: string };

const emptyForm = { name: "", stoneType: "Marble", origin: "", size: "", thickness: "", finish: "Polished", price: "" };

/** A single marble shown as a rounded diamond with the texture and a soft shadow. */
function Diamond({ s, on, onClick }: { s: PickedStone; on: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="group flex flex-col items-center gap-2.5 outline-none">
      <div
        className="relative w-full aspect-square grid place-items-center transition-transform duration-200 group-hover:scale-[1.05]"
        style={{ filter: on ? "drop-shadow(0 14px 26px rgba(201,162,94,0.45))" : "drop-shadow(0 16px 24px rgba(0,0,0,0.6))" }}
      >
        <div className={`relative w-[70%] h-[70%] rotate-45 rounded-[26%] overflow-hidden ring-1 transition-all ${on ? "ring-2 ring-accent" : "ring-white/10 group-hover:ring-accent/50"}`}>
          <img src={s.imageUrl} alt={s.name} className="w-full h-full object-cover" />
          <span className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(120% 120% at 28% 22%, rgba(255,255,255,0.22), rgba(255,255,255,0) 55%)" }} />
        </div>
        {on && (
          <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/3 w-5 h-5 rounded-full bg-accent text-[#1a1508] grid place-items-center text-[11px] font-bold shadow-lg">✓</span>
        )}
      </div>
      <div className="text-center leading-tight px-1">
        <div className={`text-[12px] font-medium truncate max-w-[140px] ${on ? "text-ink" : "text-ink/90"}`}>{s.name}</div>
        {s.size && <div className="text-[10px] text-muted truncate max-w-[140px]">{s.size}</div>}
        {s.pricePerSqft ? <div className="text-[10px] text-accent">₹{s.pricePerSqft}/sq ft</div> : null}
      </div>
    </button>
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
        const hay = [s.name, s.stoneType, s.origin].filter(Boolean).join(" ").toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
    if (sort === "price-asc") list = [...list].sort((a, b) => (a.pricePerSqft || 0) - (b.pricePerSqft || 0));
    else if (sort === "price-desc") list = [...list].sort((a, b) => (b.pricePerSqft || 0) - (a.pricePerSqft || 0));
    else if (sort === "name") list = [...list].sort((a, b) => a.name.localeCompare(b.name));
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
          <input
            className="input !py-1.5 !pl-7 text-xs w-full"
            placeholder="Search by name, type or origin"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
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
          <option value="name">Name A to Z</option>
        </select>
        {activeFilters && (
          <button className="text-[11px] text-muted hover:text-ink" onClick={() => { setQ(""); setTypeF(""); setFinishF(""); setSort("featured"); }}>
            Clear
          </button>
        )}
      </div>

      {shown.length === 0 ? (
        <div className="text-faint text-sm text-center border border-dashed border-line rounded-xl py-12">
          No marbles match. Adjust the filters, or upload a slab.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-6">
          {shown.map((s) => <Diamond key={s.imageUrl} s={s} on={has(s.imageUrl)} onClick={() => toggle(s)} />)}
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
            </div>
          </div>
          <div className="flex gap-2 mt-2">
            <button className="btn btn-gold !py-1.5 text-xs justify-center flex-1" onClick={saveDetails}>Add this tile</button>
            <button className="btn !py-1.5 text-xs" onClick={() => setPending(null)}>Cancel</button>
          </div>
        </div>
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
