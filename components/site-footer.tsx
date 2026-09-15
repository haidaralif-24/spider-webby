import id from "@/messages/id.json";
import { WebbyMark } from "@/components/webby-mark";

/**
 * Site footer.
 *
 * Just the wordmark and one line of what the site is. It used to carry a
 * "Tanpa iklan. Tanpa data pribadi. Tanpa pelacakan." sticker as well; that was
 * removed on the user's instruction, and its string came out of the catalog with
 * it — an unused key is noise the next reader has to check.
 *
 * No link columns: every destination they would point at (Webby, lencana,
 * profil, tantangan) is P0 routing work that does not exist yet.
 */
export function SiteFooter() {
  return (
    <footer className="defer-render bg-linear-to-b from-cloud-white to-lab-mist [--intrinsic-size:140px]">
      <div className="mx-auto flex w-full max-w-5xl items-center gap-3 px-4 py-10 sm:px-6">
        <WebbyMark className="h-10 w-10 shrink-0" />
        <div>
          <p className="font-display text-lg font-extrabold text-deep-charcoal">
            {id.brand.name}
          </p>
          <p className="text-sm text-deep-charcoal/70">{id.footer.note}</p>
        </div>
      </div>
    </footer>
  );
}
