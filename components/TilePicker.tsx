"use client";
import { useState } from "react";
import { LIBRARY_STONES } from "@/lib/library";
import { fileToDataUrl } from "@/lib/bookmatch";
import { STONE_TYPES, FINISHES } from "@/lib/types";
import type { StoneMeta } from "@/lib/types";
import QrUpload from "./QrUpload";

export type PickedStone = StoneMeta & { imageUrl: string };

const emptyForm = { name: "", stoneType: "Marble", origin: "", size: "", thickness: "", finish: "Polished", price: "" };

/** Multi-select tile picker: choose several from the library and/or add uploaded
 *  and scanned tiles with details. Emits the full selected list. */
export default function TilePicker({
  projectId,
  value,
  onChange,
}: {
  projectId: string;
  value: PickedStone[];
  onChange: (s: PickedStone[]) => void;
}) {
  const [qr, setQr] = useState(false);
  const [pending, setPending] = useState<string | null>(null); // image awaiting details
  const [form, setForm] = useState({ ...emptyForm });

  const has = (url: string) => value.some((v) => v.imageUrl === url);
  const toggle = (s: PickedStone) => {
    if (has(s.imageUrl)) onChange(value.filter((v) => v.imageUrl !== s.imageUrl));
    else onChange([...value, s]);
  };
  const uploads = value.filter((v) => v.source === "upload");

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setPending(await fileToDataUrl(f));
    setForm({ ...emptyForm });
    e.target.value = "";
  }

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

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: e.target.value });

  function Cell({ s }: { s: PickedStone }) {
    const on = has(s.imageUrl);
    return (
      <button
        onClick={() => toggle(s)}
        className={`relative rounded-lg overflow-hidden border text-left ${on ? "border-accent ring-2 ring-accent/40" : "border-line"}`}
      >
        <div className="aspect-square"><img src={s.imageUrl} alt={s.name} className="w-full h-full object-cover" /></div>
        <span className={`absolute top-1.5 right-1.5 w-5 h-5 rounded-full grid place-items-center text-[11px] font-bold ${on ? "bg-accent text-[#1a1508]" : "bg-black/55 text-white/70 border border-white/40"}`}>
          {on ? "✓" : "+"}
        </span>
        <div className="px-1.5 py-1">
          <div className="text-[10.5px] font-medium truncate">{s.name}</div>
          <div className="text-[9px] text-muted truncate">{s.size || ""}</div>
          {s.pricePerSqft ? <div className="text-[9.5px] text-accent">₹{s.pricePerSqft}/sq ft</div> : null}
        </div>
      </button>
    );
  }

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display text-base">
          Tiles {value.length > 0 && <span className="text-accent text-sm">· {value.length} selected</span>}
        </h3>
        <div className="flex gap-2">
          <label className="btn !py-1.5 !px-2.5 text-xs cursor-pointer">
            Upload
            <input type="file" accept="image/*" className="hidden" onChange={onUpload} />
          </label>
          <button className="btn !py-1.5 !px-2.5 text-xs" onClick={() => setQr(true)}>Scan ▦</button>
        </div>
      </div>

      <p className="text-muted text-xs mb-3">Pick as many as you want to compare. Each one is rendered into the room.</p>

      <div className="grid grid-cols-3 gap-2">
        {LIBRARY_STONES.map((s) => <Cell key={s.id} s={s as PickedStone} />)}
        {uploads.map((s) => <Cell key={s.imageUrl} s={s} />)}
      </div>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {value.map((s) => (
            <span key={s.imageUrl} className="inline-flex items-center gap-1 text-[11px] bg-panel2 border border-line rounded-full pl-2 pr-1 py-0.5">
              {s.name}
              <button className="text-faint hover:text-danger px-0.5" onClick={() => toggle(s)}>✕</button>
            </span>
          ))}
        </div>
      )}

      {pending && (
        <div className="mt-3 border-t border-line pt-3">
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

      {qr && (
        <QrUpload
          projectId={projectId}
          kind="stone"
          onImage={(url) => { setPending(url); setForm({ ...emptyForm }); setQr(false); }}
          onClose={() => setQr(false)}
        />
      )}
    </div>
  );
}
