"use client";
import { useState } from "react";
import { LIBRARY_SCENES } from "@/lib/library";
import { fileToDataUrl } from "@/lib/bookmatch";
import type { SceneRef } from "@/lib/types";
import QrUpload from "./QrUpload";

export default function ScenePicker({
  projectId,
  value,
  onChange,
}: {
  projectId: string;
  value: SceneRef | null;
  onChange: (s: SceneRef) => void;
}) {
  const [qr, setQr] = useState(false);

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    onChange({ imageUrl: await fileToDataUrl(f), source: "upload", name: "Uploaded room" });
  }

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display text-base">1 · Room</h3>
        <div className="flex gap-2">
          <label className="btn !py-1.5 !px-2.5 text-xs cursor-pointer">
            Upload
            <input type="file" accept="image/*" className="hidden" onChange={onUpload} />
          </label>
          <button className="btn !py-1.5 !px-2.5 text-xs" onClick={() => setQr(true)}>Scan ▦</button>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {LIBRARY_SCENES.map((s) => (
          <button
            key={s.id}
            onClick={() => onChange(s)}
            className={`aspect-[4/3] rounded-lg overflow-hidden border ${value?.imageUrl === s.imageUrl ? "border-accent" : "border-line"}`}
          >
            <img src={s.imageUrl} alt={s.name} className="w-full h-full object-cover" />
          </button>
        ))}
        {value?.source === "upload" && (
          <div className="aspect-[4/3] rounded-lg overflow-hidden border border-accent">
            <img src={value.imageUrl} alt="uploaded" className="w-full h-full object-cover" />
          </div>
        )}
      </div>
      {qr && (
        <QrUpload
          projectId={projectId}
          kind="scene"
          onImage={(url) => { onChange({ imageUrl: url, source: "upload", name: "Scanned room" }); setQr(false); }}
          onClose={() => setQr(false)}
        />
      )}
    </div>
  );
}
