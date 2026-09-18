"use client";
import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";

/** Shows a QR the customer scans to upload from their own phone. Polls until it lands. */
export default function QrUpload({
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
  const poll = useRef<ReturnType<typeof setInterval> | null>(null);

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
        const origin = window.location.origin;
        const url = `${origin}/m/${token}`;
        setQr(await QRCode.toDataURL(url, { margin: 1, width: 220, color: { dark: "#111111", light: "#ffffff" } }));
        setStatus("Scan with the customer's phone and upload a photo");
        poll.current = setInterval(async () => {
          const r = await fetch(`/api/session?token=${token}`);
          if (!r.ok) return;
          const d = await r.json();
          if (d.status === "done" && d.url && alive) {
            setStatus("Received");
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

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-5" onClick={onClose}>
      <div className="card p-6 w-[320px] text-center" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-display text-lg mb-1">Scan to upload</h3>
        <p className="text-muted text-xs mb-4">
          Uploading a {kind === "scene" ? "room photo" : "stone photo"} from the customer's phone
        </p>
        <div className="bg-white rounded-xl p-3 inline-block min-h-[220px] min-w-[220px]">
          {qr ? <img src={qr} alt="QR code" width={220} height={220} /> : <div className="text-black text-sm pt-24">…</div>}
        </div>
        <div className="text-xs text-muted mt-4">{status}</div>
        <button className="btn w-full justify-center mt-4" onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}
