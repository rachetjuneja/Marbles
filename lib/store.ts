import { randomUUID } from "crypto";
import {
  getServiceClient,
  hasSupabase,
  UPLOADS_BUCKET,
  RENDERS_BUCKET,
} from "./supabase";
import type { RenderRow, SessionRow, StoneMeta, Surface, UploadToken } from "./types";

/* ---------------------------------------------------------------------------
 * Storage layer. Uses Supabase when configured, otherwise an in-memory store
 * so the app runs with zero backend config in local dev (single process).
 * In production, configure Supabase — serverless instances do not share memory.
 * ------------------------------------------------------------------------- */

const mem = {
  sessions: new Map<string, SessionRow>(),
  tokens: new Map<string, UploadToken>(),
  renders: new Map<string, RenderRow>(),
};

function nowIso() {
  return new Date().toISOString();
}

/** Store raw image bytes and return a URL the browser + models can read. */
export async function putImage(
  bucket: "uploads" | "renders",
  path: string,
  bytes: Buffer,
  mime: string
): Promise<string> {
  const sb = getServiceClient();
  if (sb) {
    const b = bucket === "uploads" ? UPLOADS_BUCKET : RENDERS_BUCKET;
    const { error } = await sb.storage.from(b).upload(path, bytes, {
      contentType: mime,
      upsert: true,
    });
    if (error) throw new Error("storage upload failed: " + error.message);
    return sb.storage.from(b).getPublicUrl(path).data.publicUrl;
  }
  return `data:${mime};base64,${bytes.toString("base64")}`;
}

export async function createSession(name: string, mobile: string): Promise<SessionRow> {
  const row: SessionRow = {
    id: randomUUID(),
    customerName: name,
    customerMobile: mobile,
    createdAt: nowIso(),
  };
  const sb = getServiceClient();
  if (sb) {
    const { data, error } = await sb
      .from("projects")
      .insert({ id: row.id, customer_name: name, customer_mobile: mobile })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return {
      id: data.id,
      customerName: data.customer_name,
      customerMobile: data.customer_mobile,
      createdAt: data.created_at,
    };
  }
  mem.sessions.set(row.id, row);
  return row;
}

export async function getSession(id: string): Promise<SessionRow | null> {
  const sb = getServiceClient();
  if (sb) {
    const { data } = await sb.from("projects").select().eq("id", id).single();
    if (!data) return null;
    return {
      id: data.id,
      customerName: data.customer_name,
      customerMobile: data.customer_mobile,
      createdAt: data.created_at,
    };
  }
  return mem.sessions.get(id) ?? null;
}

export async function createToken(projectId: string, kind: "scene" | "stone"): Promise<UploadToken> {
  const token = randomUUID().replace(/-/g, "").slice(0, 10);
  const row: UploadToken = { token, projectId, kind, status: "pending", createdAt: nowIso() };
  const sb = getServiceClient();
  if (sb) {
    await sb.from("upload_tokens").insert({ token, project_id: projectId, kind, status: "pending" });
  } else {
    mem.tokens.set(token, row);
  }
  return row;
}

export async function getToken(token: string): Promise<UploadToken | null> {
  const sb = getServiceClient();
  if (sb) {
    const { data } = await sb.from("upload_tokens").select().eq("token", token).single();
    if (!data) return null;
    return {
      token: data.token,
      projectId: data.project_id,
      kind: data.kind,
      status: data.status,
      url: data.url ?? undefined,
      createdAt: data.created_at,
    };
  }
  return mem.tokens.get(token) ?? null;
}

export async function completeToken(token: string, url: string): Promise<void> {
  const sb = getServiceClient();
  if (sb) {
    await sb.from("upload_tokens").update({ status: "done", url }).eq("token", token);
    return;
  }
  const t = mem.tokens.get(token);
  if (t) {
    t.status = "done";
    t.url = url;
  }
}

export async function saveRender(r: {
  projectId: string;
  sceneUrl: string;
  resultUrl: string;
  surface: Surface;
  model: string;
  bookmatch: boolean;
  stone: StoneMeta;
}): Promise<RenderRow> {
  const row: RenderRow = {
    id: randomUUID(),
    shortlisted: false,
    createdAt: nowIso(),
    ...r,
  };
  const sb = getServiceClient();
  if (sb) {
    await sb.from("renders").insert({
      id: row.id,
      project_id: r.projectId,
      scene_url: r.sceneUrl,
      result_url: r.resultUrl,
      surface: r.surface,
      model: r.model,
      bookmatch: r.bookmatch,
      stone: r.stone,
      shortlisted: false,
    });
  } else {
    mem.renders.set(row.id, row);
  }
  return row;
}

export async function listRenders(projectId: string): Promise<RenderRow[]> {
  const sb = getServiceClient();
  if (sb) {
    const { data } = await sb
      .from("renders")
      .select()
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });
    return (data ?? []).map((d: any) => ({
      id: d.id,
      projectId: d.project_id,
      sceneUrl: d.scene_url,
      resultUrl: d.result_url,
      surface: d.surface,
      model: d.model,
      bookmatch: d.bookmatch,
      stone: d.stone,
      shortlisted: d.shortlisted,
      createdAt: d.created_at,
    }));
  }
  return [...mem.renders.values()]
    .filter((r) => r.projectId === projectId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function setShortlist(renderId: string, on: boolean): Promise<void> {
  const sb = getServiceClient();
  if (sb) {
    await sb.from("renders").update({ shortlisted: on }).eq("id", renderId);
    return;
  }
  const r = mem.renders.get(renderId);
  if (r) r.shortlisted = on;
}

export { hasSupabase };
