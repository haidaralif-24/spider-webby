import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExperimentFlow } from "@/components/experiment-flow";
import { ExperimentSteps } from "@/components/experiment-steps";
import { FieldIcon } from "@/components/field-icon";
import { MediaImage } from "@/components/media-image";
import { getExperimentBySlug, getField, getPublishedSlugs } from "@/lib/content";
import { FIELD_THEME } from "@/lib/field-theme";
import id from "@/messages/id.json";

/**
 * An experiment.
 *
 * The shape is fixed by the brief §1: Title → Hook → Materials → Steps → Concepts,
 * and the steps are rendered twice on purpose — once as a derived flowchart, once
 * as the numbered list. AGENTS.md §4.5 is explicit that the diagram is
 * supplementary and the `<ol>` is the real content, so the list is never hidden
 * and the diagram is never the only representation of the procedure.
 *
 * Layout follows brief §5.2: single column on mobile in that order; on desktop
 * two columns with the concepts sticky beside the steps, because theory is what
 * you glance back at while reading a step.
 *
 * Statically rendered with zero client JS. Both the flowchart and the step list
 * are server components, and `<ExperimentFlow>` is inline SVG with no library
 * behind it.
 */

type PageProps = { params: Promise<{ slug: string }> };

/** Five minutes. Publishing revalidates immediately; this covers direct edits. */
export const revalidate = 300;

/**
 * Pre-build the published slugs. Fails soft to an empty list, and the route
 * allows on-demand rendering, so a database that is unreachable at build time
 * means "nothing pre-built" rather than a failed deploy.
 */
export async function generateStaticParams() {
  const slugs = await getPublishedSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const experiment = await getExperimentBySlug(slug);
  if (!experiment) return {};

  return {
    title: experiment.title,
    description: experiment.hook,
  };
}

