"use client";
import { useEffect, useRef, useState } from "react";
import ScenePicker from "./ScenePicker";
import StonePicker, { PickedStone } from "./StonePicker";
import ModelSelect, { PublicModel } from "./ModelSelect";
import WishlistDrawer from "./WishlistDrawer";
import CartDrawer from "./CartDrawer";
import ProformaInvoice from "./ProformaInvoice";
import SurfaceOverlay from "./SurfaceOverlay";
import { makeBookmatch } from "@/lib/bookmatch";
import { detectSurfaces } from "@/lib/detect";
import { SURFACES, SURFACE_AREA } from "@/lib/types";
import type { SceneRef, Surface, SavedRender, DetectedSurface } from "@/lib/types";

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

  // Surface detection
  const [detected, setDetected] = useState<DetectedSurface[]>([]);
  const [detecting, setDetecting] = useState(false);
  const [detectNote, setDetectNote] = useState<string | null>(null);
  const [target, setTarget] = useState<DetectedSurface | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [manualMode, setManualMode] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);
  const cacheRef = useRef<Record<string, DetectedSurface[]>>({});
  const reqRef = useRef(0);

  // Measure where the (object-contain) image actually renders inside the stage,
  // so the detected-surface overlay lines up exactly, whatever the photo's aspect.
  const stageRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [rect, setRect] = useState<{ left: number; top: number; width: number; height: number } | null>(null);
  function measure() {
    const c = stageRef.current, im = imgRef.current;
    if (!c || !im || !im.naturalWidth || !im.naturalHeight) { setRect(null); return; }
    const cw = c.clientWidth, ch = c.clientHeight;
    const scale = Math.min(cw / im.naturalWidth, ch / im.naturalHeight);
    const w = im.naturalWidth * scale, h = im.naturalHeight * scale;
    setRect({ left: (cw - w) / 2, top: (ch - h) / 2, width: w, height: h });
  }

  const [wishlist, setWishlist] = useState<SavedRender[]>([]);
  const [cart, setCart] = useState<SavedRender[]>([]);
  const [panel, setPanel] = useState<"wishlist" | "cart" | null>(null);
  const [invoiceOpen, setInvoiceOpen] = useState(false);

  // What we actually apply to: the detected target if one is chosen, else the manual pick.
  const effectiveSurface: Surface = target ? target.surface : surface;
  const effectiveLabel = target ? target.label : SURFACES.find((s) => s.id === surface)?.label || "surface";

  const stageImg = result && !showOriginal ? result : scene?.imageUrl || null;
  const onBaseScene = !!scene && (!result || showOriginal);
  const overlayVisible = showOverlay && onBaseScene && detected.length > 0;

  // Run automatic surface detection whenever the room changes.
  useEffect(() => {
    setTarget(null);
    setResult(null);
    setErr(null);
    setManualMode(false);
    if (!scene) {
      setDetected([]);
      setDetectNote(null);
      return;
    }
    const url = scene.imageUrl;
    const cached = cacheRef.current[url];
    if (cached) {
      setDetected(cached);
      setTarget(cached[0] || null);
      setDetectNote(cached.length ? null : "Could not detect surfaces automatically. Choose the surface to apply below.");
      return;
    }
    const id = ++reqRef.current;
    setDetecting(true);
    setDetected([]);
    setDetectNote(null);
    detectSurfaces(url)
      .then(({ surfaces, error }) => {
        if (id !== reqRef.current) return;
        cacheRef.current[url] = surfaces;
        setDetected(surfaces);
        setTarget(surfaces[0] || null);
        if (!surfaces.length) {
          setDetectNote(
            error && /GEMINI_API_KEY/.test(error)
              ? "Auto detection needs your Gemini key in .env.local. For now, choose the surface to apply below."
              : "Could not detect surfaces automatically. Choose the surface to apply below."
          );
          setManualMode(true);
        }
      })
      .finally(() => {
        if (id === reqRef.current) setDetecting(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene?.imageUrl]);

  // Keep the overlay aligned as the image loads or the stage resizes.
  useEffect(() => {
    measure();
    const c = stageRef.current;
    if (!c || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(c);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stageImg]);

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
          projectId, sceneRef: scene.imageUrl, stoneRef,
          surface: effectiveSurface, targetLabel: target?.label,
          model, bookmatch,
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
    return { key: result, resultUrl: result, surface: effectiveSurface, stone };
  }
  function addWishlist() {
    const it = currentSaved(); if (!it) return;
    if (wishlist.some((w) => w.key === it.key)) return setPanel("wishlist");
    setWishlist((l) => [it, ...l]); setPanel("wishlist");
  }
  function addCart() {
    const it = currentSaved(); if (!it) return;
    if (cart.some((c) => c.key === it.key)) return setPanel("cart");
    setCart((l) => [{ ...it, qty: SURFACE_AREA[effectiveSurface] }, ...l]); setPanel("cart");
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
          <div ref={stageRef} className="relative rounded-2xl overflow-hidden border border-line bg-black aspect-[16/10]">
            {stageImg ? (
              <img ref={imgRef} src={stageImg} alt="" onLoad={measure} className="absolute inset-0 w-full h-full object-contain" />
            ) : (
              <div className="w-full h-full grid place-items-center text-muted text-sm">Pick a room to begin</div>
            )}
            {overlayVisible && rect && (
              <div className="absolute" style={{ left: rect.left, top: rect.top, width: rect.width, height: rect.height }}>
                <SurfaceOverlay
                  surfaces={detected}
                  activeId={target?.id ?? null}
                  hoverId={hoverId}
                  onPick={(s) => { setTarget(s); setManualMode(false); }}
                  onHover={setHoverId}
                />
              </div>
            )}

            {onBaseScene && (target || (!detected.length && !detecting)) && (
              <div className="absolute left-3 top-3 text-[11px] px-2 py-1 rounded-md bg-black/70 border border-line text-ink pointer-events-none">
                Applying to <span className="text-accent font-medium">{effectiveLabel}</span>
              </div>
            )}
            {detecting && (
              <div className="absolute left-3 top-3 text-[11px] px-2 py-1 rounded-md bg-black/70 border border-line text-muted pointer-events-none animate-pulse">
                ◍ Analysing room…
              </div>
            )}
            {detected.length > 0 && onBaseScene && (
              <button
                className="absolute left-3 bottom-3 btn !py-1 !px-2 text-[11px]"
                onClick={() => setShowOverlay((v) => !v)}
              >
                {showOverlay ? "Hide surfaces" : "Show surfaces"}
              </button>
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

          {/* Where to apply */}
          <div className="card mt-3.5 p-3.5">
            <div className="flex items-center justify-between mb-2">
              <span className="label !mb-0">Where to apply</span>
              {detected.length > 0 && (
                <button
                  className="text-[11px] text-muted hover:text-ink"
                  onClick={() => setManualMode((v) => !v)}
                >
                  {manualMode ? "Use detected surfaces" : "Set manually"}
                </button>
              )}
            </div>

            {detecting ? (
              <div className="text-muted text-xs py-1 animate-pulse">◍ Studying the room for floors, walls, counters and tables…</div>
            ) : detected.length > 0 && !manualMode ? (
              <div className="flex flex-wrap gap-2">
                {detected.map((d) => {
                  const active = target?.id === d.id;
                  return (
                    <button
                      key={d.id}
                      onMouseEnter={() => setHoverId(d.id)}
                      onMouseLeave={() => setHoverId(null)}
                      onClick={() => { setTarget(d); setManualMode(false); }}
                      className={`px-2.5 py-1.5 rounded-lg text-xs border transition-colors ${active ? "bg-accent text-[#1a1508] border-accent font-semibold" : "border-line text-muted hover:border-accent/60 hover:text-ink"}`}
                    >
                      {d.label}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div>
                {detectNote && <div className="text-faint text-[11px] mb-2">{detectNote}</div>}
                <div className="inline-flex flex-wrap rounded-lg overflow-hidden border border-line">
                  {SURFACES.map((s) => (
                    <button key={s.id} onClick={() => { setSurface(s.id); setTarget(null); }}
                      className={`px-2.5 py-1.5 text-xs ${!target && surface === s.id ? "bg-accent text-[#1a1508] font-semibold" : "text-muted"}`}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Generate controls */}
          <div className="card mt-3 p-3.5 flex flex-wrap gap-x-4 gap-y-3 items-end">
            <div>
              <span className="label">Book match</span>
              <button onClick={() => setBookmatch((b) => !b)}
                className={`w-[38px] h-[22px] rounded-full relative border ${bookmatch ? "bg-accent/25 border-accent" : "bg-panel2 border-line"}`}>
                <span className={`absolute top-[2px] w-4 h-4 rounded-full transition-all ${bookmatch ? "left-[18px] bg-accent" : "left-[2px] bg-muted"}`} />
              </button>
            </div>
            <div className="min-w-[180px]"><ModelSelect models={models} value={model} onChange={setModel} /></div>
            <div className="flex-1" />
            <div className="text-right">
              {stone && (
                <div className="text-[11px] text-muted mb-1">
                  Applying <span className="text-ink">{stone.name}</span> to <span className="text-accent">{effectiveLabel}</span>
                </div>
              )}
              <button className="btn btn-gold" disabled={busy || !scene || !stone} onClick={generate}>
                {busy ? "Rendering…" : "Generate ✦"}
              </button>
            </div>
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
