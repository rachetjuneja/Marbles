export type Provider = "gemini" | "flux" | "openai";

export interface ModelDef {
  id: string; // internal id used in the dropdown
  label: string;
  provider: Provider;
  note: string;
  approxCost: string;
  /** resolve the concrete provider model id from env (so it stays swappable) */
  resolveModel: () => string;
  /** which env var must be present for this model to work */
  keyEnv: string;
}

export const MODELS: ModelDef[] = [
  {
    id: "nano2",
    label: "Nano Banana 2",
    provider: "gemini",
    note: "Gemini 3.1 Flash Image. Fast, strong at applying a reference slab and keeping the room.",
    approxCost: "~$0.05–0.10",
    resolveModel: () => process.env.GEMINI_MODEL_NANO2 || "gemini-3.1-flash-image",
    keyEnv: "GEMINI_API_KEY",
  },
  {
    id: "nanopro",
    label: "Nano Banana Pro",
    provider: "gemini",
    note: "Gemini 3 Pro Image. Highest fidelity — use for final hero renders.",
    approxCost: "~$0.13–0.24",
    resolveModel: () => process.env.GEMINI_MODEL_PRO || "gemini-3-pro-image",
    keyEnv: "GEMINI_API_KEY",
  },
  {
    id: "nano",
    label: "Nano Banana (2.5)",
    provider: "gemini",
    note: "The original Gemini 2.5 Flash Image. Cheapest Gemini option.",
    approxCost: "~$0.039",
    resolveModel: () => process.env.GEMINI_MODEL_CLASSIC || "gemini-2.5-flash-image",
    keyEnv: "GEMINI_API_KEY",
  },
  {
    id: "flux",
    label: "FLUX.1 Kontext",
    provider: "flux",
    note: "Black Forest Labs via fal.ai. More control, better self-host / commercial terms.",
    approxCost: "~$0.04–0.08",
    resolveModel: () => process.env.FAL_MODEL || "fal-ai/flux-pro/kontext/max/multi",
    keyEnv: "FAL_KEY",
  },
  {
    id: "gptimage",
    label: "GPT Image",
    provider: "openai",
    note: "OpenAI's ChatGPT image engine. Strong, a touch pricier at high quality.",
    approxCost: "~$0.04–0.21",
    resolveModel: () => process.env.OPENAI_IMAGE_MODEL || "gpt-image-1",
    keyEnv: "OPENAI_API_KEY",
  },
];

export function getModel(id: string): ModelDef | undefined {
  return MODELS.find((m) => m.id === id);
}

/** Public view of the registry for the client dropdown (no secrets). */
export function publicModels() {
  return MODELS.map((m) => ({
    id: m.id,
    label: m.label,
    note: m.note,
    approxCost: m.approxCost,
    available: Boolean(process.env[m.keyEnv]),
  }));
}
