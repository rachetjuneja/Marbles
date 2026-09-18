"use client";
import { useState } from "react";
import { LIBRARY_SCENES } from "@/lib/library";
import type { SceneRef } from "@/lib/types";
import UploadDialog from "./UploadDialog";

export default function ScenePicker({
  projectId,
  value,
  onChange,
}: {
  projectId: string;
  value: SceneRef | null;
  onChange: (s: SceneRef) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display text-base">1 · Room</h3>
        <button className="btn !py-1.5 !px-2.5 text-xs" onClick={() => setOpen(true)}>Upload</button>
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
      {open && (
        <UploadDialog
          projectId={projectId}
          kind="scene"
          onImage={(url) => { onChange({ imageUrl: url, source: "upload", name: "Uploaded room" }); setOpen(false); }}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}
