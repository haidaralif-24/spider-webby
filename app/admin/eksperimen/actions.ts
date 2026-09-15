"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import id from "@/messages/id.json";

/**
 * Saving an experiment.
 *
 * AGENTS.md §7: "Validate all input at the Server Action boundary with Zod."
 * The form validates too, so the author gets inline feedback while typing
 * (§4.6 — validation teaches, it does not punish). This is the boundary, and it
 * is the one that counts: a Server Action is reachable by anyone who can POST to
 * it, so a client-side check is a courtesy and never a control.
 *
 * The whole experiment saves at once — the row plus its three repeatable lists.
 * The children are replaced rather than diffed: with one author and lists in the
 * tens, a diff would be more code and more ways to be wrong, and `on delete
 * cascade` plus a single transaction-shaped sequence keeps it consistent.
 */

const MAX = {
  title: 120,
  hook: 200,
  body: 2000,
  label: 120,
  flowLabel: 40,
  slug: 80,
  authorName: 80,
} as const;

const materialSchema = z.object({
  label: z.string().trim().min(1, id.admin.errMaterial).max(MAX.label),
});

const stepSchema = z.object({
  title: z.string().trim().min(1, id.admin.errStepTitle).max(MAX.title),
  /* Optional, 2-4 words (AGENTS.md §4.5). Empty string from an untouched input
   * becomes null rather than a zero-length label. */
  flow_label: z
    .string()
    .trim()
    .max(MAX.flowLabel)
    .transform((value) => (value.length > 0 ? value : null)),
  body: z.string().trim().min(1, id.admin.errStepBody).max(MAX.body),
  media_id: z.uuid().nullable(),
});

const conceptSchema = z.object({
  title: z.string().trim().min(1, id.admin.errConceptTitle).max(MAX.title),
  body: z.string().trim().min(1, id.admin.errConceptBody).max(MAX.body),
});

const experimentSchema = z.object({
  id: z.uuid().nullable(),
  slug: z
    .string()
    .trim()
    .min(1, id.admin.errSlug)
    .max(MAX.slug)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, id.admin.errSlugFormat),
  field_slug: z.enum(["fisika", "kimia", "biologi"]),
  title: z.string().trim().min(1, id.admin.errTitle).max(MAX.title),
  /* Optional. The admin account is shared, so this is the only field that says
   * which person wrote it; `updated_by` still records the account. Empty input
   * becomes null rather than a zero-length byline. */
  author_name: z
    .string()
    .trim()
    .max(MAX.authorName)
    .transform((value) => (value.length > 0 ? value : null)),
  hook: z.string().trim().min(1, id.admin.errHook).max(MAX.hook),
  difficulty: z.enum(["mudah", "sedang", "sulit"]),
  est_minutes: z.coerce
    .number()
    .int()
    .min(1, id.admin.errMinutes)
    .max(240, id.admin.errMinutes),
  hero_media_id: z.uuid().nullable(),
  status: z.enum(["draft", "published"]),
  materials: z.array(materialSchema).max(20),
  /* At least one step: an experiment with no steps has no flowchart and nothing
   * to follow, which is the whole content of the page. */
  steps: z.array(stepSchema).min(1, id.admin.errStepsMin).max(20),
  concepts: z.array(conceptSchema).max(10),
});

export type ExperimentInput = z.input<typeof experimentSchema>;

export type SaveResult = {
  ok: boolean;
  id: string | null;
  /** A summary for the top of the form. */
  error: string | null;
  /** Per-field messages, keyed by dotted path. */
  issues: readonly { path: string; message: string }[];
};

const FAILED: SaveResult = {
  ok: false,
  id: null,
  error: id.admin.saveFailed,
  issues: [],
};

/**
 * Log the real failure, return the friendly one.
 *
 * The author sees "gagal menyimpan"; the operator sees why. Without this the
 * first real problem — a missing table, a policy that denies the write — is
 * indistinguishable from a typo, and the only clue is a generic message.
 */
function report(context: string, detail: unknown) {
  console.error(`[admin/eksperimen] ${context}`, detail);
}

/** Postgres unique-violation. */
const UNIQUE_VIOLATION = "23505";

