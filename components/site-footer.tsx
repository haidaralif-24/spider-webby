import id from "@/messages/id.json";
import { WebbyMark } from "@/components/webby-mark";

/**
 * Site footer.
 *
 * Its whole job is the trust line. "Tanpa iklan. Tanpa data pribadi. Tanpa
 * pelacakan." is the strongest thing this product can say to a parent, and
 * before this it was said nowhere on the page. It gets a sticker of its own so
 * it reads as a promise rather than as small print.
 *
 * No link columns: every destination they would point at (Webby, lencana,
 * profil, tantangan) is P0 routing work that does not exist yet.
 */
export function SiteFooter() {
  return (
    <footer className="bg-linear-to-b from-cloud-white to-lab-mist">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-12 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-3">
          <WebbyMark className="h-10 w-10 shrink-0" />
          <div>
            <p className="font-display text-lg font-extrabold text-deep-charcoal">
              {id.brand.name}
            </p>
            <p className="text-sm text-deep-charcoal/70">{id.footer.note}</p>
          </div>
        </div>

        <p className="inline-flex w-fit items-center rounded-full border-[3px] border-deep-charcoal bg-cloud-white px-4 py-2 text-sm font-bold text-deep-charcoal shadow-playful-sm">
          {id.footer.trust}
        </p>
      </div>
    </footer>
  );
}
