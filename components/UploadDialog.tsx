"use client";
import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { fileToDataUrl } from "@/lib/bookmatch";

/**
 * One popup with two ways to add a photo: drop or choose a file from this
 * computer, or scan the QR to send one from the customer's phone. Whichever
 * lands first is returned through onImage.
 */
export default function UploadDialog({
  projectId,
  kind,
  onImage,
  onClose,
}: {
  projectId: string;
  kind: "scene" | "stone";
  onImage: (url: string) => void;
  onClose: () => void;
}) {
  const [qr, setQr] = useState<string | null>(null);
  const [status, setStatus] = useState("Preparing link…");
  const [drag, setDrag] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const poll = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "token", projectId, kind }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "could not create link");
        const token = data.token as string;
        const url = `${window.location.origin}/m/${token}`;
        setQr(await QRCode.toDataURL(url, { margin: 1, width: 200, color: { dark: "#111111", light: "#ffffff" } }));
        setStatus("Waiting for the phone…");
        poll.current = setInterval(async () => {
          const r = await fetch(`/api/session?token=${token}`);
          if (!r.ok) return;
          const d = await r.json();
          if (d.status === "done" && d.url && alive) {
            if (poll.current) clearInterval(poll.current);
            onImage(d.url);
          }
        }, 1500);
      } catch (e: any) {
        setStatus(e.message || "error");
      }
    })();
    return () => {
      alive = false;
      if (poll.current) clearInterval(poll.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleFile(f: File | undefined | null) {
    if (!f) return;
    if (!f.type.startsWith("image/")) { setErr("Please choose an image file."); return; }
    setErr(null);
    onImage(await fileToDataUrl(f));
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-5" onClick={onClose}>
      <div className="card w-[min(680px,96vw)] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-line">
          <h3 className="font-display text-lg">Upload a {kind === "scene" ? "room photo" : "tile photo"}</h3>
          <button className="btn !py-1.5 text-xs" onClick={onClose}>Close ✕</button>
        </div>
        <div className="grid sm:grid-cols-2">
          <div className="p-5 border-b sm:border-b-0 sm:border-r border-line">
            <div className="label mb-2">From this computer</div>
            <div
              onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={(e) => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files?.[0]); }}
              onClick={() => fileRef.current?.click()}
              className={`cursor-pointer rounded-xl border-2 border-dashed grid place-items-center text-center px-4 py-10 transition-colors ${drag ? "border-accent bg-accent/10" : "border-line hover:border-accent/60"}`}
            >
              <div>
                <div className="text-3xl mb-2 text-accent">⬆</div>
                <div className="text-sm font-medium">Drop a file here</div>
                <div className="text-muted text-xs mt-1">or use the button below</div>
              </div>
            </div>
            <button type="button" className="btn btn-gold w-full justify-center mt-3 text-sm" onClick={() => fileRef.current?.click()}>
              Choose from files or library
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
            {err && <div className="text-danger text-[11px] mt-2">{err}</div>}
          </div>

          <div className="p-5 text-center">
            <div className="label mb-2">Or scan with a phone</div>
            <div className="bg-white rounded-xl p-3 inline-block min-h-[200px] min-w-[200px]">
              {qr ? <img src={qr} alt="QR code" width={200} height={200} /> : <div className="text-black text-sm pt-24">…</div>}
            </div>
            <div className="text-xs text-muted mt-3">{status}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
