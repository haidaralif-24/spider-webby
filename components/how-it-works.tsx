import id from "@/messages/id.json";

/**
 * "Cara pakai" — three steps.
 *
 * This is the page's second beat. Before it, the home page was the hero and
 * three cards and then nothing, on a document that measured 904px against a
 * 900px viewport. It also does real work: a first-time visitor (or a parent)
 * gets the whole product explained in three short lines, and step three is the
 * only place the site tells a child to get an adult before doing an experiment.
 *
 * Deliberately not "Eksperimen pilihan" or "Tantangan hari ini" — those are in
 * the brief's home IA, but they need authored experiment content to exist, and
 * inventing placeholder experiments would put fake material in front of the
 * non-technical author who has to replace it.
 *
 * The `<ol>` is the real structure; the numbers are the list markers rendered
 * as stickers. Screen readers get a proper ordered list either way.
 */

/**
 * Stagger for the entrance. Written out rather than interpolated — Tailwind
 * scans for complete class names and would purge `[--reveal-delay:${n}ms]`.
 */
const STEP_DELAYS = [
  "[--reveal-delay:180ms]",
  "[--reveal-delay:250ms]",
  "[--reveal-delay:320ms]",
] as const;

export function HowItWorks() {
  return (
    <section
      id="cara-pakai"
      aria-labelledby="cara-pakai-heading"
      className="defer-render scroll-mt-24 bg-linear-to-b from-cloud-white via-lab-mist to-cloud-white py-20 sm:py-24"
    >
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">
        <h2
          id="cara-pakai-heading"
          className="reveal heading-box rounded-2xl border-[3px] border-deep-charcoal bg-discovery-yellow px-4 py-2 font-display text-2xl font-bold text-deep-charcoal [--reveal-delay:60ms] sm:text-3xl"
        >
          {id.howItWorks.heading}
        </h2>
        <p className="copy-lift reveal mt-4 max-w-md text-base text-deep-charcoal/75 [--reveal-delay:120ms]">
          {id.howItWorks.subtitle}
        </p>

        <ol className="step-list mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {id.howItWorks.steps.map((step, index) => (
            <li
              key={step.title}
              className={`step-card bounce-in ${STEP_DELAYS[index]} rounded-3xl border-[3px] border-deep-charcoal bg-cloud-white p-5`}
            >
              <span
                aria-hidden="true"
                className="step-badge flex h-11 w-11 items-center justify-center rounded-full border-[3px] border-deep-charcoal bg-discovery-yellow font-display text-lg font-extrabold text-deep-charcoal"
              >
                {index + 1}
              </span>
              <h3 className="mt-3 font-display text-lg font-extrabold text-deep-charcoal">
                {step.title}
              </h3>
              <p className="mt-1 text-base text-deep-charcoal/80">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
