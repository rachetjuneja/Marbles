"use client";
import { useEffect, useRef, useState } from "react";

export interface PublicModel {
  id: string;
  label: string;
  note: string;
  approxCost: string;
  available: boolean;
}

export default function ModelSelect({
  models,
  value,
  onChange,
}: {
  models: PublicModel[];
  value: string;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const cur = models.find((m) => m.id === value) || models[0];

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <label className="label">Model</label>
      <button type="button" className="btn w-full justify-between" onClick={() => setOpen((o) => !o)}>
        <span>{cur?.label}</span>
        <span className="text-muted text-xs">{cur?.approxCost} ▾</span>
      </button>
      {open && (
        <div className="absolute z-30 mt-1 w-[300px] card p-1.5 shadow-2xl">
          {models.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => { onChange(m.id); setOpen(false); }}
              className="w-full text-left px-3 py-2 rounded-lg hover:bg-panel2 flex flex-col gap-0.5"
            >
              <div className="flex items-center justify-between">
                <span className={`text-sm font-medium ${m.id === value ? "text-accent" : ""}`}>{m.label}</span>
                <span className="text-[11px] text-muted">{m.approxCost}</span>
              </div>
              <div className="text-[11px] text-muted leading-snug">{m.note}</div>
              {!m.available && <div className="text-[10px] text-danger mt-0.5">no API key set</div>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
