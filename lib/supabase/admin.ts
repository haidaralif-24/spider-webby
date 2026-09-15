import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { requireEnv } from "@/lib/env";

/**
 * The service-role client. **Bypasses RLS entirely.**
 *
 * AGENTS.md §4.2 says admin access is enforced in three places — middleware
 * (UX only), every Server Action (the real boundary), and RLS (the backstop).
 * This client removes the backstop, so reaching for it is a decision that needs
 * a reason, not a convenience.
 *
 * Legitimate uses: nothing yet. It exists for the operations RLS cannot express
 * — setting `app_metadata.role` when promoting the admin, and the scheduled sweep
 * of orphaned media (brief §3.2).
 *
 * `persistSession: false` matters: without it this client would try to manage a
 * session in the server process, which is shared across every request.
 */
export function createAdminClient() {
  return createSupabaseClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
