"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import id from "@/messages/id.json";

/**
 * Admin sign-in and sign-out.
 *
 * AGENTS.md §4.2 — every Server Action re-checks the role itself. The middleware
 * redirect is UX; a Server Action is reachable by anyone who can POST to it, so
 * it has to be the real boundary.
 *
 * Email + password, not Google OAuth and not a magic link. The reasoning is in
 * the conversation that produced this file: a single admin needs no provider
 * setup, and Supabase's built-in email sender is rate-limited to the point that
 * magic links are unreliable without custom SMTP. A password has no delivery
 * dependency at all.
 *
 * Note what this action does NOT do: create accounts. There is no sign-up path
 * anywhere in the product. The admin is created once by hand and promoted via
 * `app_metadata.role` — see the note at the bottom of this file.
 */

export type SignInState = { error: string | null };

export async function signIn(
  _previous: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: id.admin.signInEmpty };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    /* One message for both "no such user" and "wrong password". Distinguishing
     * them tells an attacker which addresses exist. */
    return { error: id.admin.signInFailed };
  }

  /* A valid account is not an admin account. Without this check anyone who
   * could sign up would land in the dashboard — which is also why there is no
   * sign-up path. */
  if (data.user.app_metadata?.role !== "admin") {
    await supabase.auth.signOut();
    return { error: id.admin.signInNotAdmin };
  }

  redirect("/admin");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/masuk");
}

/* ---------------------------------------------------------------------------
 * Creating the admin (once, by hand — there is no UI for this on purpose).
 *
 * 1. Supabase dashboard → Authentication → Users → Add user.
 *    Set an email and password, and tick "Auto Confirm User".
 * 2. Open that user → Raw App Meta Data, and set:
 *
 *      { "role": "admin" }
 *
 *    It must be app_metadata, never user_metadata: user_metadata is editable by
 *    the signed-in user, so checking it would let anyone promote themselves.
 *    This is also why `is_admin()` in the migration reads
 *    `auth.jwt() -> 'app_metadata'`.
 * 3. Sign in at /admin/masuk.
 *
 * The service-role client in lib/supabase/admin.ts exists for exactly this kind
 * of operation, if it is ever worth scripting instead.
 * ------------------------------------------------------------------------- */
