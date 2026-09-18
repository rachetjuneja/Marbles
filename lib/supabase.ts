import { createClient, SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const hasSupabase = Boolean(url && serviceKey);

let _client: SupabaseClient | null = null;

/** Server-only client using the service role. Never import this into a client component. */
export function getServiceClient(): SupabaseClient | null {
  if (!hasSupabase) return null;
  if (!_client) {
    _client = createClient(url as string, serviceKey as string, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return _client;
}

export const UPLOADS_BUCKET = "uploads";
export const RENDERS_BUCKET = "renders";
