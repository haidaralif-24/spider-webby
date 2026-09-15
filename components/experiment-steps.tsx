import { MediaImage } from "@/components/media-image";
import type { ExperimentStep } from "@/lib/content";

/**
 * The numbered steps — the actual content of the page.
 *
 * AGENTS.md §4.5 is blunt about the hierarchy: the flowchart is supplementary,
 * "the numbered `<ol>` of steps is the real content and must always be present
 * and visible". So this renders every step in full, with its image, and the
 * diagram above it is a glanceable summary of the same thing. Two reading
 * speeds, one source.
 *
 * The `<ol>` is a real ordered list, not divs with numbers drawn on them, so a
 * screen reader announces "3 of 5" for free.
 *
 * `whitespace-pre-line` preserves the author's line breaks. The admin has no
 * markdown box (AGENTS.md §4.6), so a newline is the only formatting they have —
 * honouring it is the least this can do.
 */
export function ExperimentSteps({
  steps,
  tone,
}: {
  steps: readonly ExperimentStep[];
  /** Node fill, as a `fill-*` utility, matching the flowchart above. */
  tone: string;
}) {
  return (
    <ol className="flex flex-col gap-5">
      {steps.map((step, index) => (
        <li
          key={step.id}
          className="flex gap-4 rounded-3xl border-[3px] border-deep-charcoal bg-cloud-white p-5"
        >
          <span
            aria-hidden="true"
            className={`${tone} flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-[3px] border-deep-charcoal font-display text-lg font-extrabold text-deep-charcoal`}
          >
            {index + 1}
          </span>

          <div className="flex min-w-0 flex-col gap-3">
            <h3 className="font-display text-xl font-extrabold text-pretty text-deep-charcoal">
              {step.title}
            </h3>

            {/* 4:3, the step crop preset (AGENTS.md §4.6). `sizes` is honest about
             * how wide it actually renders so the browser picks a real width. */}
            {step.media ? (
              <MediaImage
                publicId={step.media.public_id}
                alt={step.media.alt}
                width={step.media.width}
                height={step.media.height}
                slot="step"
                sizes="(min-width: 1024px) 560px, 90vw"
                className="w-full rounded-2xl border-[3px] border-deep-charcoal"
              />
            ) : null}

            <p className="whitespace-pre-line text-base text-pretty text-deep-charcoal/85">
              {step.body}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
