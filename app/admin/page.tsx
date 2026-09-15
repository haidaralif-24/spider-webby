import Link from "next/link";
import { AdminBar } from "@/components/admin/admin-bar";
import { requireAdmin } from "@/lib/auth";
import id from "@/messages/id.json";

/**
 * The admin dashboard.
 *
 * Deliberately thin: the sign-in gate, one link, and who you are signed in as.
 * The authoring screens arrive in P1 and land under this same gate.
 *
 * `requireAdmin()` is the real check — `middleware.ts` already bounced anyone
 * without the role, but a page that relies on the middleware is one matcher
 * change away from being public.
 */
export default async function AdminPage() {
  const admin = await requireAdmin();

  return (
    <>
      <AdminBar />

      <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
        <p className="text-base text-deep-charcoal/75">
          {id.admin.signedInAs}{" "}
          <span className="font-bold text-deep-charcoal">{admin.email}</span>
        </p>

        <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <li>
            <Link
              href="/admin/eksperimen"
              className="btn-playful flex min-h-touch items-center justify-center rounded-3xl border-[3px] border-deep-charcoal bg-science-green px-6 py-5 font-display text-xl font-extrabold text-deep-charcoal"
            >
              {id.admin.expLink}
            </Link>
          </li>
          <li>
            <Link
              href="/admin/media"
              className="btn-playful flex min-h-touch items-center justify-center rounded-3xl border-[3px] border-deep-charcoal bg-discovery-yellow px-6 py-5 font-display text-xl font-extrabold text-deep-charcoal"
            >
              {id.admin.mediaLink}
            </Link>
          </li>
        </ul>
      </div>
    </>
  );
}