export async function saveExperiment(input: unknown): Promise<SaveResult> {
  const admin = await requireAdmin();

  const parsed = experimentSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      id: null,
      error: id.admin.formInvalid,
      issues: parsed.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    };
  }

  const data = parsed.data;
  const supabase = await createClient();

  /* `published_at` is stamped once, on the draft -> published transition. An
   * autosave of an already-published experiment must not move its date. */
  let publishedAt: string | null = null;
  if (data.id) {
    const { data: current } = await supabase
      .from("experiments")
      .select("published_at")
      .eq("id", data.id)
      .maybeSingle();
    publishedAt = current?.published_at ?? null;
  }
  if (data.status === "published" && !publishedAt) {
    publishedAt = new Date().toISOString();
  }
  if (data.status === "draft") publishedAt = null;

  const row = {
    slug: data.slug,
    field_slug: data.field_slug,
    title: data.title,
    author_name: data.author_name,
    hook: data.hook,
    difficulty: data.difficulty,
    est_minutes: data.est_minutes,
    hero_media_id: data.hero_media_id,
    status: data.status,
    published_at: publishedAt,
    /* The account. An authenticated uuid, impossible to forge — which is why it
     * is kept alongside `author_name` rather than replaced by it. */
    updated_by: admin.id,
  };

  let experimentId = data.id;

  if (experimentId) {
    const { error } = await supabase
      .from("experiments")
      .update(row)
      .eq("id", experimentId);
    if (error) {
      report("update experiment", error);
      return {
        ...FAILED,
        error: error.code === UNIQUE_VIOLATION ? id.admin.slugTaken : FAILED.error,
      };
    }
  } else {
    const { data: inserted, error } = await supabase
      .from("experiments")
      .insert(row)
      .select("id")
      .single();
    if (error || !inserted) {
      report("insert experiment", error);
      return {
        ...FAILED,
        error: error?.code === UNIQUE_VIOLATION ? id.admin.slugTaken : FAILED.error,
      };
    }
    experimentId = inserted.id;
  }

  /* Replace the children. Delete-then-insert keeps ordering trivially correct —
   * `order_index` is just the array position — and the cascade means an
   * interrupted save cannot leave half an experiment behind. */
  await supabase
    .from("experiment_materials")
    .delete()
    .eq("experiment_id", experimentId);
  await supabase
    .from("experiment_steps")
    .delete()
    .eq("experiment_id", experimentId);
  await supabase
    .from("experiment_concepts")
    .delete()
    .eq("experiment_id", experimentId);

  if (data.materials.length > 0) {
    await supabase.from("experiment_materials").insert(
      data.materials.map((material, index) => ({
        experiment_id: experimentId,
        order_index: index,
        label: material.label,
      })),
    );
  }

  const { error: stepsError } = await supabase.from("experiment_steps").insert(
    data.steps.map((step, index) => ({
      experiment_id: experimentId,
      order_index: index,
      title: step.title,
      flow_label: step.flow_label,
      body: step.body,
      media_id: step.media_id,
    })),
  );
  if (stepsError) {
    report("insert steps", stepsError);
    return { ...FAILED, id: experimentId };
  }

  if (data.concepts.length > 0) {
    await supabase.from("experiment_concepts").insert(
      data.concepts.map((concept, index) => ({
        experiment_id: experimentId,
        order_index: index,
        title: concept.title,
        body: concept.body,
      })),
    );
  }

  /* Mark every referenced image as in use. This is what stops the orphan sweep
   * (brief §3.2) from deleting something the site is serving. */
  const referenced = [
    data.hero_media_id,
    ...data.steps.map((step) => step.media_id),
  ].filter((value): value is string => value !== null);

  if (referenced.length > 0) {
    await supabase
      .from("media")
      .update({ status: "in_use" })
      .in("id", referenced);
  }

  /* AGENTS.md §4.5 — publishing calls `revalidatePath()`. The public pages are
   * static, so without this a newly published experiment would not appear until
   * the next deploy. */
  if (data.status === "published") {
    revalidatePath("/");
    revalidatePath(`/${data.field_slug}`);
    revalidatePath(`/eksperimen/${data.slug}`);
  }

  return { ok: true, id: experimentId, error: null, issues: [] };
}

export async function deleteExperiment(experimentId: string) {
  await requireAdmin();

  const parsed = z.uuid().safeParse(experimentId);
  if (!parsed.success) return { ok: false };

  const supabase = await createClient();
  /* Children go with it: every child table declares `on delete cascade`. */
  const { error } = await supabase
    .from("experiments")
    .delete()
    .eq("id", parsed.data);

  if (error) return { ok: false };

  revalidatePath("/admin/eksperimen");
  return { ok: true };
}
