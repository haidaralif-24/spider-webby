import { createClient } from "@/lib/supabase/server";
import type { ExperimentFormValues } from "@/components/admin/experiment-form";
import type { MediaItem } from "@/components/admin/media-picker";

/**
 * Reads for the experiment editor.
 *
 * Everything here goes through the anon-key client, so every query is subject to
 * RLS — the same admin-only policies the pages just checked. Two independent
 * gates rather than one, which is the point of the three-place rule in
 * AGENTS.md §4.2.
 */

/** React list keys are not content. Generated on read, never persisted. */
const listKey = () => Math.random().toString(36).slice(2);

export async function listMediaItems(): Promise<MediaItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("media")
    .select("id, public_id, alt, width, height")
    .order("created_at", { ascending: false })
    .limit(200);

  return data ?? [];
}

export type ExperimentSummary = {
  id: string;
  slug: string;
  title: string;
  field_slug: string;
  status: string;
  updated_at: string;
};

export async function listExperiments(): Promise<ExperimentSummary[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("experiments")
    .select("id, slug, title, field_slug, status, updated_at")
    .order("updated_at", { ascending: false })
    .limit(200);

  return data ?? [];
}

export async function getExperimentFormValues(
  id: string,
): Promise<ExperimentFormValues | null> {  const supabase = await createClient();

  const { data: experiment } = await supabase
    .from("experiments")
    .select(
      "id, slug, field_slug, title, author_name, hook, difficulty, est_minutes, hero_media_id",
    )
    .eq("id", id)
    .maybeSingle();

  if (!experiment) return null;

  const [materials, steps, concepts] = await Promise.all([
    supabase
      .from("experiment_materials")
      .select("label, order_index")
      .eq("experiment_id", id)
      .order("order_index"),
    supabase
      .from("experiment_steps")
      .select("title, flow_label, body, media_id, order_index")
      .eq("experiment_id", id)
      .order("order_index"),
    supabase
      .from("experiment_concepts")
      .select("title, body, order_index")
      .eq("experiment_id", id)
      .order("order_index"),
  ]);

  return {
    slug: experiment.slug,
    field_slug: experiment.field_slug as ExperimentFormValues["field_slug"],
    title: experiment.title,
    author_name: experiment.author_name ?? "",
    hook: experiment.hook,
    difficulty: experiment.difficulty as ExperimentFormValues["difficulty"],
    est_minutes: experiment.est_minutes,
    hero_media_id: experiment.hero_media_id,
    materials: (materials.data ?? []).map((row) => ({
      key: listKey(),
      label: row.label,
    })),
    steps: (steps.data ?? []).map((row) => ({
      key: listKey(),
      title: row.title,
      flow_label: row.flow_label ?? "",
      body: row.body,
      media_id: row.media_id,
    })),
    concepts: (concepts.data ?? []).map((row) => ({
      key: listKey(),
      title: row.title,
      body: row.body,
    })),
  };
}

/**
 * The byline used most recently, to prefill a new experiment.
 *
 * The admin account is shared, so the signed-in email says nothing about who is
 * at the keyboard. Seeding the field from the last experiment means the team
 * types their name once rather than on every post — and it is only a default,
 * so anyone else just overwrites it.
 */
export async function getLastAuthorName(): Promise<string> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("experiments")
    .select("author_name")
    .not("author_name", "is", null)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data?.author_name ?? "";
}
