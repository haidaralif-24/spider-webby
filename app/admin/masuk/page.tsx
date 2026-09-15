import type { Metadata } from "next";
import { SignInForm } from "@/components/admin/sign-in-form";
import { WebbyMark } from "@/components/webby-mark";
import id from "@/messages/id.json";

/**
 * Admin sign-in.
 *
 * `noindex` per the route map in brief §7 — `/admin/**` is authoring, and it
 * should never surface in search results.
 *
 * A server component wrapping one client form. The page itself needs no
 * interactivity, and `middleware.ts` has already bounced anyone who is not an
 * admin (and anyone who *is* one straight to the dashboard).
 */
export const metadata: Metadata = {
  title: id.admin.signInHeading,
  robots: { index: false, follow: false },
};

export default function AdminSignInPage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-lab-mist px-4 py-16">
      <div className="w-full max-w-sm rounded-[2rem] border-[3px] border-deep-charcoal bg-cloud-white p-6 shadow-playful sm:p-8">
        <div className="flex items-center gap-3">
          <WebbyMark className="h-10 w-10 shrink-0" />
          <h1 className="font-display text-xl font-extrabold text-deep-charcoal">
            {id.admin.signInHeading}
          </h1>
        </div>

        <p className="mt-3 text-sm text-deep-charcoal/75">
          {id.admin.signInHint}
        </p>

        <div className="mt-6">
          <SignInForm />
        </div>
      </div>
    </div>
  );
}
