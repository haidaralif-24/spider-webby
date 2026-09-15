import Link from "next/link";
import { signOut } from "@/app/admin/actions";
import { WebbyMark } from "@/components/webby-mark";
import id from "@/messages/id.json";

/**
 * The bar across the top of the signed-in admin pages.
 *
 * Sign-out is a plain `<form>` posting to a Server Action, so it needs no client
 * JS — and it is a POST, which means it cannot be triggered by a stray link or a
 * prefetch.
 */
export function AdminBar() {
  return (
    <header className="border-b-[3px] border-deep-charcoal bg-lab-mist">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link
          href="/admin"
          className="inline-flex min-h-touch items-center gap-2"
        >
          <WebbyMark className="h-8 w-8 shrink-0" />
          <span className="font-display text-lg font-extrabold text-deep-charcoal">
            {id.admin.dashboardHeading}
          </span>
        </Link>

        <form action={signOut}>
          <button
            type="submit"
            className="btn-playful inline-flex min-h-touch items-center justify-center rounded-2xl border-[3px] border-deep-charcoal bg-cloud-white px-5 py-2 text-base font-bold text-deep-charcoal"
          >
            {id.admin.signOut}
          </button>
        </form>
      </div>
    </header>
  );
}
