import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Session refresh and the `/admin` gate.
 *
 * Next 16 renamed this file convention from `middleware.ts` to `proxy.ts`, and
 * the exported function from `middleware` to `proxy`. The body is unchanged, and
 * so is the `config` matcher.
 *
 * **This is UX, not security.** AGENTS.md §4.2 is explicit that the middleware
 * redirect is the friendly half of the enforcement; the real boundary is the
 * `requireAdmin()` call inside every Server Action, and the backstop is RLS. A
 * middleware-only guard is bypassable by anyone who can reach an action directly.
 *
 * Two jobs:
 *
 * 1. Refresh the auth cookie on every admin request. Server Components cannot
 *    write cookies, so without this the session silently expires mid-visit and
 *    the admin gets bounced to the sign-in form for no visible reason.
 * 2. Send signed-out visitors to `/admin/masuk` rather than rendering an admin
 *    shell whose queries will all fail.
 *
 * The anon key is used because the middleware only needs to *read* the session,
 * never to act with elevated rights.
 */

/* Read literally, not through a helper. Middleware runs on the Edge, where Next
 * inlines `process.env.NEXT_PUBLIC_X` at build time — a dynamic lookup would
 * come back undefined in the deployed bundle while working fine locally. */
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function proxy(request: NextRequest) {
  /* Without configuration we can neither refresh a session nor verify anyone.
   * Pass the request through and let the page fail with its own clear error —
   * redirecting here would loop, because the sign-in page is behind this same
   * matcher. */
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  /* Must be awaited: this is what refreshes the token and triggers `setAll`. */
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isSignInPage = request.nextUrl.pathname === "/admin/masuk";
  const isAdmin = user?.app_metadata?.role === "admin";

  if (!isAdmin && !isSignInPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/masuk";
    url.search = "";
    return NextResponse.redirect(url);
  }

  /* Already signed in and asking for the form: show the dashboard instead of a
   * login page to someone who is already logged in. */
  if (isAdmin && isSignInPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
