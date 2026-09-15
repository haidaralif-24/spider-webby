import Link from "next/link";
import id from "@/messages/id.json";
import type { Experiment } from "@/lib/content";

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

const DIFFICULTY_LABEL: Record<Experiment["difficulty"], string> = {
  mudah: id.experiment.difficultyLevels.mudah,
  sedang: id.experiment.difficultyLevels.sedang,
  sulit: id.experiment.difficultyLevels.sulit,
};

export function ExperimentCard({
  experiment,
  fill,
  delay,
}: {
  experiment: Experiment;
  /** The field's fill class, written out at the call site. */
  fill: string;
  /** Stagger for the entrance. */
  delay: string;
}) {
  return (
    <li className={`bounce-in ${delay}`}>
      {/* `/eksperimen/[slug]` is the next P0 page and does not exist yet, so
       * this 404s until it lands. The href is already correct. */}
      <Link
        href={`/eksperimen/${experiment.slug}`}
        className={`btn-playful flex h-full flex-col rounded-3xl border-[3px] border-deep-charcoal ${fill} p-5`}
      >
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
      </Link>
    </li>
  );
}
