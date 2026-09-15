import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { requireEnv } from "@/lib/env";

/**
 * The read-only client for public pages.
 *
 * **No cookies, on purpose.** `lib/supabase/server.ts` calls `cookies()`, which
 * forces a route to be dynamically rendered — fine for `/admin`, fatal for the
 * public content pages, which AGENTS.md §4.5 requires to be statically rendered
 * with zero client JS.
 *
 * This client holds no session and never will, so a page that uses it stays
 * static and is refreshed by `revalidatePath()` on publish plus a time-based
 * `revalidate` as a safety net. It authenticates as `anon`, which means RLS's
 * `status = 'published'` policy is doing the filtering — the public site
 * physically cannot read a draft.
 *
 * Memoised: one client per server process rather than one per query.
 */

let cached: SupabaseClient | null = null;

export function createPublicClient(): SupabaseClient {
  if (!cached) {
    cached = createClient(
      requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
      requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      },
    );
  }
  return cached;
}
