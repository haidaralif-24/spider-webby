import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Who is signed in, and are they an admin.
 *
 * AGENTS.md §4.2 — **the admin role lives in `app_metadata`, never
 * `user_metadata`.** `user_metadata` is user-editable, so checking it would be a
 * self-serve admin button. There is deliberately no `is_admin` column on any
 * user-readable table either; the claim is the only source.
 *
 * This is the client-side half of the enforcement. The other two are
 * `middleware.ts` (redirect — UX only, never a security boundary) and the RLS
 * policies in `supabase/migrations/` (the actual backstop). A Server Action that
 * trusts this and skips its own check is one refactor away from being callable
 * by anyone.
 *
 * `getUser()` rather than `getClaims()`: the latter is faster but its return
 * shape has moved between SDK versions, and this runs for one person on a
 * handful of pages. Not the place to be clever.
 */

export type AdminUser = {
  id: string;
  email: string | null;
};

/** The role claim. `app_metadata` is only writable by the service role. */
function hasAdminRole(appMetadata: unknown): boolean {
  if (typeof appMetadata !== "object" || appMetadata === null) return false;
  return (appMetadata as Record<string, unknown>).role === "admin";
}

/** The signed-in admin, or `null` for everyone else — including non-admin users. */
export async function getAdminUser(): Promise<AdminUser | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) return null;
  if (!hasAdminRole(data.user.app_metadata)) return null;

  return {
    id: data.user.id,
    email: data.user.email ?? null,
  };
}

/**
 * For Server Actions and admin pages. Redirects rather than throwing, so the
 * failure mode is "back to the sign-in form" instead of a 500.
 */
export async function requireAdmin(): Promise<AdminUser> {
  const admin = await getAdminUser();
  if (!admin) redirect("/admin/masuk");
  return admin;
}
