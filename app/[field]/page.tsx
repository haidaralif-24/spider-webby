import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ExperimentGrid } from "@/components/experiment-grid";
import { FieldHero } from "@/components/field-hero";
import { FieldTabs } from "@/components/field-tabs";
import { getExperiments, getField, getFieldSlugs } from "@/lib/content";

/**
 * A field page: `/fisika`, `/kimia`, `/biologi`.
 *
 * Statically generated from the three slugs in `content/fields.json` — no
 * database, no client JS, one HTML file per field (AGENTS.md §4.5, §5).
 *
 * `dynamicParams = false` means anything that is not one of those three slugs
 * 404s instead of being rendered on demand. Without it, `/apa-saja` would try to
 * build a field page and fail at the `notFound()`.
 *
 * The Trivia tab is P2 work and is not a link yet — see `FieldTabs`.
 */

type FieldPageProps = { params: Promise<{ field: string }> };

export function generateStaticParams() {
  return getFieldSlugs().map((field) => ({ field }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: FieldPageProps): Promise<Metadata> {
  const { field } = await params;
  const found = getField(field);
  if (!found) return {};

  return {
    title: found.name,
    description: found.intro.join(" "),
  };
}

export default async function FieldPage({ params }: FieldPageProps) {
  const { field } = await params;
  const found = getField(field);
  if (!found) notFound();

  return (
    <>
      <FieldHero field={found} />
      <div className="pt-10">
        <FieldTabs />
      </div>
      <ExperimentGrid
        field={found.slug}
        experiments={getExperiments(found.slug)}
      />
    </>
  );
}