export default async function ExperimentPage({ params }: PageProps) {
  const { slug } = await params;
  const experiment = await getExperimentBySlug(slug);

  /* One answer for "no such slug" and "exists but is a draft", because RLS
   * makes them the same query result and distinguishing them would tell an
   * anonymous visitor which slugs exist. */
  if (!experiment) notFound();

  const field = getField(experiment.field_slug);
  const theme = FIELD_THEME[experiment.field_slug];

  return (
    <article className="mx-auto w-full max-w-5xl px-4 pb-20 pt-8 sm:px-6">
      <Link
        href={`/${experiment.field_slug}`}
        className="btn-playful inline-flex min-h-touch items-center gap-2 rounded-full border-[3px] border-deep-charcoal bg-cloud-white px-4 py-2 text-sm font-bold text-deep-charcoal"
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
        {id.experiment.backToField} {field?.name ?? experiment.field_slug}
      </Link>

      <header className="mt-6">
        <ul className="flex flex-wrap items-center gap-2">
          <li className="inline-flex items-center gap-2 rounded-full border-[3px] border-deep-charcoal bg-cloud-white px-3 py-1 text-sm font-bold text-deep-charcoal">
            <FieldIcon
              field={experiment.field_slug}
              className="h-4 w-4 shrink-0"
            />
            {field?.name ?? experiment.field_slug}
          </li>
          <li className="rounded-full border-[3px] border-deep-charcoal bg-cloud-white px-3 py-1 text-sm font-bold text-deep-charcoal">
            {id.experiment.difficultyLevels[experiment.difficulty]}
          </li>
          <li className="rounded-full border-[3px] border-deep-charcoal bg-cloud-white px-3 py-1 text-sm font-bold text-deep-charcoal">
            {id.fieldPage.timePrefix} {experiment.est_minutes}{" "}
            {id.experiment.minutes}
          </li>
        </ul>

        {/* Charcoal on the field colour, never the field colour as text — all
         * three sit below 3.2:1 against white (AGENTS.md §4.8). */}
        <h1
          className={`${theme.fill} heading-box mt-5 max-w-full rounded-3xl border-[3px] border-deep-charcoal px-5 py-3 font-display text-3xl font-extrabold text-deep-charcoal sm:text-4xl`}
        >
          {experiment.title}
        </h1>

        <p className="copy-lift mt-4 max-w-2xl text-lg text-pretty text-deep-charcoal/85">
          {experiment.hook}
        </p>
      </header>

      {/* 16:9, the hero crop preset. `priority` because it is above the fold. */}
      {experiment.hero ? (
        <MediaImage
          publicId={experiment.hero.public_id}
          alt={experiment.hero.alt}
          width={experiment.hero.width}
          height={experiment.hero.height}
          slot="hero"
          sizes="(min-width: 1024px) 960px, 100vw"
          priority
          className="mt-8 w-full rounded-3xl border-[3px] border-deep-charcoal"
        />
      ) : null}

      {experiment.materials.length > 0 ? (
        <section aria-labelledby="materials-heading" className="mt-10">
          <h2
            id="materials-heading"
            className="heading-box rounded-2xl border-[3px] border-deep-charcoal bg-discovery-yellow px-4 py-2 font-display text-2xl font-bold text-deep-charcoal"
          >
            {id.experiment.materials}
          </h2>

          <ul className="mt-5 flex flex-wrap gap-3">
            {experiment.materials.map((material) => (
              <li
                key={material.id}
                className="rounded-2xl border-[3px] border-deep-charcoal bg-cloud-white px-4 py-2 text-base font-semibold text-deep-charcoal"
              >
                {material.label}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="mt-10 grid gap-10 lg:grid-cols-12">
        <section aria-labelledby="steps-heading" className="lg:col-span-8">
          <h2
            id="steps-heading"
            className="heading-box rounded-2xl border-[3px] border-deep-charcoal bg-discovery-yellow px-4 py-2 font-display text-2xl font-bold text-deep-charcoal"
          >
            {id.experiment.steps}
          </h2>

          {experiment.steps.length > 0 ? (
            <>
              {/* The summary. `role="img"` with a title and description inside
               * the SVG, so a screen reader gets the list below rather than a
                   second reading of the same procedure. */}
              <div className="mt-5 rounded-3xl border-[3px] border-dashed border-deep-charcoal/30 p-4">
                <p className="mb-3 text-sm font-bold text-deep-charcoal/70">
                  {id.experiment.flowHeading}
                </p>
                <ExperimentFlow
                  steps={experiment.steps}
                  tone={theme.tone}
                />
              </div>

              <div className="mt-6">
                <ExperimentSteps steps={experiment.steps} tone={theme.tone} />
              </div>
            </>
          ) : (
            /* The imported placeholder experiments have no steps yet. Saying so
             * is better than rendering an empty section, and it is a content
             * gap rather than a bug. */
            <p className="mt-5 text-base text-deep-charcoal/70">
              {id.experiment.noSteps}
            </p>
          )}
        </section>

        {experiment.concepts.length > 0 ? (
          <aside aria-labelledby="concepts-heading" className="lg:col-span-4">
            <div className="lg:sticky lg:top-24">
              <h2
                id="concepts-heading"
                className="heading-box rounded-2xl border-[3px] border-deep-charcoal bg-discovery-yellow px-4 py-2 font-display text-2xl font-bold text-deep-charcoal"
              >
                {id.experiment.concepts}
              </h2>

              <ul className="mt-5 flex flex-col gap-4">
                {experiment.concepts.map((concept) => (
                  <li
                    key={concept.id}
                    className="rounded-2xl border-[3px] border-deep-charcoal bg-cloud-white p-4"
                  >
                    <h3 className="font-display text-lg font-extrabold text-deep-charcoal">
                      {concept.title}
                    </h3>
                    <p className="mt-2 whitespace-pre-line text-base text-pretty text-deep-charcoal/85">
                      {concept.body}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        ) : null}
      </div>
    </article>
  );
}
