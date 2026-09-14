import id from "@/messages/id.json";
import { WebbyMascot } from "@/components/webby-mascot";

/**
 * The home hero.
 *
 * Server component, zero client JS — a public content page is statically
 * rendered (AGENTS.md §4.5, brief §5.8). Every animation on it is CSS:
 * staggered entrances on load, and hover reactions on the two actions and on
 * Webby himself. See the "Motion" block in `globals.css`.
 *
 * Deliberately narrow in scope: one headline, one line of explanation, the
 * brand line, two actions, the mascot. The field chooser is the *next* section,
 * not part of this one — repeating the three fields here as well as below just
 * made the page look like it had been pasted twice.
 *
 * Colour rules that shape this file (AGENTS.md §4.8): field colours are fills,
 * borders and chips only, never text on a light background. Every string here is
 * Deep Charcoal on a light surface.
 */

/**
 * Both actions wear the same skin. `.btn-playful` (globals.css) owns the shadow
 * and the lift-and-slam interaction, including the `@media (hover: hover)` guard
 * that stops a touch device latching a hover state after a tap.
 */
const CTA_BASE =
  "btn-playful inline-flex min-h-touch items-center justify-center rounded-2xl " +
  "border-[3px] border-deep-charcoal px-6 py-3 text-lg font-bold text-deep-charcoal";

/**
 * Dot colours for the brand line, in order: explore, experiment, discover.
 * The three action roles, deliberately not the three field colours — those
 * identify subjects, and this line does not.
 *
 * Written out rather than interpolated: Tailwind scans for complete class names.
 */
const TAGLINE_DOTS = [
  "bg-science-green",
  "bg-energy-orange",
  "bg-discovery-yellow",
] as const;

