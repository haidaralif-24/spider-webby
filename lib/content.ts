import type { SupabaseClient } from "@supabase/supabase-js";
import fieldsData from "@/content/fields.json";
import { createPublicClient } from "@/lib/supabase/public";

/**
 * Public content reads.
 *
 * The three fields still come from `content/fields.json`: they are fixed, there
 * are exactly three, and a one-column table with three rows would be indirection
 * for its own sake. `experiments.field_slug` carries the same CHECK constraint,
 * so the two cannot disagree.
 *
 * Experiments now come from **Supabase**, not from JSON. That is the P1 migration
 * the brief describes ("migrate seed data in"), and it is what makes an
 * experiment published through `/admin` appear on its field page. `content/
 * experiments.json` is kept as the record of what was imported, but nothing reads
 * it at runtime.
 *
 * These functions are async and cookie-free, so the pages that call them stay
 * statically rendered (AGENTS.md §4.5). They fail soft: a content read that
 * errors returns an empty list and logs, because a database blip should not fail
 * a deploy or a page render.
 */

export type FieldSlug = "fisika" | "kimia" | "biologi";

export type Difficulty = "mudah" | "sedang" | "sulit";

export type Field = {
  slug: FieldSlug;
  name: string;
  color_token: FieldSlug;
  order: number;
  intro: string[];
};

/** A row from `public.experiments`. */
export type Experiment = {
  id: string;
  slug: string;
  field_slug: FieldSlug;
  title: string;
  hook: string;
  difficulty: Difficulty;
  est_minutes: number;
  hero_media_id: string | null;
};

/**
 * `resolveJsonModule` widens every string to `string`, so the literal unions have
 * to be re-asserted. Validating data that only ever lives in this repo would be
 * ceremony.
 */
export const FIELDS = fieldsData as readonly Field[];

export function getFieldSlugs(): FieldSlug[] {
  return [...FIELDS]
    .sort((a, b) => a.order - b.order)
    .map((field) => field.slug);
}

export function getField(slug: string): Field | undefined {
  return FIELDS.find((field) => field.slug === slug);
}

export function isFieldSlug(slug: string): slug is FieldSlug {
  return FIELDS.some((field) => field.slug === slug);
}

const EXPERIMENT_COLUMNS =
  "id, slug, field_slug, title, hook, difficulty, est_minutes, hero_media_id" as const;

const MEDIA_COLUMNS = "id, public_id, alt, width, height" as const;

/**
 * Resolve a set of `media.id` references to the fields `MediaImage` needs.
 *
 * One query for the whole set rather than a join per row, because a grid of
 * twelve cards would otherwise be twelve round trips. The guard matters:
 * PostgREST rejects an `in` with an empty list.
 *
 * RLS is what keeps this honest — an anonymous caller only sees media referenced
 * by a published experiment (AGENTS.md §4.4), so a draft's images simply come
 * back missing rather than leaking.
 */
async function resolveMedia(
  supabase: SupabaseClient,
  ids: readonly (string | null)[],
): Promise<Map<string, ResolvedMedia>> {
  const wanted = [...new Set(ids.filter((id): id is string => id !== null))];
  const byId = new Map<string, ResolvedMedia>();

  if (wanted.length === 0) return byId;

  const { data } = await supabase
    .from("media")
    .select(MEDIA_COLUMNS)
    .in("id", wanted);

  for (const row of data ?? []) {
    byId.set(row.id, row as ResolvedMedia);
  }

  return byId;
}

/**
 * Published experiments in one field, each with its cover image resolved.
 *
 * `status = 'published'` is written out even though RLS already enforces it for
 * `anon`. The policy is the control; this is the intent, stated where a reader
 * will look for it.
 */
