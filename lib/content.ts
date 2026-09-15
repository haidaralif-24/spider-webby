import experimentsData from "@/content/experiments.json";
import fieldsData from "@/content/fields.json";

/**
 * P0 seed data.
 *
 * `content/*.json` mirrors the eventual `fields` and `experiments` tables (brief
 * §6) so P1 is a mapping exercise rather than a rewrite. There is no database in
 * P0 — see AGENTS.md §5.
 *
 * Two deliberate divergences from the schema, both recorded here so P1 knows
 * what it is mapping:
 *
 * - `fields.intro_md` becomes `intro: string[]`. The admin forbids a markdown or
 *   raw-HTML box (AGENTS.md §4.6), so the intro is stored as structured
 *   paragraphs rather than as markdown that nothing can render.
 * - `experiments.field_id` becomes `field`, the field's slug. There are no
 *   integer primary keys outside a database, and the slug is what the route uses.
 *
 * The casts are deliberate. `resolveJsonModule` widens every string to `string`,
 * so the literal unions have to be re-asserted; validating seed data that only
 * ever lives in this repo would be ceremony.
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

export type Experiment = {
  slug: string;
  field: FieldSlug;
  order: number;
  title: string;
  hook: string;
  difficulty: Difficulty;
  est_minutes: number;
};

export const FIELDS = fieldsData as readonly Field[];
export const EXPERIMENTS = experimentsData as readonly Experiment[];

/** Field slugs in display order. Used by `generateStaticParams`. */
export function getFieldSlugs(): FieldSlug[] {
  return [...FIELDS].sort((a, b) => a.order - b.order).map((field) => field.slug);
}

export function getField(slug: string): Field | undefined {
  return FIELDS.find((field) => field.slug === slug);
}

export function isFieldSlug(slug: string): slug is FieldSlug {
  return FIELDS.some((field) => field.slug === slug);
}

export function getExperiments(field: FieldSlug): Experiment[] {
  return EXPERIMENTS.filter((experiment) => experiment.field === field).sort(
    (a, b) => a.order - b.order,
  );
}
