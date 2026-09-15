import id from "@/messages/id.json";
import { ExperimentCard } from "@/components/experiment-card";
import type { ExperimentCardData, FieldSlug } from "@/lib/content";
import { FIELD_THEME } from "@/lib/field-theme";

/**
 * A field's experiments.
 *
 * This is the `#eksperimen` anchor the field hero's CTA and the Experiment tab
 * both point at, so the section carries the id and the scroll margin that keeps
 * its heading clear of the sticky header.
 */

/**
 * Stagger for the entrance. Written out rather than interpolated — Tailwind
 * scans for complete class names.
 */
const CARD_DELAYS = [
  "[--reveal-delay:160ms]",
  "[--reveal-delay:240ms]",
  "[--reveal-delay:320ms]",
] as const;

export function ExperimentGrid({
  field,
  experiments,
}: {
  field: FieldSlug;
  experiments: readonly ExperimentCardData[];
}) {
  const theme = FIELD_THEME[field];

  return (
    <section
      id="eksperimen"
      aria-labelledby="eksperimen-heading"
      className="mx-auto w-full max-w-5xl scroll-mt-24 px-4 pb-20 pt-8 sm:px-6"
    >
      <h2
        id="eksperimen-heading"
        className="reveal heading-box rounded-2xl border-[3px] border-deep-charcoal bg-discovery-yellow px-4 py-2 font-display text-2xl font-bold text-deep-charcoal [--reveal-delay:80ms] sm:text-3xl"
      >
        {id.fieldPage.experimentsHeading}
      </h2>
      <p className="copy-lift reveal mt-4 max-w-md text-base text-deep-charcoal/75 [--reveal-delay:140ms]">
        {id.fieldPage.experimentsSubtitle}
      </p>

      <ul className="mt-7 grid grid-cols-1 items-start gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {experiments.map((experiment, index) => (
          <ExperimentCard
            key={experiment.slug}
            experiment={experiment}
            fill={theme.fill}
            delay={CARD_DELAYS[index % CARD_DELAYS.length]}
          />
        ))}
      </ul>
    </section>
  );
}
