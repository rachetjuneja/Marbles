# The Sales OS — Marble Visualiser

A generative marble/stone sales visualiser for tile and marble businesses. The sales
team captures a customer, picks (or the customer scans and uploads) a room and a stone,
and an image model paints the stone into the real room — photorealistically, on the
chosen surface, book-matched. Every render is saved to the customer's project, the seed
of the quote and the follow up.

Built with **Next.js (App Router) + TypeScript + Tailwind**, with a **per-generation model
dropdown** (Nano Banana 2, Nano Banana Pro, FLUX.1 Kontext, GPT Image) behind one clean
interface, and **Supabase** for persistence, storage and the QR upload handoff.

## The flow
1. **Customer** — name + mobile (`/`).
2. **Room** — pick from the library, upload, or **Scan** a QR so the customer uploads from their phone.
3. **Stone** — pick from the library, or upload / scan a slab photo and capture its details (name, origin, price, size).
4. **Apply** — choose the surface (Single Wall / All Walls / Floor / Countertops / Staircase), toggle **Book match**, choose the **model**, and **Generate**.
5. **Shortlist + Sales pack** — save the looks the customer likes, then generate a priced pack.

## Quick start (zero backend needed to see it run)
```bash
cp .env.example .env.local     # add at least ONE image-model key to actually generate
npm install
npm run dev                    # http://localhost:3000
```
With no keys the UI works end to end; the **Generate** step needs at least one model key.

- **Nano Banana (Gemini):** `GEMINI_API_KEY` — https://aistudio.google.com/apikey
- **FLUX.1 Kontext (fal.ai):** `FAL_KEY` — https://fal.ai/dashboard/keys
- **GPT Image (OpenAI):** `OPENAI_API_KEY` — https://platform.openai.com/api-keys

> Model IDs live in `.env.example` (e.g. `GEMINI_MODEL_NANO2`). Google iterates fast — if a
> call 404s, confirm the exact id in Google AI Studio and update the env var. No code change.

## Turn on Supabase (recommended for production)
Local dev keeps sessions and the QR handoff **in memory**, which is fine on one machine but
does not survive serverless (multi-instance) deploys. For production:
1. Create a project at supabase.com.
2. Run `supabase/schema.sql` in the SQL editor.
3. Put `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` in your env.

Now customers, renders and QR uploads persist, and the QR phone→desktop handoff works across
devices and instances. This same Postgres is the foundation for the Phase 2 ERP.

## Deploy
Deploy to Vercel (or any Node host). Set the env vars in the host, and set
`NEXT_PUBLIC_BASE_URL` to the deployed URL so the QR upload links are correct.

## How book match stays accurate
`lib/bookmatch.ts` builds a deterministic 2×2 mirrored tile from the slab image (mirror X,
Y and both), so the veins meet exactly at the seams. That book-matched image is what we hand
to the model, so the mirror geometry is correct rather than left to the model to guess.

## Where things live
- `lib/models/*` — provider adapters (Gemini / FLUX / OpenAI) behind `runGenerate()`, plus the `registry` that powers the dropdown.
- `lib/prompt.ts` — the edit instruction (surface + book match).
- `lib/store.ts` — persistence (Supabase or in-memory).
- `app/api/*` — session/token, mobile-upload (QR target), generate.
- `components/*` — the flow UI (customer, pickers, QR, workspace, sales pack).
- `lib/library.ts` + `public/library/*` — the starter scene and slab library (swap in your own).

## Not done yet (deliberate next steps)
- Auto surface detection (so the rep doesn't confirm the surface) — a segmentation step.
- Real inventory / SKU sync instead of the starter library.
- Auth + multi-showroom, and the Phase 2 ERP tables (item master, ledger, jobs).
- Harden Supabase (private buckets + signed URLs + RLS) before real customer data.
