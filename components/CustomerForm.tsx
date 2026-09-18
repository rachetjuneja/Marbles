"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CustomerForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function start(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const res = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", name, mobile }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not start");
      router.push(`/session/${data.session.id}`);
    } catch (e: any) {
      setErr(e.message);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={start} className="card p-5 flex flex-col gap-4">
      <div>
        <label className="label" htmlFor="name">Customer name</label>
        <input id="name" className="input" value={name} onChange={(e) => setName(e.target.value)}
          placeholder="Rahul Sharma" autoComplete="off" required />
      </div>
      <div>
        <label className="label" htmlFor="mobile">Mobile number</label>
        <input id="mobile" className="input" value={mobile} onChange={(e) => setMobile(e.target.value)}
          placeholder="+91 98xxxxxxx" inputMode="tel" required />
      </div>
      {err && <div className="text-danger text-sm">{err}</div>}
      <button className="btn btn-gold justify-center" disabled={busy}>
        {busy ? "Starting…" : "Start visualising →"}
      </button>
    </form>
  );
}
