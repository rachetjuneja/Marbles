"use client";
import { useState } from "react";
import ScenePicker from "./ScenePicker";
import StonePicker, { PickedStone } from "./StonePicker";
import ModelSelect, { PublicModel } from "./ModelSelect";
import WishlistDrawer from "./WishlistDrawer";
import CartDrawer from "./CartDrawer";
import ProformaInvoice from "./ProformaInvoice";
import { makeBookmatch } from "@/lib/bookmatch";
import { SURFACES, SURFACE_AREA } from "@/lib/types";
import type { SceneRef, Surface, SavedRender } from "@/lib/types";

export default function Workspace({
  projectId,
  customerName,
  customerMobile,
  models,
}: {
  projectId: string;
  customerName: string;
  customerMobile: string;
  models: PublicModel[];
}) {
  const firstAvail = models.find((m) => m.available)?.id || models[0]?.id;
  const [scene, setScene] = useState<SceneRef | null>(null);
  const [stone, setStone] = useState<PickedStone | null>(null);
  const [surface, setSurface] = useState<Surface>("single_wall");
  const [bookmatch, setBookmatch] = useState(true);
  const [model, setModel] = useState<string>(firstAvail);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);

  const [wishlist, setWishlist] = useState<SavedRender[]>([]);
  const [cart, setCart] = useState<SavedRender[]>([]);
  const [panel, setPanel] = useState<"wishlist" | "cart" | null>(null);
  const [invoiceOpen, setInvoiceOpen] = useState(false);

  const stageImg = result && !showOriginal ? result : scene?.imageUrl || null;

  async function generate() {
    if (!scene || !stone) { setErr("Pick a room and a stone first."); return; }
    setErr(null); setBusy(true); setResult(null); setShowOriginal(false);
    try {
      let stoneRef = stone.imageUrl;
      if (bookmatch) { try { stoneRef = await makeBookmatch(stone.imageUrl); } catch { /* keep original */ } }
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId, sceneRef: scene.imageUrl, stoneRef, surface, model, bookmatch,
          stone: {
            name: stone.name, stoneType: stone.stoneType, origin: stone.origin, size: stone.size,
            thicknessMm: stone.thicknessMm, finish: stone.finish, pricePerSqft: stone.pricePerSqft, source: stone.source,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "generation failed");
      setResult(data.resultUrl);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  function currentSaved(): SavedRender | null {
    if (!result || !stone) return null;
    return { key: result, resultUrl: result, surface, stone };
  }
  function addWishlist() {
    const it = currentSaved(); if (!it) return;
    if (wishlist.some((w) => w.key === it.key)) return setPanel("wishlist");
    setWishlist((l) => [it, ...l]); setPanel("wishlist");
  }
  function addCart() {
    const it = currentSaved(); if (!it) return;
    if (cart.some((c) => c.key === it.key)) return setPanel("cart");
    setCart((l) => [{ ...it, qty: SURFACE_AREA[surface] }, ...l]); setPanel("cart");
  }

  return (
    <main className="min-h-screen">
      <header className="flex items-center gap-4 px-5 py-3 border-b border-line sticky top-0 bg-[#0f0f11] z-20 flex-wrap">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg" style={{ background: "radial-gradient(120% 120% at 30% 20%,#e9d6ac,#c9a25e 45%,#8a6a2f)" }} />
          <div className="text-sm font-semibold">The Sales OS</div>
        </div>
        <div className="ml-auto flex items-center gap-2.5 flex-wrap">
          <div className="text-right leading-tight mr-1">
            <div className="text-sm font-medium">{customerName}</div>
            <div className="text-[11px] text-muted">{customerMobile}</div>
          </div>
          <button className="btn !py-1.5 text-xs" onClick={() => setPanel("wishlist")}>
            ♥ Wishlist{wishlist.length ? ` · ${wishlist.length}` : ""}
          </button>
          <button className="btn !py-1.5 text-xs" onClick={() => setPanel("cart")}>
            🛒 Cart{cart.length ? ` · ${cart.length}` : ""}
          </button>
          <a href="/" className="btn !py-1.5 text-xs">New</a>
        </div>
      </header>

      <div className="grid lg:grid-cols-[1fr_360px] gap-5 p-5">
        {/* Stage + controls */}
        <div className="min-w-0">
          <div className="relative rounded-2xl overflow-hidden border border-line bg-black aspect-[16/10]">
            {stageImg ? (
              <img src={stageImg} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full grid place-items-center text-muted text-sm">Pick a room to begin</div>
            )}
            {busy && (
              <div className="absolute inset-0 bg-black/55 grid place-items-center">
                <div className="text-center">
                  <div className="animate-pulse text-accent font-display text-lg">Rendering…</div>
                  <div className="text-muted text-xs mt-1">{models.find((m) => m.id === model)?.label}</div>
                </div>
              </div>
            )}
            {result && !busy && (
              <button
                className="absolute right-3 top-3 btn !py-1.5 text-xs"
                onMouseDown={() => setShowOriginal(true)} onMouseUp={() => setShowOriginal(false)}
                onMouseLeave={() => setShowOriginal(false)}
                onTouchStart={() => setShowOriginal(true)} onTouchEnd={() => setShowOriginal(false)}
              >
                {showOriginal ? "Original" : "Hold to compare"}
              </button>
            )}
          </div>

          <div className="card mt-3.5 p-3.5 flex flex-wrap gap-x-4 gap-y-3 items-end">
            <div>
              <span className="label">Apply to</span>
              <div className="inline-flex rounded-lg overflow-hidden border border-line">
                {SURFACES.map((s) => (
                  <button key={s.id} onClick={() => setSurface(s.id)}
                    className={`px-2.5 py-1.5 text-xs ${surface === s.id ? "bg-accent text-[#1a1508] font-semibold" : "text-muted"}`}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <span className="label">Book match</span>
              <button onClick={() => setBookmatch((b) => !b)}
                className={`w-[38px] h-[22px] rounded-full relative border ${bookmatch ? "bg-accent/25 border-accent" : "bg-panel2 border-line"}`}>
                <span className={`absolute top-[2px] w-4 h-4 rounded-full transition-all ${bookmatch ? "left-[18px] bg-accent" : "left-[2px] bg-muted"}`} />
              </button>
            </div>
            <div className="min-w-[180px]"><ModelSelect models={models} value={model} onChange={setModel} /></div>
            <div className="flex-1" />
            <button className="btn btn-gold" disabled={busy || !scene || !stone} onClick={generate}>
              {busy ? "Rendering…" : "Generate ✦"}
            </button>
          </div>
          {err && <div className="text-danger text-sm mt-2">{err}</div>}
          {result && !busy && (
            <div className="flex gap-2 mt-2">
              <button className="btn" onClick={addWishlist}>♥ Add to wishlist</button>
              <button className="btn" onClick={addCart}>🛒 Add to cart</button>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4">
          <ScenePicker projectId={projectId} value={scene} onChange={setScene} />
          <StonePicker projectId={projectId} value={stone} onChange={setStone} />
        </div>
      </div>

      <WishlistDrawer
        open={panel === "wishlist"}
        onClose={() => setPanel(null)}
        items={wishlist}
        onRemove={(key) => setWishlist((l) => l.filter((w) => w.key !== key))}
        customerName={customerName}
        customerMobile={customerMobile}
      />
      <CartDrawer
        open={panel === "cart"}
        onClose={() => setPanel(null)}
        items={cart}
        onRemove={(key) => setCart((l) => l.filter((c) => c.key !== key))}
        onQty={(key, qty) => setCart((l) => l.map((c) => (c.key === key ? { ...c, qty } : c)))}
        onInvoice={() => { setPanel(null); setInvoiceOpen(true); }}
      />
      <ProformaInvoice
        open={invoiceOpen}
        onClose={() => setInvoiceOpen(false)}
        items={cart}
        customerName={customerName}
        customerMobile={customerMobile}
      />
    </main>
  );
}