export function HeroSection() {
  return (
    <section
      aria-labelledby="hero-title"
      className="relative isolate overflow-hidden bg-lab-mist"
    >
      {/* Background texture. Decoration only — CSS gradients and a CSS dot grid,
       * so it costs zero image requests (AGENTS.md §4.4, brief §5.8).
       *
       * The bottom fade is load-bearing: without it the dot grid and the blobs
       * stop dead on a hard horizontal line where the section ends. The fade
       * dissolves them into the page background instead. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="hero-grid absolute inset-0 opacity-40" />
        <div className="blob-in absolute -left-28 -top-32 h-72 w-72 rounded-full bg-fun-purple/35 blur-3xl" />
        <div className="blob-in absolute -right-24 top-0 h-80 w-80 rounded-full bg-curious-blue/30 blur-3xl [--reveal-delay:80ms]" />
        <div className="blob-in absolute -bottom-20 left-1/4 h-72 w-72 rounded-full bg-discovery-yellow/45 blur-3xl [--reveal-delay:160ms]" />
        <div className="absolute inset-x-0 bottom-0 h-52 bg-linear-to-b from-transparent via-cloud-white/70 to-cloud-white" />
        {/* The header is Cloud White and this band is Lab Mist, so the top edge
         * needs the same treatment as the bottom one — otherwise the colour
         * change is a hard line across the page. Last in the stack so it also
         * softens the dot grid and the blobs. */}
        <div className="absolute inset-x-0 top-0 h-16 bg-linear-to-b from-cloud-white to-transparent" />
      </div>

      <div className="mx-auto grid w-full max-w-6xl items-center gap-8 px-4 pb-14 pt-10 sm:px-6 lg:grid-cols-12 lg:gap-14 lg:pb-20 lg:pt-16">
        {/* ---- Copy ----
         * Each block enters on its own short delay, top to bottom. `reveal` uses
         * `backwards` fill, not `both` — see the note in globals.css for why that
         * matters to the hover states on the same subtree. */}
        <div className="lg:col-span-7">
          {/* The headline is typography, not a container. It used to sit in a
           * 621x170 yellow slab, which made the loudest object on the page a
           * box rather than the words. Now the accent word carries the yellow
           * and the headline itself stays light.
           *
           * `box-decoration-clone` keeps the highlight's radius and padding on
           * both fragments when the line wraps. */}
          <h1
            id="hero-title"
            className="reveal font-display text-4xl font-extrabold leading-[1.14] tracking-tight text-balance text-deep-charcoal sm:text-5xl lg:text-6xl [--reveal-delay:40ms]"
          >
            {id.home.hero.title}{" "}
            <span className="box-decoration-clone rounded-2xl bg-discovery-yellow px-3 py-0.5">
              {id.home.hero.titleAccent}
            </span>
          </h1>

          <p className="reveal mt-5 max-w-lg text-lg text-pretty text-deep-charcoal/85 sm:text-xl [--reveal-delay:100ms]">
            {id.home.hero.subtitle}
          </p>

          {/* The brand line, promoted from 16px muted caption to a real element.
           * A Cloud White pill rather than a coloured one: charcoal on green or
           * orange is 4.3-4.7:1, which fails the 4.5:1 body-text floor on
           * orange, so the colour moves into the dots and the text stays on
           * white (AGENTS.md §4.9). */}
          <ul className="reveal mt-6 flex w-fit max-w-full flex-wrap items-center gap-x-4 gap-y-2 rounded-full border-[3px] border-deep-charcoal bg-cloud-white px-4 py-2 text-sm font-bold text-deep-charcoal [--reveal-delay:150ms]">
            {id.brand.tagline.map((word, index) => (
              <li key={word} className="flex items-center gap-1.5">
                <span
                  aria-hidden="true"
                  className={`h-2.5 w-2.5 shrink-0 rounded-full ${TAGLINE_DOTS[index]}`}
                />
                {word}
              </li>
            ))}
          </ul>

          <div className="reveal mt-7 flex flex-col gap-3 sm:flex-row sm:items-center [--reveal-delay:200ms]">
            <a href="#bidang" className={`${CTA_BASE} bg-science-green`}>
              {id.home.hero.ctaPrimary}
            </a>
            <a href="#webby" className={`${CTA_BASE} bg-cloud-white`}>
              {id.home.hero.ctaSecondary}
            </a>
          </div>
        </div>

        {/* ---- Webby ----
         * Two layouts out of one DOM order. On a phone the card is a horizontal
         * row — mascot left, speech right — which keeps it about 180px tall
         * instead of 400px, so the mascot shares the first screen with the
         * buttons instead of sitting 9px past the fold. `flex-col-reverse` on
         * desktop flips it to bubble-over-mascot without reordering the markup.
         *
         * `.webby-stage` is the hover scope. The mascot publishes part names
         * (`.webby-sparkle`, `.webby-tube`) and the stage decides what they do —
         * so the mascot component stays reusable and knows nothing about hover. */}
        <div className="lg:col-span-5">
          <div
            id="webby"
            className="relative mx-auto w-full max-w-sm scroll-mt-24 lg:rotate-[-1.5deg]"
          >
            <div className="webby-stage reveal-pop relative overflow-hidden rounded-[2rem] border-[3px] border-deep-charcoal bg-cloud-white p-4 shadow-playful transition-[transform,box-shadow] duration-[420ms] [--reveal-delay:140ms] hover:-translate-x-1 hover:-translate-y-1 hover:shadow-playful-lg sm:p-6">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
              >
                <div className="hero-grid absolute inset-0 opacity-35" />
                <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-fun-purple/30 blur-2xl" />
                <div className="absolute -bottom-14 -left-10 h-44 w-44 rounded-full bg-science-green/25 blur-2xl" />
              </div>

              <div className="relative flex flex-row items-center gap-4 lg:flex-col-reverse lg:items-start">
                <WebbyMascot
                  alt={id.home.hero.mascotAlt}
                  className="h-auto w-32 shrink-0 animate-float sm:w-40 lg:mx-auto lg:w-full lg:max-w-[16rem]"
                />

                <p className="relative w-fit max-w-full min-w-0 rounded-2xl border-[3px] border-deep-charcoal bg-discovery-yellow px-4 py-2 text-base font-bold text-deep-charcoal shadow-playful-sm">
                  {id.home.hero.mascotGreeting}
                  <span
                    aria-hidden="true"
                    className="absolute -bottom-[9px] left-6 h-3.5 w-3.5 rotate-45 border-b-[3px] border-r-[3px] border-deep-charcoal bg-discovery-yellow"
                  />
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
