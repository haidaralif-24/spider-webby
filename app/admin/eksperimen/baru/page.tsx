import { AdminBar } from "@/components/admin/admin-bar";
import {
  ExperimentForm,
  type ExperimentFormValues,
} from "@/components/admin/experiment-form";
import { listMediaItems, getLastAuthorName } from "@/app/admin/eksperimen/queries";
import { requireAdmin } from "@/lib/auth";
import id from "@/messages/id.json";

/**
 * A new experiment.
 *
 * There is no separate "create" step: the form saves as a draft on the first
 * submit (or the first autosave) and rewrites the address bar to the new id with
 * `history.replaceState`. That keeps the author in one screen, and it is what
 * makes the repeatable rows possible at all — a step cannot reference an
 * experiment that does not exist yet.
 */
export default async function NewExperimentPage() {
  const admin = await requireAdmin();
  const [mediaItems, lastAuthor] = await Promise.all([
    listMediaItems(),
    getLastAuthorName(),
  ]);

  const initial: ExperimentFormValues = {
    slug: "",
    field_slug: "fisika",
    title: "",
    /* Prefilled from the last experiment, because the shared admin account says
     * nothing about who is typing. */
    author_name: lastAuthor,
    hook: "",
    difficulty: "mudah",
    est_minutes: 15,
    hero_media_id: null,
    materials: [],
    /* One empty step to start: the schema requires at least one, and an empty
     * list with an "add" button below it reads as a dead end. */
    steps: [
      { key: "initial", title: "", flow_label: "", body: "", media_id: null },
    ],
    concepts: [],
  };

  return (
    <>
      <AdminBar />

      <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
        <h1 className="font-display text-3xl font-extrabold text-deep-charcoal">
          {id.admin.expNewHeading}
        </h1>

        <div className="mt-8">
          <ExperimentForm
            experimentId={null}
            initial={initial}
            mediaItems={mediaItems}
            accountEmail={admin.email}
          />
        </div>
      </div>
    </>
  );
}
