import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;

let supabaseInstance: SupabaseClient | null = null;
let supabaseAdminInstance: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  return Boolean(
    supabaseUrl &&
    supabaseUrl.startsWith("https://") &&
    !supabaseUrl.includes("your-project-id") &&
    supabaseServiceKey &&
    !supabaseServiceKey.includes("your-service-role-key")
  );
}

/**
 * Client-safe Supabase client (Anon Key)
 */
export function getSupabase(): SupabaseClient {
  if (supabaseInstance) return supabaseInstance;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Peringatan: Kredensial Supabase (URL / ANON KEY) belum dikonfigurasi di .env.local.");
  }

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  return supabaseInstance;
}

/**
 * Server-only Supabase client (Service Role Key) for secure backend database operations
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (supabaseAdminInstance) return supabaseAdminInstance;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn("Peringatan: Kredensial Supabase (URL / SERVICE ROLE KEY) belum dikonfigurasi di .env.local.");
  }

  supabaseAdminInstance = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  return supabaseAdminInstance;
}
