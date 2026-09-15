import { AdminBar } from "@/components/admin/admin-bar";
import { UploadForm } from "@/components/admin/upload-form";
import { MediaImage } from "@/components/media-image";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import id from "@/messages/id.json";

/**
 * The media library and the upload form.
 *
 * `requireAdmin()` first, before any query — the middleware already redirected
 * anyone without the role, but a page that leans on the middleware is one
 * matcher edit away from being public (AGENTS.md §4.2).
 *
 * Reading `media` through the anon-key client is fine: the RLS policy is
 * admin-only for `for all`, so the database enforces the same rule this page
 * just checked. Two independent gates, which is the point.
 */

const MEDIA_COLUMNS =
  "id, public_id, alt, width, height, status, created_at" as const;

export default async function AdminMediaPage() {
  await requireAdmin();

  const supabase = await createClient();
  const { data: media, error } = await supabase
    .from("media")
    .select(MEDIA_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(60);

  return (
    <>
      <AdminBar />

      <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
        <h1 className="font-display text-3xl font-extrabold text-deep-charcoal">
          {id.admin.mediaHeading}
        </h1>
        <p className="mt-2 max-w-lg text-base text-deep-charcoal/75">
          {id.admin.mediaSubtitle}
        </p>

        <div className="mt-8">
          <UploadForm />
        </div>

        <div className="mt-10">
          {/* A missing `media` table means the migration has not been run. That
           * is a setup problem, not a bug the author can act on, so the page
           * says so plainly instead of throwing a 500 — and the real error goes
           * to the server log. */}
          {error ? (
            <p
              role="alert"
              className="rounded-2xl border-[3px] border-deep-charcoal bg-energy-orange px-4 py-3 text-base font-bold text-deep-charcoal"
            >
              {id.admin.mediaUnavailable}
            </p>
          ) : null}

          {!error && media && media.length > 0 ? (
            <ul className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
              {media.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-col gap-2 rounded-2xl border-[3px] border-deep-charcoal bg-cloud-white p-3"
                >
                  <MediaImage
                    publicId={item.public_id}
                    alt={item.alt}
                    width={item.width}
                    height={item.height}
                    slot="thumb"
                    sizes="(min-width: 1024px) 200px, (min-width: 640px) 30vw, 45vw"
                    className="h-[140px] w-full rounded-xl border-[3px] border-deep-charcoal object-cover"
                  />
                  <p className="text-sm text-pretty text-deep-charcoal">
                    {item.alt}
                  </p>
                  <p className="text-xs text-deep-charcoal/60">
                    {item.status}
                  </p>
                </li>
              ))}
            </ul>
          ) : null}

          {!error && media && media.length === 0 ? (
            <p className="text-base text-deep-charcoal/75">
              {id.admin.mediaEmpty}
            </p>
          ) : null}
        </div>
      </div>
    </>
  );
}
