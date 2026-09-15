import Link from "next/link";
import { FieldIcon } from "@/components/field-icon";
import { MediaImage } from "@/components/media-image";
import type { ExperimentCardData } from "@/lib/content";
import id from "@/messages/id.json";

/**
 * One experiment in a field's grid.
 *
 * The whole card is the link, so the tap target is the whole card rather than a
 * "read more" inside it — which is what a 6-year-old will actually hit
 * (AGENTS.md §4.9). `.btn-playful` supplies the lift and the hard shadow, so a
 * card behaves like every other sticker on the site.
 *
 * Every string on the card is Deep Charcoal on a light surface. The field colour
 * is the card fill only.
 */

const DIFFICULTY_LABEL: Record<ExperimentCardData["difficulty"], string> = {
  mudah: id.experiment.difficultyLevels.mudah,
  sedang: id.experiment.difficultyLevels.sedang,
  sulit: id.experiment.difficultyLevels.sulit,
};

export function ExperimentCard({
  experiment,
  fill,
  delay,
}: {
  experiment: ExperimentCardData;
  /** The field's fill class, written out at the call site. */
  fill: string;
  /** Stagger for the entrance. */
  delay: string;
}) {
  return (
    <li className={`bounce-in ${delay}`}>
      <Link
        href={`/eksperimen/${experiment.slug}`}
        /* `overflow-hidden` so the cover image is clipped by the card's rounded
         * border rather than poking out of it. */
        className={`btn-playful flex h-full flex-col overflow-hidden rounded-3xl border-[3px] border-deep-charcoal ${fill}`}
      >
        {/* 16:9 — the hero crop preset, because the cover is the image the author
         * framed as the cover. The 1:1 thumbnail preset stays available for a
         * genuinely square slot. */}
        <div className="relative aspect-video w-full shrink-0 border-b-[3px] border-deep-charcoal">
          {experiment.hero ? (
            <MediaImage
              publicId={experiment.hero.public_id}
              alt={experiment.hero.alt}
              width={experiment.hero.width}
              height={experiment.hero.height}
              slot="hero"
              /* Three columns at desktop, two at tablet, one on a phone. */
              sizes="(min-width: 1024px) 320px, (min-width: 640px) 45vw, 90vw"
              className="h-full w-full object-cover"
            />
          ) : (
            /* A card with no cover keeps the same height as its neighbours, so
             * the grid stays even. The field icon carries the silhouette, so
             * this is never colour alone (AGENTS.md §4.9). */
            <div className="flex h-full w-full items-center justify-center bg-cloud-white/35">
              <FieldIcon
                field={experiment.field_slug}
                className="h-12 w-12 text-deep-charcoal/35"
              />
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col p-5">
          <span className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border-[3px] border-deep-charcoal bg-cloud-white/85 px-3 py-1 text-xs font-bold text-deep-charcoal">
              {DIFFICULTY_LABEL[experiment.difficulty]}
            </span>
            <span className="rounded-full border-[3px] border-deep-charcoal bg-cloud-white/85 px-3 py-1 text-xs font-bold text-deep-charcoal">
              {id.fieldPage.timePrefix} {experiment.est_minutes}{" "}
              {id.experiment.minutes}
            </span>
          </span>

          <h3 className="mt-4 font-display text-xl font-extrabold text-deep-charcoal">
            {experiment.title}
          </h3>
          <p className="mt-2 text-base text-pretty text-deep-charcoal/85">
            {experiment.hook}
          </p>
        </div>
      </Link>
    </li>
  );
}
