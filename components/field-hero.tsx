import Link from "next/link";
import id from "@/messages/id.json";
import { FieldIcon } from "@/components/field-icon";
import { FieldMotif } from "@/components/field-motif";
import type { Field } from "@/lib/content";
import { FIELD_THEME } from "@/lib/field-theme";

/**
 * The top of a field page.
 *
 * Server component, zero client JS (AGENTS.md §4.5). What makes the three field
 * pages feel like three pages rather than one page in three colours:
 *
 * 1. The headline is the field's own colour, as a sticker, with the field's icon
 *    silhouette inside it — so the colour reinforces a shape rather than
 *    carrying the signal alone (§4.9).
 * 2. The background texture is different in kind, not just in tint: ruled graph
 *    paper for Physics, an even dot lattice for Chemistry, and nothing ruled at
 *    all for Biology.
 * 3. The motif is a different illustration with a different kind of movement —
 *    an orbit, rising bubbles, a swaying leaf.
 */
export function FieldHero({ field }: { field: Field }) {
  const theme = FIELD_THEME[field.slug];
  const [lead, ...rest] = field.intro;

  return (
    <section className={`relative isolate overflow-hidden ${theme.band}`}>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className={`${theme.surface} absolute inset-0 opacity-30`} />
        <div
          className={`hero-glow absolute -left-32 -top-32 h-96 w-96 ${theme.glow}`}
        />
        <div
          className={`hero-glow absolute -right-28 top-16 h-80 w-80 ${theme.glow} [--glow-strength:22%] [--reveal-delay:140ms]`}
        />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-linear-to-b from-transparent to-cloud-white" />
      </div>

      <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 pb-12 pt-10 sm:px-6 lg:grid-cols-12 lg:gap-14 lg:pb-16 lg:pt-14">
        <div className="lg:col-span-7">
          {/* An explicit way back, at the top of the content rather than only in
           * the nav. The nav's "Beranda" is the same destination, but a reader
           * who has scrolled into a field page should not have to go looking in
           * the chrome for the way out. */}
          <Link
            href="/"
            className="btn-playful reveal mb-5 inline-flex min-h-touch items-center gap-2 rounded-full border-[3px] border-deep-charcoal bg-cloud-white px-4 py-2 text-sm font-bold text-deep-charcoal [--reveal-delay:20ms]"
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="h-4 w-4 shrink-0 fill-none stroke-deep-charcoal"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 5l-7 7 7 7" />
            </svg>
            {id.fieldPage.back}
          </Link>

          {/* Charcoal on the field colour, never the field colour as text — all
           * three sit below 3.2:1 against white (AGENTS.md §4.8). */}
          <h1
            className={`reveal heading-box ${theme.fill} rounded-3xl border-[3px] border-deep-charcoal px-5 py-3 font-display text-4xl font-extrabold text-deep-charcoal sm:text-5xl [--reveal-delay:40ms]`}
          >
            <span className="flex items-center gap-3">
              <FieldIcon field={field.slug} className="h-8 w-8 shrink-0" />
              {field.name}
            </span>
          </h1>

          <p className="copy-lift reveal mt-5 max-w-lg text-lg text-pretty text-deep-charcoal/85 sm:text-xl [--reveal-delay:100ms]">
            {lead}
          </p>

          {rest.map((paragraph, index) => (
            <p
              key={paragraph}
              className={`copy-lift reveal mt-3 max-w-lg text-base text-pretty text-deep-charcoal/80 [--reveal-delay:${
                100 + (index + 1) * 60
              }ms]`}
            >
              {paragraph}
            </p>
          ))}

          <a
            href="#eksperimen"
            className="btn-playful reveal mt-7 inline-flex min-h-touch items-center justify-center rounded-2xl border-[3px] border-deep-charcoal bg-science-green px-6 py-3 text-lg font-bold text-deep-charcoal [--reveal-delay:260ms]"
          >
            {id.fieldPage.cta}
          </a>
        </div>

        {/* Cloud White, not the field colour: the motif's main shape IS the
         * field colour, so a field-coloured card would swallow it. */}
        <div className="lg:col-span-5">
          <div className="field-stage reveal-pop relative overflow-hidden rounded-[2rem] border-[3px] border-deep-charcoal bg-cloud-white p-5 [--reveal-delay:160ms] sm:p-7">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
            >
              <div className={`${theme.surface} absolute inset-0 opacity-25`} />
              <div
                className={`hero-glow absolute -right-16 -top-16 h-56 w-56 ${theme.glow} [--glow-strength:28%]`}
              />
            </div>

            <FieldMotif
              field={field.slug}
              className="relative mx-auto h-auto w-full max-w-[19rem]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
