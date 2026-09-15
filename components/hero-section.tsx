import id from "@/messages/id.json";
import { WebbyMascot } from "@/components/webby-mascot";

/**
 * The home hero.
 *
 * Server component, zero client JS — a public content page is statically
 * rendered (AGENTS.md §4.5, brief §5.8). Every animation on it is CSS:
 * staggered entrances on load, a slow drift on the background glows, and a
 * reaction from every element under the cursor. See the "Hero copy reactions"
 * block in `globals.css`.
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
       * The fades at both ends are load-bearing: without them the dot grid and
       * the glows stop dead on a hard line where the section meets the header
       * and the field chooser. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className="hero-grid absolute inset-0 opacity-40" />

        {/* Glows, not blurred circles — `.hero-glow` is a radial-gradient, which
         * is one paint instead of a 64px filter pass plus its own layer. The
         * boxes are ~11% larger than the old `blur-3xl` circles and recentred to
         * match, because a gradient cannot paint outside its own box.
         *
         * `.hero-glow` also carries the entrance and the slow drift, so these
         * elements do NOT get `.blob-in` — two rules setting `animation` on the
         * same element would just overwrite each other. */}
        <div className="hero-glow absolute -left-32 -top-36 h-80 w-80 [--glow-color:var(--color-fun-purple)]" />
        <div className="hero-glow absolute -right-32 -top-8 h-96 w-96 [--glow-color:var(--color-curious-blue)] [--glow-strength:30%] [--reveal-delay:80ms]" />
        <div className="hero-glow absolute -bottom-24 left-1/4 h-80 w-80 [--glow-color:var(--color-discovery-yellow)] [--glow-strength:45%] [--reveal-delay:160ms]" />

        <div className="absolute inset-x-0 bottom-0 h-52 bg-linear-to-b from-transparent via-cloud-white/70 to-cloud-white" />
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
           * both fragments when the line wraps. It also means the span has to
           * stay inline, which is why its hover reaction is a shadow rather than
           * a scale — transforms do not apply to inline boxes. */}
          <h1
            id="hero-title"
            className="hero-title reveal font-display text-4xl font-extrabold leading-[1.14] tracking-tight text-balance text-deep-charcoal sm:text-5xl lg:text-6xl [--reveal-delay:40ms]"
          >
            {id.home.hero.title}{" "}
            <span className="hero-title-accent box-decoration-clone rounded-2xl bg-discovery-yellow px-3 py-0.5">
              {id.home.hero.titleAccent}
            </span>
          </h1>

          <p className="copy-lift reveal mt-5 max-w-lg text-lg text-pretty text-deep-charcoal/85 sm:text-xl [--reveal-delay:100ms]">
            {id.home.hero.subtitle}
          </p>

          {/* The brand line, promoted from 16px muted caption to a real element.
           * A Cloud White pill rather than a coloured one: charcoal on green or
           * orange is 4.3-4.7:1, which fails the 4.5:1 body-text floor on
           * orange, so the colour moves into the dots and the text stays on
           * white (AGENTS.md §4.9). */}
          <ul className="tagline-pill reveal mt-6 flex w-fit max-w-full flex-wrap items-center gap-x-4 gap-y-2 rounded-full border-[3px] border-deep-charcoal bg-cloud-white px-4 py-2 text-sm font-bold text-deep-charcoal [--reveal-delay:150ms]">
            {id.brand.tagline.map((word, index) => (
              <li key={word} className="tagline-item flex items-center gap-1.5">
                <span
                  aria-hidden="true"
                  className={`tagline-dot h-2.5 w-2.5 shrink-0 rounded-full ${TAGLINE_DOTS[index]}`}
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
                <div className="hero-glow absolute -right-18 -top-18 h-56 w-56 [--glow-color:var(--color-fun-purple)] [--glow-strength:30%]" />
                <div className="hero-glow absolute -bottom-20 -left-6 h-56 w-56 [--glow-color:var(--color-science-green)] [--glow-strength:25%]" />
              </div>

              <div className="relative flex flex-row items-center gap-4 lg:flex-col-reverse lg:items-start">
                <WebbyMascot
                  alt={id.home.hero.mascotAlt}
                  /* `will-change-transform` promotes the SVG to its own layer.
                   * `animate-float` is an infinite transform on a ~40-node
                   * inline SVG; without the hint the browser can re-rasterize
                   * the whole thing every frame instead of just moving a
                   * texture. One element, so the layer memory is worth it. */
                  className="will-change-transform h-auto w-32 shrink-0 animate-float sm:w-40 lg:mx-auto lg:w-full lg:max-w-[16rem]"
                />

                <p className="webby-bubble relative w-fit max-w-full min-w-0 rounded-2xl border-[3px] border-deep-charcoal bg-discovery-yellow px-4 py-2 text-base font-bold text-deep-charcoal shadow-playful-sm">
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
