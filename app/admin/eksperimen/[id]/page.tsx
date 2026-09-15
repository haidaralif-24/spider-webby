import { notFound } from "next/navigation";
import { AdminBar } from "@/components/admin/admin-bar";
import { ExperimentForm } from "@/components/admin/experiment-form";
import {
  getExperimentFormValues,
  listMediaItems,
} from "@/app/admin/eksperimen/queries";
import { requireAdmin } from "@/lib/auth";
import id from "@/messages/id.json";

/**
 * Edit an experiment.
 *
 * `notFound()` rather than an error page for an id that does not exist or is not
 * visible to this session — RLS already hides anything the caller may not read,
 * so "not found" is the honest answer in both cases.
 */
export default async function EditExperimentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const admin = await requireAdmin();
  const { id: experimentId } = await params;

  const [values, mediaItems] = await Promise.all([
    getExperimentFormValues(experimentId),
    listMediaItems(),
  ]);

  if (!values) notFound();

  return (
    <>
      <AdminBar />

      <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
        <h1 className="font-display text-3xl font-extrabold text-deep-charcoal">
          {id.admin.expEditHeading}
        </h1>

        <div className="mt-8">
          <ExperimentForm
            experimentId={experimentId}
            initial={values}
            mediaItems={mediaItems}
            accountEmail={admin.email}
          />
        </div>
      </div>
    </>
  );
}
