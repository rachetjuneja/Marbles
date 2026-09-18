"use client";
import { useEffect, useRef, useState } from "react";
import ScenePicker from "./ScenePicker";
import TilePicker, { PickedStone } from "./TilePicker";
import ModelSelect, { PublicModel } from "./ModelSelect";
import WishlistDrawer from "./WishlistDrawer";
import CartDrawer from "./CartDrawer";
import ProformaInvoice from "./ProformaInvoice";
import SurfaceOverlay from "./SurfaceOverlay";
import { makeBookmatch } from "@/lib/bookmatch";
import { detectSurfaces } from "@/lib/detect";
import { SURFACES, SURFACE_AREA } from "@/lib/types";
import type { SceneRef, Surface, SavedRender, DetectedSurface } from "@/lib/types";

type Gen = { id: string; tile: PickedStone; url: string | null; status: "pending" | "done" | "error"; error?: string };
type Area = { id: string; label: string; surface: Surface; promptLabel?: string };

const STEP_LABELS = ["Customer", "Room", "Surface", "Tiles", "Result"];

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

  const [step, setStep] = useState(1); // 1 Room, 2 Surface, 3 Tiles, 4 Result
  const [scene, setScene] = useState<SceneRef | null>(null);

  // Detection + surface selection (multiple areas allowed)
  const [detected, setDetected] = useState<DetectedSurface[]>([]);
  const [detecting, setDetecting] = useState(false);
  const [detectNote, setDetectNote] = useState<string | null>(null);
  const [selected, setSelected] = useState<Area[]>([]);
  const [manualMode, setManualMode] = useState(false);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [showOverlay, setShowOverlay] = useState(true);
  const cacheRef = useRef<Record<string, DetectedSurface[]>>({});
  const reqRef = useRef(0);

  // Tiles + batch
  const [tiles, setTiles] = useState<PickedStone[]>([]);
  const [bookmatch, setBookmatch] = useState(true);
  const [model, setModel] = useState<string>(firstAvail);
  const [gens, setGens] = useState<Gen[]>([]);
  const [running, setRunning] = useState(false);

  // Stage measurement (object-contain rect) so overlays line up
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

  // Drawers
  const [wishlist, setWishlist] = useState<SavedRender[]>([]);
  const [cart, setCart] = useState<SavedRender[]>([]);
  const [panel, setPanel] = useState<"wishlist" | "cart" | null>(null);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [lightbox, setLightbox] = useState<Gen | null>(null);
  const [lbCompare, setLbCompare] = useState(false);

  const areaOfDetected = (d: DetectedSurface): Area => ({ id: d.id, label: d.label, surface: d.surface, promptLabel: d.label });
  const manualArea = (s: { id: Surface; label: string }): Area => ({ id: `m-${s.id}`, label: s.label, surface: s.id });
  const isSel = (id: string) => selected.some((a) => a.id === id);
  const toggleArea = (a: Area) => setSelected((prev) => (prev.some((x) => x.id === a.id) ? prev.filter((x) => x.id !== a.id) : [...prev, a]));

  const effectiveLabel = selected.length ? selected.map((a) => a.label).join(" + ") : "a surface";
  const effectiveArea = selected.reduce((s, a) => s + (SURFACE_AREA[a.surface] || 0), 0);
  const modelAvailable = !!models.find((m) => m.id === model)?.available;

  // Auto-detect surfaces when the room changes.
  useEffect(() => {
    setSelected([]);
    setManualMode(false);
    if (!scene) { setDetected([]); setDetectNote(null); return; }
    const url = scene.imageUrl;
    const cached = cacheRef.current[url];
    if (cached) {
      setDetected(cached);
      setSelected(cached[0] ? [areaOfDetected(cached[0])] : []);
      setDetectNote(cached.length ? null : "Could not detect surfaces automatically. Choose the areas to apply below.");
      if (!cached.length) setManualMode(true);
      return;
    }
    const id = ++reqRef.current;
    setDetecting(true); setDetected([]); setDetectNote(null);
    detectSurfaces(url)
      .then(({ surfaces, error }) => {
        if (id !== reqRef.current) return;
        cacheRef.current[url] = surfaces;
        setDetected(surfaces);
        setSelected(surfaces[0] ? [areaOfDetected(surfaces[0])] : []);
        if (!surfaces.length) {
          setDetectNote(
            error && /GEMINI_API_KEY/.test(error)
              ? "Auto detection needs your Gemini key in .env.local. For now, choose the areas to apply below."
              : "Could not detect surfaces automatically. Choose the areas to apply below."
          );
          setManualMode(true);
        }
      })
      .finally(() => { if (id === reqRef.current) setDetecting(false); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene?.imageUrl]);

  useEffect(() => {
    measure();
    const c = stageRef.current;
    if (!c || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(c);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene?.imageUrl, step]);

  async function pool<T>(items: T[], n: number, fn: (t: T, i: number) => Promise<void>) {
    let idx = 0;
    const workers = Array.from({ length: Math.min(n, items.length) }, async () => {
      while (idx < items.length) { const cur = idx++; await fn(items[cur], cur); }
    });
    await Promise.all(workers);
  }

  async function runBatch() {
    if (!scene || !tiles.length || !selected.length) return;
    const targets = selected.map((a) => ({ surface: a.surface, label: a.promptLabel }));
    const items: Gen[] = tiles.map((t, i) => ({ id: `${i}-${t.imageUrl.slice(-10)}`, tile: t, url: null, status: "pending" }));
    setGens(items);
    setRunning(true);
    setStep(4);
    await pool(items, 3, async (g, i) => {
      try {
        let stoneRef = g.tile.imageUrl;
        if (bookmatch) { try { stoneRef = await makeBookmatch(g.tile.imageUrl); } catch { /* keep original */ } }
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId, sceneRef: scene.imageUrl, stoneRef, targets, model, bookmatch,
            stone: {
              name: g.tile.name, stoneType: g.tile.stoneType, origin: g.tile.origin, size: g.tile.size,
              thicknessMm: g.tile.thicknessMm, finish: g.tile.finish, pricePerSqft: g.tile.pricePerSqft, source: g.tile.source,
            },
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "generation failed");
        setGens((prev) => prev.map((x, idx) => (idx === i ? { ...x, url: data.resultUrl, status: "done" } : x)));
      } catch (e: any) {
        setGens((prev) => prev.map((x, idx) => (idx === i ? { ...x, status: "error", error: e.message } : x)));
      }
    });
    setRunning(false);
  }

  function savedFrom(g: Gen): SavedRender | null {
    if (!g.url) return null;
    return { key: g.url, resultUrl: g.url, surface: selected[0]?.surface ?? "single_wall", areaLabel: effectiveLabel, stone: g.tile };
  }
  function addWishlist(g: Gen) {
    const it = savedFrom(g); if (!it) return;
    setWishlist((l) => (l.some((w) => w.key === it.key) ? l : [it, ...l]));
    setPanel("wishlist");
  }
  function addCart(g: Gen) {
    const it = savedFrom(g); if (!it) return;
    setCart((l) => (l.some((c) => c.key === it.key) ? l : [{ ...it, qty: effectiveArea }, ...l]));
    setPanel("cart");
  }

  function goStep(t: number) {
    if (t <= step) { setStep(t); return; }
    if (t === 2 && scene) setStep(2);
    else if (t === 3 && scene && !detecting && selected.length) setStep(3);
    else if (t === 4 && gens.length) setStep(4);
  }

  const doneCount = gens.filter((g) => g.status !== "pending").length;

  // Shared room stage (steps 1..3)
  const overlayList = step === 2 ? detected : step === 3 ? detected.filter((d) => isSel(d.id)) : [];
  const overlayVisible = showOverlay && step <= 3 && !!scene && overlayList.length > 0;
  const stage = (
    <div ref={stageRef} className="relative rounded-2xl overflow-hidden border border-line bg-black aspect-[16/10]">
      {scene ? (
        <img ref={imgRef} src={scene.imageUrl} alt="" onLoad={measure} className="absolute inset-0 w-full h-full object-contain" />
      ) : (
        <div className="w-full h-full grid place-items-center text-muted text-sm">Pick a room to begin</div>
      )}
      {overlayVisible && rect && (
        <div className="absolute" style={{ left: rect.left, top: rect.top, width: rect.width, height: rect.height }}>
          <SurfaceOverlay
            surfaces={overlayList}
            activeIds={selected.map((a) => a.id)}
            hoverId={hoverId}
            onPick={(s) => toggleArea(areaOfDetected(s))}
            onHover={setHoverId}
          />
        </div>
      )}
      {scene && (step === 2 || step === 3) && selected.length > 0 && (
        <div className="absolute left-3 top-3 text-[11px] px-2 py-1 rounded-md bg-black/70 border border-line pointer-events-none max-w-[80%]">
          Applying to <span className="text-accent font-medium">{effectiveLabel}</span>
        </div>
      )}
      {detecting && step <= 2 && (
        <div className="absolute left-3 top-3 text-[11px] px-2 py-1 rounded-md bg-black/70 border border-line text-muted pointer-events-none animate-pulse">
          ◍ Analysing room…
        </div>
      )}
      {detected.length > 0 && step === 2 && (
        <button className="absolute left-3 bottom-3 btn !py-1 !px-2 text-[11px]" onClick={() => setShowOverlay((v) => !v)}>
          {showOverlay ? "Hide surfaces" : "Show surfaces"}
        </button>
      )}
    </div>
  );

  return (
    <main className="min-h-screen flex flex-col">
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
          <button className="btn !py-1.5 text-xs" onClick={() => setPanel("wishlist")}>♥ Wishlist{wishlist.length ? ` · ${wishlist.length}` : ""}</button>
          <button className="btn !py-1.5 text-xs" onClick={() => setPanel("cart")}>🛒 Cart{cart.length ? ` · ${cart.length}` : ""}</button>
          <a href="/" className="btn !py-1.5 text-xs">New</a>
        </div>
      </header>

      {/* Stepper */}
      <div className="flex items-center gap-1 sm:gap-2 px-5 py-3 border-b border-line overflow-x-auto">
        {STEP_LABELS.map((label, i) => {
          const state = i < step ? "done" : i === step ? "current" : "todo";
          return (
            <div key={label} className="flex items-center gap-1 sm:gap-2 shrink-0">
              {i > 0 && <div className={`h-px w-4 sm:w-8 ${i <= step ? "bg-accent/60" : "bg-line"}`} />}
              <button
                onClick={() => goStep(i)}
                className={`flex items-center gap-1.5 text-xs px-1 ${state === "todo" ? "text-faint cursor-default" : "cursor-pointer"}`}
              >
                <span className={`w-5 h-5 rounded-full grid place-items-center text-[10px] font-semibold ${
                  state === "current" ? "bg-accent text-[#1a1508]" : state === "done" ? "bg-accent/25 text-accent border border-accent/50" : "border border-line text-faint"}`}>
                  {state === "done" ? "✓" : i}
                </span>
                <span className={state === "current" ? "text-ink font-medium" : state === "done" ? "text-muted" : "text-faint"}>{label}</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Body */}
      <div className="flex-1 p-5">
        {step <= 3 && (
          <div className="grid lg:grid-cols-[1fr_380px] gap-5">
            <div className="min-w-0">
              {stage}
              <div className="text-muted text-xs mt-2">
                {step === 1 && "Choose a room from the library, or scan the QR to let the customer send a photo from their phone."}
                {step === 2 && "We scanned the room for surfaces. Tick every area the marble should cover. They highlight on the photo."}
                {step === 3 && (selected.length ? `Marble will be applied to ${effectiveLabel}. Now pick the tiles to compare.` : "")}
              </div>
            </div>

            <div className="flex flex-col gap-4">
              {step === 1 && <ScenePicker projectId={projectId} value={scene} onChange={setScene} />}

              {step === 2 && (
                <div className="card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-display text-base">Where does the marble go?</h3>
                    {detected.length > 0 && (
                      <button className="text-[11px] text-muted hover:text-ink" onClick={() => setManualMode((v) => !v)}>
                        {manualMode ? "Use detected" : "Add manually"}
                      </button>
                    )}
                  </div>
                  <p className="text-muted text-[11px] mb-2.5">Pick one or more areas. The same stone is applied to all of them.</p>
                  {detecting ? (
                    <div className="text-muted text-xs py-2 animate-pulse">◍ Studying the room for floors, walls, counters and tables…</div>
                  ) : detected.length > 0 && !manualMode ? (
                    <div className="flex flex-col gap-1.5">
                      {detected.map((d) => {
                        const on = isSel(d.id);
                        return (
                          <button
                            key={d.id}
                            onMouseEnter={() => setHoverId(d.id)}
                            onMouseLeave={() => setHoverId(null)}
                            onClick={() => toggleArea(areaOfDetected(d))}
                            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border text-left transition-colors ${on ? "bg-accent/15 border-accent" : "border-line hover:border-accent/60"}`}
                          >
                            <span className={`w-4 h-4 rounded grid place-items-center text-[10px] font-bold ${on ? "bg-accent text-[#1a1508]" : "border border-line text-transparent"}`}>✓</span>
                            <span className="text-sm flex-1">{d.label}</span>
                            <span className={`text-[10px] uppercase tracking-wide ${on ? "text-accent" : "text-faint"}`}>
                              {SURFACES.find((s) => s.id === d.surface)?.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div>
                      {detectNote && <div className="text-faint text-[11px] mb-2">{detectNote}</div>}
                      <div className="flex flex-wrap gap-2">
                        {SURFACES.map((s) => {
                          const on = isSel(`m-${s.id}`);
                          return (
                            <button key={s.id} onClick={() => toggleArea(manualArea(s))}
                              className={`px-2.5 py-1.5 rounded-lg text-xs border transition-colors ${on ? "bg-accent text-[#1a1508] border-accent font-semibold" : "border-line text-muted hover:border-accent/60"}`}>
                              {on ? "✓ " : ""}{s.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {selected.length > 0 && (
                    <div className="text-[11px] text-muted mt-3">
                      Selected: <span className="text-ink">{effectiveLabel}</span>
                    </div>
                  )}
                  <div className="text-faint text-[11px] mt-1">Hover a surface to preview it on the room.</div>
                </div>
              )}

              {step === 3 && (
                <>
                  <TilePicker projectId={projectId} value={tiles} onChange={setTiles} />
                  <div className="card p-4">
                    <h3 className="font-display text-base mb-3">Render settings</h3>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm">Book match</span>
                      <button onClick={() => setBookmatch((b) => !b)}
                        className={`w-[38px] h-[22px] rounded-full relative border ${bookmatch ? "bg-accent/25 border-accent" : "bg-panel2 border-line"}`}>
                        <span className={`absolute top-[2px] w-4 h-4 rounded-full transition-all ${bookmatch ? "left-[18px] bg-accent" : "left-[2px] bg-muted"}`} />
                      </button>
                    </div>
                    <ModelSelect models={models} value={model} onChange={setModel} />
                    {!modelAvailable && <div className="text-danger text-[11px] mt-2">This model has no API key set. Add it to .env.local to generate.</div>}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div>
                <h2 className="font-display text-xl">Results for {customerName}</h2>
                <div className="text-muted text-xs mt-0.5">
                  {gens.length} {gens.length === 1 ? "tile" : "tiles"} on {effectiveLabel}
                  {running ? ` · rendering ${doneCount}/${gens.length}` : ""}
                </div>
              </div>
              <div className="flex gap-2">
                <button className="btn !py-1.5 text-xs" onClick={() => setStep(3)}>← Adjust tiles</button>
                <button className="btn btn-gold !py-1.5 text-xs" disabled={running} onClick={runBatch}>{running ? "Rendering…" : "Regenerate"}</button>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {gens.map((g) => (
                <div key={g.id} className="card overflow-hidden">
                  <button
                    className="relative block w-full aspect-[4/3] bg-black"
                    onClick={() => g.url && (setLightbox(g), setLbCompare(false))}
                  >
                    {g.status === "done" && g.url ? (
                      <img src={g.url} alt={g.tile.name} className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                      <>
                        {scene && <img src={scene.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-25" />}
                        <div className="absolute inset-0 grid place-items-center text-center px-3">
                          {g.status === "pending" ? (
                            <div className="animate-pulse text-accent text-sm">Rendering…</div>
                          ) : (
                            <div className="text-danger text-xs">{g.error || "Failed"}</div>
                          )}
                        </div>
                      </>
                    )}
                  </button>
                  <div className="p-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{g.tile.name}</div>
                      <div className="text-[11px] text-muted truncate">
                        {[g.tile.size, g.tile.pricePerSqft ? `₹${g.tile.pricePerSqft}/sq ft` : null].filter(Boolean).join(" · ")}
                      </div>
                    </div>
                    {g.status === "done" && (
                      <div className="flex gap-2 mt-2.5">
                        <button className="btn !py-1.5 text-xs flex-1 justify-center" onClick={() => addWishlist(g)}>♥ Wishlist</button>
                        <button className="btn !py-1.5 text-xs flex-1 justify-center" onClick={() => addCart(g)}>🛒 Cart</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer nav */}
      {step <= 3 && (
        <footer className="sticky bottom-0 bg-[#0f0f11] border-t border-line px-5 py-3 flex items-center justify-between gap-3">
          {step === 1 ? <a href="/" className="btn !py-2 text-sm">← Customer</a> : <button className="btn !py-2 text-sm" onClick={() => setStep(step - 1)}>← Back</button>}
          <div className="text-xs text-muted hidden sm:block">
            {step === 1 && (scene ? "Room selected" : "Select a room to continue")}
            {step === 2 && (selected.length ? `Applying to ${effectiveLabel}` : "Pick at least one area")}
            {step === 3 && `${tiles.length} ${tiles.length === 1 ? "tile" : "tiles"} selected`}
          </div>
          {step === 1 && <button className="btn btn-gold !py-2 text-sm" disabled={!scene} onClick={() => setStep(2)}>Next: surface →</button>}
          {step === 2 && <button className="btn btn-gold !py-2 text-sm" disabled={detecting || !selected.length} onClick={() => setStep(3)}>Next: tiles →</button>}
          {step === 3 && <button className="btn btn-gold !py-2 text-sm" disabled={!tiles.length || running} onClick={runBatch}>Generate {tiles.length || ""} {tiles.length === 1 ? "render" : "renders"} ✦</button>}
        </footer>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-[60] bg-black/85 flex items-center justify-center p-5" onClick={() => setLightbox(null)}>
          <div className="max-w-[min(1000px,96vw)] w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="font-display text-lg">{lightbox.tile.name}</div>
                <div className="text-muted text-xs">
                  {[effectiveLabel, lightbox.tile.size, lightbox.tile.pricePerSqft ? `₹${lightbox.tile.pricePerSqft}/sq ft` : null].filter(Boolean).join(" · ")}
                </div>
              </div>
              <button className="btn !py-1.5 text-xs" onClick={() => setLightbox(null)}>Close ✕</button>
            </div>
            <div className="relative rounded-2xl overflow-hidden border border-line bg-black aspect-[16/10]">
              <img src={lbCompare && scene ? scene.imageUrl : lightbox.url || ""} alt="" className="absolute inset-0 w-full h-full object-contain" />
              {scene && (
                <button
                  className="absolute right-3 top-3 btn !py-1.5 text-xs"
                  onMouseDown={() => setLbCompare(true)} onMouseUp={() => setLbCompare(false)} onMouseLeave={() => setLbCompare(false)}
                  onTouchStart={() => setLbCompare(true)} onTouchEnd={() => setLbCompare(false)}
                >
                  {lbCompare ? "Original" : "Hold to compare"}
                </button>
              )}
            </div>
            <div className="flex gap-2 mt-3">
              <button className="btn flex-1 justify-center" onClick={() => addWishlist(lightbox)}>♥ Add to wishlist</button>
              <button className="btn flex-1 justify-center" onClick={() => addCart(lightbox)}>🛒 Add to cart</button>
            </div>
          </div>
        </div>
      )}

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
