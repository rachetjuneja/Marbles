"use client";
import { useState } from "react";
import { useParams } from "next/navigation";

export default function MobileUpload() {
  const params = useParams();
  const token = String(params.token || "");
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");

  function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setStatus("idle");
  }

  async function send() {
    if (!file) return;
    setStatus("sending");
    try {
      const form = new FormData();
      form.append("token", token);
      form.append("file", file);
      const res = await fetch("/api/mobile-upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "upload failed");
      setStatus("done");
    } catch (e: any) {
      setStatus("error");
      setMsg(e.message);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-5 py-10">
      <div className="w-full max-w-sm text-center">
        <div className="text-[11px] tracking-[0.16em] uppercase text-muted mb-2">The Sales OS</div>
        <h1 className="font-display text-2xl mb-1">Upload a photo</h1>
        <p className="text-muted text-sm mb-6">It appears on the salesperson's screen instantly.</p>

        {status === "done" ? (
          <div className="card p-8">
            <div className="text-ok text-4xl mb-2">✓</div>
            <div className="font-medium">Sent</div>
            <div className="text-muted text-sm mt-1">You can hand the phone back now.</div>
          </div>
        ) : (
          <div className="card p-5 flex flex-col gap-4">
            <label className="block cursor-pointer">
              <div className="aspect-[4/3] rounded-xl border border-line bg-panel2 overflow-hidden flex items-center justify-center">
                {preview ? (
                  <img src={preview} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-muted text-sm">Tap to take or choose a photo</span>
                )}
              </div>
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={pick} />
            </label>
            <button className="btn btn-gold justify-center" disabled={!file || status === "sending"} onClick={send}>
              {status === "sending" ? "Sending…" : "Send to screen"}
            </button>
            {status === "error" && <div className="text-danger text-sm">{msg}</div>}
          </div>
        )}
      </div>
    </main>
  );
}
