"use client";

import { useActionState } from "react";
import { signIn, type SignInState } from "@/app/admin/actions";
import id from "@/messages/id.json";

/**
 * The admin sign-in form.
 *
 * A client component because `useActionState` is how the inline error and the
 * pending state get here without hand-rolling a fetch. This is `/admin`, which
 * `AGENTS.md` §4.5 explicitly allows to be dynamic — the zero-client-JS rule is
 * about public content pages.
 */

const INITIAL: SignInState = { error: null };

export function SignInForm() {
  const [state, formAction, pending] = useActionState(signIn, INITIAL);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label
          htmlFor="email"
          className="text-sm font-bold text-deep-charcoal"
        >
          {id.admin.email}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          /* 16px minimum: iOS Safari zooms the whole page when a focused input
           * is smaller than that. */
          className="min-h-touch rounded-2xl border-[3px] border-deep-charcoal bg-cloud-white px-4 py-3 text-base text-deep-charcoal outline-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-deep-charcoal"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="password"
          className="text-sm font-bold text-deep-charcoal"
        >
          {id.admin.password}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="min-h-touch rounded-2xl border-[3px] border-deep-charcoal bg-cloud-white px-4 py-3 text-base text-deep-charcoal outline-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-deep-charcoal"
        />
      </div>

      {/* role="alert" so a screen reader announces the failure instead of
       * leaving the reader to notice that nothing happened. */}
      {state.error ? (
        <p
          role="alert"
          className="rounded-2xl border-[3px] border-deep-charcoal bg-energy-orange px-4 py-3 text-base font-bold text-deep-charcoal"
        >
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="btn-playful inline-flex min-h-touch items-center justify-center rounded-2xl border-[3px] border-deep-charcoal bg-science-green px-6 py-3 text-lg font-bold text-deep-charcoal disabled:opacity-70"
      >
        {pending ? id.admin.signingIn : id.admin.signIn}
      </button>
    </form>
  );
}
