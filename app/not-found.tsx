import type { Metadata } from "next";
import Link from "next/link";
import { FieldIcon } from "@/components/field-icon";
import { TangleWeb } from "@/components/tangle-web";
import { WebbyMark } from "@/components/webby-mark";
import { FIELDS } from "@/lib/content";
import { FIELD_THEME } from "@/lib/field-theme";
import id from "@/messages/id.json";

/**
 * 404.
 *
 * Rendered inside the root layout, so it keeps the header, the footer and the
 * way home — which is most of what a 404 has to do. Catches both `notFound()`
 * calls from a page and URLs that match no route at all.
 *
 * It does real work rather than just apologising: the three field chips are
 * recovery links, because a child who mistyped a URL should end up somewhere
 * worth being rather than at a dead end. A server component, zero client JS.
 *
 * Copy rules (AGENTS.md §3): short sentences, one idea each, SD-level Indonesian.
 */
export const metadata: Metadata = {
  title: id.notFound.title,
};

export default function NotFound() {
  return (
    <>
      <section className="relative isolate overflow-hidden bg-lab-mist">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10"
        >
          <div className="hero-grid absolute inset-0 opacity-40" />
          <div className="hero-glow absolute -left-32 -top-32 h-96 w-96 [--glow-color:var(--color-fun-purple)]" />
          <div className="hero-glow absolute -right-24 top-10 h-80 w-80 [--glow-color:var(--color-curious-blue)] [--glow-strength:25%] [--reveal-delay:120ms]" />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-linear-to-b from-transparent to-cloud-white" />
        </div>

        <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 pb-14 pt-12 sm:px-6 lg:grid-cols-12 lg:gap-14 lg:pb-20 lg:pt-16">
          <div className="lg:col-span-7">
            <p className="reveal inline-flex items-center rounded-full border-[3px] border-deep-charcoal bg-discovery-yellow px-4 py-1.5 font-display text-sm font-extrabold tracking-widest text-deep-charcoal [--reveal-delay:40ms]">
              404
            </p>

            <h1 className="reveal heading-box mt-5 max-w-full rounded-3xl border-[3px] border-deep-charcoal bg-cloud-white px-5 py-3 font-display text-3xl font-extrabold text-deep-charcoal sm:text-4xl [--reveal-delay:80ms]">
              {id.notFound.heading}
            </h1>

            <p className="copy-lift reveal mt-5 max-w-lg text-lg text-pretty text-deep-charcoal/85 [--reveal-delay:140ms]">
              {id.notFound.body}
            </p>

            <Link
              href="/"
              className="btn-playful reveal mt-7 inline-flex min-h-touch items-center justify-center rounded-2xl border-[3px] border-deep-charcoal bg-science-green px-6 py-3 text-lg font-bold text-deep-charcoal [--reveal-delay:200ms]"
            >
              {id.notFound.cta}
            </Link>
          </div>

          <div className="lg:col-span-5">
            <div className="field-stage reveal-pop relative overflow-hidden rounded-[2rem] border-[3px] border-deep-charcoal bg-cloud-white p-5 [--reveal-delay:160ms] sm:p-7">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
              >
                <div className="hero-glow absolute -right-16 -top-16 h-56 w-56 [--glow-color:var(--color-fun-purple)] [--glow-strength:28%]" />
              </div>

              <div className="relative">
                <TangleWeb className="h-auto w-full" />

                {/* Webby sitting in the middle of his own web, which is the
                 * joke the illustration is making. */}
                <WebbyMark className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 animate-float will-change-transform" />

                <p className="webby-bubble absolute left-0 top-0 w-fit max-w-full rounded-2xl border-[3px] border-deep-charcoal bg-discovery-yellow px-3 py-1.5 text-sm font-bold text-deep-charcoal shadow-playful-sm">
                  {id.notFound.mascot}
                  <span
                    aria-hidden="true"
                    className="absolute -bottom-[9px] right-5 h-3.5 w-3.5 rotate-45 border-b-[3px] border-r-[3px] border-deep-charcoal bg-discovery-yellow"
                  />
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Recovery. A dead end is only a dead end if there is nowhere to go. */}
      <section
        aria-labelledby="not-found-fields"
        className="mx-auto w-full max-w-5xl px-4 pb-20 pt-8 sm:px-6"
      >
        <h2
          id="not-found-fields"
          className="reveal heading-box rounded-2xl border-[3px] border-deep-charcoal bg-discovery-yellow px-4 py-2 font-display text-2xl font-bold text-deep-charcoal [--reveal-delay:80ms] sm:text-3xl"
        >
          {id.notFound.fieldsHeading}
        </h2>

        <ul className="mt-6 flex flex-wrap gap-3">
          {FIELDS.map((field) => (
            <li key={field.slug}>
              <Link
                href={`/${field.slug}`}
                className={`${FIELD_THEME[field.slug].fill} btn-playful inline-flex min-h-touch items-center gap-2 rounded-full border-[3px] border-deep-charcoal px-5 py-2.5 text-base font-bold text-deep-charcoal`}
              >
                <FieldIcon field={field.slug} className="h-5 w-5 shrink-0" />
                {field.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
