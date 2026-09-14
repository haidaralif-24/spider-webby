import id from "@/messages/id.json";
import { FieldIcon, type FieldSlug } from "@/components/field-icon";

/**
 * The three-field chooser.
 *
 * Each card is a native `<details>`: tap to open, tap to close, keyboard and
 * screen-reader support for free, and zero client JS — which a hover-only panel
 * or a checkbox hack could not deliver on a phone (AGENTS.md §4.5, §4.9). Hover
 * opens it too, as a progressive enhancement; see `.field-card` in globals.css.
 *
 * This is the ONLY place the three fields are listed. They used to appear here
 * and again as chips in the hero, which made the page read as though it had
 * been pasted twice.
 */

const FIELDS: readonly {
  slug: FieldSlug;
  label: string;
  intro: string;
  fill: string;
  /**
   * Resting tilt of the fan, read by `.field-card` in globals.css. Flat on a
   * phone: stacked cards have no row to fan, and a 3deg tilt there just made
   * the left edges ragged. Kept small on desktop too — a large tilt inflates
   * the cards' bounding boxes, so the row measured 82px/66px/82px tall with
   * the outer tops 8px higher than the middle, which reads as misalignment
   * rather than as play.
   *
   * Written out, not interpolated — Tailwind scans for complete class names.
   */
  tilt: string;
  /** Stagger for the bounce entrance. Same rule. */
  delay: string;
}[] = [
  {
    slug: "fisika",
    label: id.field.fisika,
    intro: id.fieldIntro.fisika,
    fill: "bg-field-fisika",
    tilt: "[--tilt:0deg] sm:[--tilt:-1.5deg]",
    delay: "[--reveal-delay:200ms]",
  },
  {
    slug: "kimia",
    label: id.field.kimia,
    intro: id.fieldIntro.kimia,
    fill: "bg-field-kimia",
    tilt: "[--tilt:0deg] sm:[--tilt:0deg]",
    delay: "[--reveal-delay:270ms]",
  },
  {
    slug: "biologi",
    label: id.field.biologi,
    intro: id.fieldIntro.biologi,
    fill: "bg-field-biologi",
    tilt: "[--tilt:0deg] sm:[--tilt:1.5deg]",
    delay: "[--reveal-delay:340ms]",
  },
];

export function FieldChooser() {
  return (
    <section
      id="bidang"
      aria-labelledby="bidang-heading"
      className="mx-auto w-full max-w-5xl scroll-mt-24 px-4 pb-16 pt-14 sm:px-6"
    >
      <h2
        id="bidang-heading"
        className="reveal heading-box rounded-2xl border-[3px] border-deep-charcoal bg-discovery-yellow px-4 py-2 font-display text-2xl font-bold text-deep-charcoal [--reveal-delay:60ms] sm:text-3xl"
      >
        {id.home.fieldsHeading}
      </h2>
      <p className="reveal mt-4 max-w-md text-base text-deep-charcoal/75 [--reveal-delay:120ms]">
        {id.home.fieldsSubtitle}
      </p>

      <ul className="field-list mt-7 grid grid-cols-1 items-start gap-4 sm:grid-cols-3">
        {FIELDS.map((field) => (
          <li key={field.slug} className={`bounce-in ${field.delay}`}>
            <details
              className={`field-card ${field.fill} ${field.tilt} group rounded-3xl border-[3px] border-deep-charcoal`}
            >
              {/* `list-none` plus the webkit pseudo removes the native
               * disclosure triangle — we draw our own so it can rotate, sit in
               * a badge, and match the brand. */}
              <summary className="flex min-h-touch cursor-pointer list-none items-center gap-3 px-5 py-4 [&::-webkit-details-marker]:hidden">
                {/* Icon silhouette alongside the colour, never instead of it —
                 * blue and purple are the pair colour vision deficiency
                 * confuses most (AGENTS.md §4.9). */}
                <FieldIcon
                  field={field.slug}
                  className="h-8 w-8 shrink-0 text-deep-charcoal"
                />
                <span className="flex-1 font-display text-2xl font-extrabold text-deep-charcoal">
                  {field.label}
                </span>
                {/* The chevron sits in a bordered circle so it reads as a
                 * control rather than as decoration. A bare chevron was the
                 * only signal that the card opened at all. */}
                <span
                  aria-hidden="true"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-[3px] border-deep-charcoal bg-cloud-white/70 transition-transform duration-200 group-open:rotate-180"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4 fill-none stroke-deep-charcoal"
                    strokeWidth={3}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </span>
              </summary>

              <div className="field-panel px-3 pb-3">
                {/* The explanation sits on Cloud White rather than directly on
                 * the field colour. Charcoal on Curious Blue and Science Green
                 * clears 4.5:1, but on Fun Purple it lands at 4.06:1 — under
                 * the body-text floor, so it gets its own surface (§4.9). */}
                <div className="rounded-2xl border-[3px] border-deep-charcoal bg-cloud-white p-4">
                  <p className="text-base text-deep-charcoal">{field.intro}</p>
                  {/* `/fisika`, `/kimia`, `/biologi` are P0 routing work that
                   * does not exist yet, so this 404s until those pages land.
                   * The href is already correct, so shipping the routes is the
                   * only change needed. */}
                  <a
                    href={`/${field.slug}`}
                    className="btn-playful mt-4 inline-flex min-h-touch items-center justify-center rounded-2xl border-[3px] border-deep-charcoal bg-science-green px-5 py-2 text-base font-bold text-deep-charcoal"
                  >
                    {id.home.fieldsCta}
                  </a>
                </div>
              </div>
            </details>
          </li>
        ))}
      </ul>
    </section>
  );
}
