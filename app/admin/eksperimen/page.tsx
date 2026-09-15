import Link from "next/link";
import { AdminBar } from "@/components/admin/admin-bar";
import { requireAdmin } from "@/lib/auth";
import { listExperiments } from "@/app/admin/eksperimen/queries";
import id from "@/messages/id.json";

/**
 * The experiment list.
 *
 * `requireAdmin()` before any query, every time. The middleware already
 * redirected anyone without the role, but a page that leans on the middleware is
 * one matcher edit away from being public (AGENTS.md §4.2).
 */
export default async function AdminExperimentsPage() {
  await requireAdmin();
  const experiments = await listExperiments();

  return (
    <>
      <AdminBar />

      <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-center gap-4">
          <h1 className="font-display text-3xl font-extrabold text-deep-charcoal">
            {id.admin.expListHeading}
          </h1>
          <Link
            href="/admin/eksperimen/baru"
            className="btn-playful ml-auto inline-flex min-h-touch items-center rounded-2xl border-[3px] border-deep-charcoal bg-science-green px-5 py-2 text-base font-bold text-deep-charcoal"
          >
            + {id.admin.expAdd}
          </Link>
        </div>

        {experiments.length === 0 ? (
          <p className="mt-8 text-base text-deep-charcoal/75">
            {id.admin.expListEmpty}
          </p>
        ) : (
          <ul className="mt-8 flex flex-col gap-3">
            {experiments.map((experiment) => (
              <li key={experiment.id}>
                <Link
                  href={`/admin/eksperimen/${experiment.id}`}
                  className="btn-playful flex flex-wrap items-center gap-3 rounded-2xl border-[3px] border-deep-charcoal bg-cloud-white px-5 py-4"
                >
                  <span className="font-display text-lg font-extrabold text-deep-charcoal">
                    {experiment.title}
                  </span>
                  <span className="rounded-full border-[3px] border-deep-charcoal bg-lab-mist px-3 py-0.5 text-xs font-bold text-deep-charcoal">
                    {id.field[
                      experiment.field_slug as keyof typeof id.field
                    ] ?? experiment.field_slug}
                  </span>
                  <span
                    className={`rounded-full border-[3px] border-deep-charcoal px-3 py-0.5 text-xs font-bold text-deep-charcoal ${
                      experiment.status === "published"
                        ? "bg-science-green"
                        : "bg-discovery-yellow"
                    }`}
                  >
                    {experiment.status === "published"
                      ? id.admin.statusPublished
                      : id.admin.statusDraft}
                  </span>
                  <span className="ml-auto text-sm text-deep-charcoal/60">
                    {experiment.slug}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
