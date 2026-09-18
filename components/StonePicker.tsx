"use client";
import { useState } from "react";
import { LIBRARY_STONES } from "@/lib/library";
import { fileToDataUrl } from "@/lib/bookmatch";
import { STONE_TYPES, FINISHES } from "@/lib/types";
import type { StoneMeta } from "@/lib/types";
import QrUpload from "./QrUpload";

export type PickedStone = StoneMeta & { imageUrl: string };

const emptyForm = { name: "", stoneType: "Marble", origin: "", size: "", thickness: "", finish: "Polished", price: "" };

export default function StonePicker({
  projectId,
  value,
  onChange,
}: {
  projectId: string;
  value: PickedStone | null;
  onChange: (s: PickedStone) => void;
}) {
  const [qr, setQr] = useState(false);
  const [pending, setPending] = useState<string | null>(null); // image awaiting details
  const [form, setForm] = useState({ ...emptyForm });

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setPending(await fileToDataUrl(f));
    setForm({ ...emptyForm });
  }

  function saveDetails() {
    if (!pending) return;
    onChange({
      imageUrl: pending,
      name: form.name || "Custom stone",
      stoneType: form.stoneType || undefined,
      origin: form.origin || undefined,
      size: form.size || undefined,
      thicknessMm: form.thickness ? Number(form.thickness) : undefined,
      finish: form.finish || undefined,
      pricePerSqft: form.price ? Number(form.price) : undefined,
      source: "upload",
    });
    setPending(null);
  }

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: e.target.value });

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display text-base">2 · Stone</h3>
        <div className="flex gap-2">
          <label className="btn !py-1.5 !px-2.5 text-xs cursor-pointer">
            Upload
            <input type="file" accept="image/*" className="hidden" onChange={onUpload} />
          </label>
          <button className="btn !py-1.5 !px-2.5 text-xs" onClick={() => setQr(true)}>Scan ▦</button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {LIBRARY_STONES.map((s) => (
          <button
            key={s.id}
            onClick={() => onChange(s)}
            className={`rounded-lg overflow-hidden border text-left ${value?.imageUrl === s.imageUrl ? "border-accent" : "border-line"}`}
          >
            <div className="aspect-square"><img src={s.imageUrl} alt={s.name} className="w-full h-full object-cover" /></div>
            <div className="px-1.5 py-1">
              <div className="text-[10.5px] font-medium truncate">{s.name}</div>
              <div className="text-[9px] text-muted truncate">{s.size}</div>
              <div className="text-[9.5px] text-accent">₹{s.pricePerSqft}/sq ft</div>
            </div>
          </button>
        ))}
        {value?.source === "upload" && (
          <div className="rounded-lg overflow-hidden border border-accent">
            <div className="aspect-square"><img src={value.imageUrl} alt={value.name} className="w-full h-full object-cover" /></div>
            <div className="px-1.5 py-1">
              <div className="text-[10.5px] font-medium truncate">{value.name}</div>
              <div className="text-[9px] text-muted truncate">{value.size || ""}</div>
              {value.pricePerSqft ? <div className="text-[9.5px] text-accent">₹{value.pricePerSqft}/sq ft</div> : null}
            </div>
          </div>
        )}
      </div>

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
          <button className="btn btn-gold !py-1.5 text-xs justify-center w-full mt-2" onClick={saveDetails}>Save stone details</button>
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
