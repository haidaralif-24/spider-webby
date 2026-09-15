import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { requireEnv } from "@/lib/env";

/**
 * The request-scoped Supabase client, authenticated as whoever is signed in.
 *
 * Uses the **anon key**, so every query it makes is subject to RLS. That is the
 * point: the admin's power comes from `app_metadata.role`, enforced by the
 * database, not from the client being special. Anything that needs to bypass RLS
 * belongs in `lib/supabase/admin.ts` and needs a reason.
 *
 * `getAll` / `setAll` is the `@supabase/ssr` cookie contract. `setAll` throws
 * when called from a Server Component, where cookies are read-only — that is
 * expected and swallowed, because `middleware.ts` refreshes the session on every
 * request instead.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            /* Server Component render: cookies are read-only. The middleware
             * has already refreshed the session for this request. */
          }
        },
      },
    },
  );
}
