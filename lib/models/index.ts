import { getModel } from "./registry";
import { refToBytes } from "./util";
import { geminiGenerate } from "./gemini";
import { fluxGenerate } from "./flux";
import { openaiGenerate } from "./openai";

export interface RunOpts {
  modelId: string;
  prompt: string;
  sceneRef: string; // URL or data URL
  stoneRef: string; // URL or data URL (book-matched already if requested)
}

/** Dispatch a generation to the chosen provider. Returns image bytes as base64. */
export async function runGenerate(opts: RunOpts): Promise<{ base64: string; mime: string }> {
  const def = getModel(opts.modelId);
  if (!def) throw new Error(`Unknown model: ${opts.modelId}`);
  if (!process.env[def.keyEnv]) {
    throw new Error(`${def.label} needs ${def.keyEnv} set in your environment.`);
  }
  const [scene, stone] = await Promise.all([refToBytes(opts.sceneRef), refToBytes(opts.stoneRef)]);
  const model = def.resolveModel();
  switch (def.provider) {
    case "gemini":
      return geminiGenerate(model, opts.prompt, scene, stone);
    case "flux":
      return fluxGenerate(model, opts.prompt, scene, stone);
    case "openai":
      return openaiGenerate(model, opts.prompt, scene, stone);
    default:
      throw new Error("unsupported provider");
  }
}