export async function getExperiments(
  field: FieldSlug,
): Promise<ExperimentCardData[]> {
  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from("experiments")
    .select(EXPERIMENT_COLUMNS)
    .eq("field_slug", field)
    .eq("status", "published")
    .order("order_index")
    .order("title");

  if (error) {
    console.error("[content] getExperiments", field, error);
    return [];
  }

  const rows = (data ?? []) as Experiment[];
  const mediaById = await resolveMedia(
    supabase,
    rows.map((row) => row.hero_media_id),
  );

  return rows.map((row) => ({
    ...row,
    hero: row.hero_media_id ? (mediaById.get(row.hero_media_id) ?? null) : null,
  }));
}

/** The `media` fields every image needs. `public_id` is the only reference stored. */
export type ResolvedMedia = {
  id: string;
  public_id: string;
  alt: string;
  width: number;
  height: number;
};

export type ExperimentMaterial = {
  id: string;
  label: string;
};

export type ExperimentStep = {
  id: string;
  title: string;
  /** Optional, 2–4 words. The flowchart falls back to the truncated title. */
  flow_label: string | null;
  body: string;
  media: ResolvedMedia | null;
};

export type ExperimentConcept = {
  id: string;
  title: string;
  body: string;
};

export type ExperimentDetail = Experiment & {
  hero: ResolvedMedia | null;
  materials: ExperimentMaterial[];
  steps: ExperimentStep[];
  concepts: ExperimentConcept[];
};

/** What a grid card needs: the row plus its cover image, already resolved. */
export type ExperimentCardData = Experiment & {
  hero: ResolvedMedia | null;
};

/**
 * One experiment with everything the detail page needs.
 *
 * Three queries plus one media lookup rather than a nested select, because the
 * media lookup is shared: the hero and every step image are resolved in a single
 * round trip and then attached from a map. A per-step join would be one request
 * per image.
 *
 * Returns `null` for anything the caller may not read — a draft, or a slug that
 * does not exist. RLS is what makes those the same answer, and the page turns
 * both into a 404 rather than leaking which one it was.
 */
export async function getExperimentBySlug(
  slug: string,
): Promise<ExperimentDetail | null> {
  const supabase = createPublicClient();

  const { data: experiment, error } = await supabase
    .from("experiments")
    .select(EXPERIMENT_COLUMNS)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    console.error("[content] getExperimentBySlug", slug, error);
    return null;
  }
  if (!experiment) return null;

  const [materials, steps, concepts] = await Promise.all([
    supabase
      .from("experiment_materials")
      .select("id, label")
      .eq("experiment_id", experiment.id)
      .order("order_index"),
    supabase
      .from("experiment_steps")
      .select("id, title, flow_label, body, media_id")
      .eq("experiment_id", experiment.id)
      .order("order_index"),
    supabase
      .from("experiment_concepts")
      .select("id, title, body")
      .eq("experiment_id", experiment.id)
      .order("order_index"),
  ]);

  const stepRows = steps.data ?? [];

  /* One lookup for the hero and every step image together. */
  const mediaById = await resolveMedia(supabase, [
    experiment.hero_media_id,
    ...stepRows.map((step) => step.media_id),
  ]);

  return {
    ...(experiment as Experiment),
    hero: experiment.hero_media_id
      ? (mediaById.get(experiment.hero_media_id) ?? null)
      : null,
    materials: (materials.data ?? []) as ExperimentMaterial[],
    steps: stepRows.map((step) => ({
      id: step.id,
      title: step.title,
      flow_label: step.flow_label,
      body: step.body,
      media: step.media_id ? (mediaById.get(step.media_id) ?? null) : null,
    })),
    concepts: (concepts.data ?? []) as ExperimentConcept[],
  };
}

/**
 * Every published slug, for `generateStaticParams`.
 *
 * Fails soft to an empty list. That is the correct degradation: the route allows
 * on-demand rendering, so an empty list means "nothing pre-built" rather than
 * "nothing exists", and a database that is unreachable at build time does not
 * fail the deploy.
 */
export async function getPublishedSlugs(): Promise<string[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("experiments")
    .select("slug")
    .eq("status", "published");

  if (error) {
    console.error("[content] getPublishedSlugs", error);
    return [];
  }

  return (data ?? []).map((row) => row.slug);
}
