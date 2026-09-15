"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { saveExperiment, type SaveResult } from "@/app/admin/eksperimen/actions";
import { MediaPicker, type MediaItem } from "@/components/admin/media-picker";
import { ExperimentFlow } from "@/components/experiment-flow";
import id from "@/messages/id.json";

/**
 * The experiment editor.
 *
 * Follows AGENTS.md §4.6 throughout:
 * - **Structured repeatable fields only.** Materials, steps and concepts are
 *   repeatable rows with named inputs. There is no markdown box and no raw HTML
 *   anywhere on this page, which is why the step body is a plain textarea and
 *   not a rich-text editor.
 * - **Drag to reorder**, with up/down buttons alongside it. Drag alone would be
 *   unusable on a phone and unreachable from a keyboard, and §4.9 says no
 *   affordance may be pointer-only.
 * - **A live flowchart preview**, rendering the real `<ExperimentFlow>` from the
 *   current step state — never a mock approximation — with a phone/desktop
 *   toggle so the author sees both orientations.
 * - **Autosave on blur**, with a "tersimpan" confirmation.
 * - **Validation that teaches**: live character counters and hints up front, not
 *   a wall of red after submit.
 *
 * The uploader name is read from the session, not typed. A free-text name field
 * would be a new PII surface and a spoofable audit trail; the authenticated
 * admin is the only answer that is both.
 */

type FieldSlug = "fisika" | "kimia" | "biologi";
type Difficulty = "mudah" | "sedang" | "sulit";

type StepValue = {
  key: string;
  title: string;
  flow_label: string;
  body: string;
  media_id: string | null;
};
type MaterialValue = { key: string; label: string };
type ConceptValue = { key: string; title: string; body: string };

export type ExperimentFormValues = {
  slug: string;
  field_slug: FieldSlug;
  title: string;
  /**
   * The byline. The admin account is shared, so the signed-in email identifies
   * nobody in particular — this is who actually typed it. Admin-only; it is
   * never rendered on the site.
   */
  author_name: string;
  hook: string;
  difficulty: Difficulty;
  est_minutes: number;
  hero_media_id: string | null;
  materials: MaterialValue[];
  steps: StepValue[];
  concepts: ConceptValue[];
};

/** Written out rather than derived: Tailwind scans for complete class names. */
const FIELD_OPTIONS = [
  { value: "fisika", label: id.field.fisika, tone: "fill-field-fisika" },
  { value: "kimia", label: id.field.kimia, tone: "fill-field-kimia" },
  { value: "biologi", label: id.field.biologi, tone: "fill-field-biologi" },
] as const;

const DIFFICULTY_OPTIONS = [
  { value: "mudah", label: id.experiment.difficultyLevels.mudah },
  { value: "sedang", label: id.experiment.difficultyLevels.sedang },
  { value: "sulit", label: id.experiment.difficultyLevels.sulit },
] as const;

const MAX_TITLE = 120;
const MAX_HOOK = 200;
const MAX_AUTHOR = 80;
const AUTOSAVE_MS = 900;

const newKey = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

const emptyStep = (): StepValue => ({
  key: newKey(),
  title: "",
  flow_label: "",
  body: "",
  media_id: null,
});

const emptyMaterial = (): MaterialValue => ({ key: newKey(), label: "" });
const emptyConcept = (): ConceptValue => ({
  key: newKey(),
  title: "",
  body: "",
});

/** Move an item, returning a new array. Used by both drag and the buttons. */
function reorder<T>(list: readonly T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length || from === to) return [...list];
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

const inputClass =
  "min-h-touch w-full rounded-xl border-[3px] border-deep-charcoal bg-cloud-white px-3 py-2 text-base text-deep-charcoal outline-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-deep-charcoal";

const smallButtonClass =
  "inline-flex h-9 w-9 items-center justify-center rounded-lg border-[3px] border-deep-charcoal bg-cloud-white text-sm font-bold text-deep-charcoal disabled:opacity-40";

function GripIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="h-4 w-4 fill-deep-charcoal/60">
      <circle cx="5" cy="4" r="1.4" />
      <circle cx="11" cy="4" r="1.4" />
      <circle cx="5" cy="8" r="1.4" />
      <circle cx="11" cy="8" r="1.4" />
      <circle cx="5" cy="12" r="1.4" />
      <circle cx="11" cy="12" r="1.4" />
    </svg>
  );
}

type RowFrameProps = {
  index: number;
  count: number;
  heading: string;
  onMove: (from: number, to: number) => void;
  onRemove: () => void;
  onDragStart: () => void;
  onDrop: () => void;
  children: ReactNode;
};

function RowFrame({
  index,
  count,
  heading,
  onMove,
  onRemove,
  onDragStart,
  onDrop,
  children,
}: RowFrameProps) {
  return (
    <li
      onDragOver={(event) => event.preventDefault()}
      onDrop={onDrop}
      className="rounded-2xl border-[3px] border-deep-charcoal bg-cloud-white p-4"
    >
      <div className="flex items-center gap-3">
        <span
          draggable
          onDragStart={onDragStart}
          title={id.admin.dragHandle}
          className="cursor-grab select-none"
        >
          <GripIcon />
        </span>
        <span className="text-sm font-bold text-deep-charcoal">
          {heading} {index + 1}
        </span>
        <span className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onMove(index, index - 1)}
            disabled={index === 0}
            aria-label={id.admin.moveUp}
            className={smallButtonClass}
          >
            ↑
          </button>
          <button
            type="button"
            onClick={() => onMove(index, index + 1)}
            disabled={index === count - 1}
            aria-label={id.admin.moveDown}
            className={smallButtonClass}
          >
            ↓
          </button>
          <button
            type="button"
            onClick={onRemove}
            aria-label={id.admin.remove}
            className={smallButtonClass}
          >
            ✕
          </button>
        </span>
      </div>
      <div className="mt-4 flex flex-col gap-4">{children}</div>
    </li>
  );
}

export function ExperimentForm({
  experimentId,
  initial,
  mediaItems,
  accountEmail,
}: {
  /** Null when creating. The first save fills it in and rewrites the address bar. */
  experimentId: string | null;
  initial: ExperimentFormValues;
  mediaItems: readonly MediaItem[];
  accountEmail: string | null;
}) {
  const [values, setValues] = useState<ExperimentFormValues>(initial);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [result, setResult] = useState<SaveResult | null>(null);
  const [preview, setPreview] = useState<"phone" | "desktop">("phone");
  const [dragFrom, setDragFrom] = useState<number | null>(null);

  /* Refs, because the autosave timer fires outside React's render cycle and a
   * closure over `values` would save whatever the value was when the timer was
   * scheduled rather than what the author has since typed.
   *
   * Synced in an effect, not during render: assigning `ref.current` while
   * rendering is what `react-hooks/refs` flags, and it is a real hazard — the
   * render may be discarded and the ref would keep a value that never committed. */
  const valuesRef = useRef(values);
  useEffect(() => {
    valuesRef.current = values;
  }, [values]);
  const idRef = useRef<string | null>(experimentId);
  const timer = useRef<number | null>(null);

  const set = useCallback(<K extends keyof ExperimentFormValues>(
    key: K,
    value: ExperimentFormValues[K],
  ) => {
    setValues((previous) => ({ ...previous, [key]: value }));
  }, []);

  const persist = useCallback(
    async (status: "draft" | "published", options: { silent: boolean }) => {
      const current = valuesRef.current;
      setBusy(true);

      const payload = {
        id: idRef.current,
        slug: current.slug,
        field_slug: current.field_slug,
        title: current.title,
        author_name: current.author_name,
        hook: current.hook,
        difficulty: current.difficulty,
        est_minutes: current.est_minutes,
        hero_media_id: current.hero_media_id,
        status,
        /* `key` is a React list key, not content. Stripped here so it never
         * reaches the database. */
        materials: current.materials.map((item) => ({ label: item.label })),
        steps: current.steps.map((step) => ({
          title: step.title,
          flow_label: step.flow_label,
          body: step.body,
          media_id: step.media_id,
        })),
        concepts: current.concepts.map((concept) => ({
          title: concept.title,
          body: concept.body,
        })),
      };

      const response = await saveExperiment(payload);

      if (response.ok && response.id) {
        if (!idRef.current) {
          idRef.current = response.id;
          /* `replaceState`, not `router.replace`: a real navigation would
           * re-render the page from the server and throw away everything the
           * author has typed since. This only fixes the address bar. */
          window.history.replaceState(
            null,
            "",
            `/admin/eksperimen/${response.id}`,
          );
        }
        setSaved(true);
        window.setTimeout(() => setSaved(false), 2200);
      }

      if (!options.silent) setResult(response);
      setBusy(false);
      return response;
    },
    [],
  );

  /** Autosave, debounced. Silent, so a half-filled form does not shout. */
  const scheduleAutosave = useCallback(() => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      void persist("draft", { silent: true });
    }, AUTOSAVE_MS);
  }, [persist]);

  const activeTone =
    FIELD_OPTIONS.find((option) => option.value === values.field_slug)?.tone ??
    "fill-lab-mist";

  const issues = result && !result.ok ? result.issues : [];

  return (
    <div className="flex flex-col gap-8">
      {/* ---- Action bar ------------------------------------------------- */}
      <div className="sticky top-0 z-20 -mx-4 border-b-[3px] border-deep-charcoal bg-cloud-white/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center rounded-full border-[3px] border-deep-charcoal bg-lab-mist px-3 py-1 text-sm font-bold text-deep-charcoal">
            {values.slug ? id.admin.statusDraft : id.admin.expNewHeading}
          </span>

          {/* The account, not the byline. The admin login is shared, so this
           * says which account is signed in; the "Nama Penulis" field below is
           * what says who is actually writing. */}
          <p className="text-sm text-deep-charcoal/75">
            {id.admin.account}:{" "}
            <span className="font-bold text-deep-charcoal">
              {accountEmail ?? "—"}
            </span>
          </p>

          {/* `role="status"` so the autosave confirmation is announced rather
           * than being a purely visual cue. */}
          <span
            role="status"
            className="text-sm font-bold text-science-green"
            aria-live="polite"
          >
            {busy ? id.admin.saving : saved ? id.admin.saved : ""}
          </span>

          <span className="ml-auto flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => void persist("draft", { silent: false })}
              className="btn-playful inline-flex min-h-touch items-center rounded-2xl border-[3px] border-deep-charcoal bg-cloud-white px-5 py-2 text-base font-bold text-deep-charcoal disabled:opacity-70"
            >
              {id.admin.saveDraft}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void persist("published", { silent: false })}
              className="btn-playful inline-flex min-h-touch items-center rounded-2xl border-[3px] border-deep-charcoal bg-science-green px-5 py-2 text-base font-bold text-deep-charcoal disabled:opacity-70"
            >
              {id.admin.publish}
            </button>
          </span>
        </div>
      </div>

      {/* A summary of what the server rejected. The inline hints above each
       * field do the teaching; this is the backstop when something slips
       * through. */}
      {result && !result.ok ? (
        <div
          role="alert"
          className="rounded-2xl border-[3px] border-deep-charcoal bg-energy-orange p-4"
        >
          <p className="font-bold text-deep-charcoal">{result.error}</p>
          {issues.length > 0 ? (
            <ul className="mt-2 list-disc pl-5 text-sm text-deep-charcoal">
              {issues.map((issue) => (
                <li key={`${issue.path}-${issue.message}`}>
                  {issue.path}: {issue.message}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      {/* ---- The experiment itself -------------------------------------- */}
      <section className="flex flex-col gap-5">
        <label className="flex flex-col gap-2">
          <span className="flex items-center justify-between text-sm font-bold text-deep-charcoal">
            {id.admin.fieldTitle}
            <span className="font-normal text-deep-charcoal/60">
              {values.title.length}/{MAX_TITLE}
            </span>
          </span>
          <input
            type="text"
            value={values.title}
            maxLength={MAX_TITLE}
            onChange={(event) => set("title", event.target.value)}
            onBlur={scheduleAutosave}
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="flex items-center justify-between text-sm font-bold text-deep-charcoal">
            {id.admin.fieldAuthor}
            <span className="font-normal text-deep-charcoal/60">
              {values.author_name.length}/{MAX_AUTHOR}
            </span>
          </span>
          <p className="text-sm text-deep-charcoal/70">
            {id.admin.fieldAuthorHint}
          </p>
          <input
            type="text"
            value={values.author_name}
            maxLength={MAX_AUTHOR}
            onChange={(event) => set("author_name", event.target.value)}
            onBlur={scheduleAutosave}
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-bold text-deep-charcoal">
            {id.admin.fieldSlug}
          </span>
          <p className="text-sm text-deep-charcoal/70">
            {id.admin.fieldSlugHint}
          </p>
          <input
            type="text"
            value={values.slug}
            maxLength={80}
            onChange={(event) =>
              set(
                "slug",
                event.target.value
                  .toLowerCase()
                  .replace(/[^a-z0-9-]+/g, "-")
                  .replace(/-{2,}/g, "-"),
              )
            }
            onBlur={scheduleAutosave}
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="flex items-center justify-between text-sm font-bold text-deep-charcoal">
            {id.admin.fieldHook}
            <span className="font-normal text-deep-charcoal/60">
              {values.hook.length}/{MAX_HOOK}
            </span>
          </span>
          <p className="text-sm text-deep-charcoal/70">
            {id.admin.fieldHookHint}
          </p>
          <textarea
            value={values.hook}
            maxLength={MAX_HOOK}
            rows={2}
            onChange={(event) => set("hook", event.target.value)}
            onBlur={scheduleAutosave}
            className={inputClass}
          />
        </label>

        <div className="grid gap-5 sm:grid-cols-3">
          <label className="flex flex-col gap-2">
            <span className="text-sm font-bold text-deep-charcoal">
              {id.admin.fieldField}
            </span>
            <select
              value={values.field_slug}
              onChange={(event) =>
                set("field_slug", event.target.value as FieldSlug)
              }
              onBlur={scheduleAutosave}
              className={inputClass}
            >
              {FIELD_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-bold text-deep-charcoal">
              {id.admin.fieldDifficulty}
            </span>
            <select
              value={values.difficulty}
              onChange={(event) =>
                set("difficulty", event.target.value as Difficulty)
              }
              onBlur={scheduleAutosave}
              className={inputClass}
            >
              {DIFFICULTY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-bold text-deep-charcoal">
              {id.admin.fieldMinutes}
            </span>
            <input
              type="number"
              min={1}
              max={240}
              value={values.est_minutes}
              onChange={(event) =>
                set("est_minutes", Number(event.target.value))
              }
              onBlur={scheduleAutosave}
              className={inputClass}
            />
          </label>
        </div>

        <MediaPicker
          label={id.admin.fieldHero}
          slot="hero"
          value={values.hero_media_id}
          items={mediaItems}
          onChange={(next) => set("hero_media_id", next)}
        />
      </section>

      {/* ---- Materials --------------------------------------------------- */}
      <section className="flex flex-col gap-4">
        <h2 className="font-display text-xl font-extrabold text-deep-charcoal">
          {id.admin.sectionMaterials}
        </h2>
        <ul className="flex flex-col gap-3">
          {values.materials.map((material, index) => (
            <RowFrame
              key={material.key}
              index={index}
              count={values.materials.length}
              heading={id.admin.materialLabel}
              onMove={(from, to) =>
                set("materials", reorder(values.materials, from, to))
              }
              onRemove={() =>
                set(
                  "materials",
                  values.materials.filter((item) => item.key !== material.key),
                )
              }
              onDragStart={() => setDragFrom(index)}
              onDrop={() => {
                if (dragFrom !== null) {
                  set("materials", reorder(values.materials, dragFrom, index));
                  setDragFrom(null);
                }
              }}
            >
              <input
                type="text"
                value={material.label}
                maxLength={120}
                placeholder={id.admin.materialLabel}
                aria-label={`${id.admin.materialLabel} ${index + 1}`}
                onChange={(event) =>
                  set(
                    "materials",
                    values.materials.map((item) =>
                      item.key === material.key
                        ? { ...item, label: event.target.value }
                        : item,
                    ),
                  )
                }
                onBlur={scheduleAutosave}
                className={inputClass}
              />
            </RowFrame>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => set("materials", [...values.materials, emptyMaterial()])}
          className="btn-playful inline-flex min-h-touch w-fit items-center rounded-2xl border-[3px] border-deep-charcoal bg-cloud-white px-5 py-2 text-base font-bold text-deep-charcoal"
        >
          + {id.admin.addMaterial}
        </button>
      </section>

      {/* ---- Steps ------------------------------------------------------- */}
      <section className="flex flex-col gap-4">
        <h2 className="font-display text-xl font-extrabold text-deep-charcoal">
          {id.admin.sectionSteps}
        </h2>
        <ul className="flex flex-col gap-3">
          {values.steps.map((step, index) => (
            <RowFrame
              key={step.key}
              index={index}
              count={values.steps.length}
              heading={id.admin.stepTitle}
              onMove={(from, to) => set("steps", reorder(values.steps, from, to))}
              onRemove={() =>
                set(
                  "steps",
                  values.steps.filter((item) => item.key !== step.key),
                )
              }
              onDragStart={() => setDragFrom(index)}
              onDrop={() => {
                if (dragFrom !== null) {
                  set("steps", reorder(values.steps, dragFrom, index));
                  setDragFrom(null);
                }
              }}
            >
              <input
                type="text"
                value={step.title}
                maxLength={MAX_TITLE}
                placeholder={id.admin.stepTitle}
                aria-label={`${id.admin.stepTitle} ${index + 1}`}
                onChange={(event) =>
                  set(
                    "steps",
                    values.steps.map((item) =>
                      item.key === step.key
                        ? { ...item, title: event.target.value }
                        : item,
                    ),
                  )
                }
                onBlur={scheduleAutosave}
                className={inputClass}
              />

              <label className="flex flex-col gap-1">
                <span className="text-sm font-bold text-deep-charcoal">
                  {id.admin.stepFlowLabel}
                </span>
                <span className="text-sm text-deep-charcoal/70">
                  {id.admin.stepFlowLabelHint}
                </span>
                <input
                  type="text"
                  value={step.flow_label}
                  maxLength={40}
                  onChange={(event) =>
                    set(
                      "steps",
                      values.steps.map((item) =>
                        item.key === step.key
                          ? { ...item, flow_label: event.target.value }
                          : item,
                      ),
                    )
                  }
                  onBlur={scheduleAutosave}
                  className={inputClass}
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-sm font-bold text-deep-charcoal">
                  {id.admin.stepBody}
                </span>
                <textarea
                  value={step.body}
                  rows={3}
                  maxLength={2000}
                  onChange={(event) =>
                    set(
                      "steps",
                      values.steps.map((item) =>
                        item.key === step.key
                          ? { ...item, body: event.target.value }
                          : item,
                      ),
                    )
                  }
                  onBlur={scheduleAutosave}
                  className={inputClass}
                />
              </label>

              <MediaPicker
                label={id.admin.stepImage}
                slot="step"
                value={step.media_id}
                items={mediaItems}
                onChange={(next) =>
                  set(
                    "steps",
                    values.steps.map((item) =>
                      item.key === step.key ? { ...item, media_id: next } : item,
                    ),
                  )
                }
              />
            </RowFrame>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => set("steps", [...values.steps, emptyStep()])}
          className="btn-playful inline-flex min-h-touch w-fit items-center rounded-2xl border-[3px] border-deep-charcoal bg-cloud-white px-5 py-2 text-base font-bold text-deep-charcoal"
        >
          + {id.admin.addStep}
        </button>
      </section>

      {/* ---- Concepts ---------------------------------------------------- */}
      <section className="flex flex-col gap-4">
        <h2 className="font-display text-xl font-extrabold text-deep-charcoal">
          {id.admin.sectionConcepts}
        </h2>
        <ul className="flex flex-col gap-3">
          {values.concepts.map((concept, index) => (
            <RowFrame
              key={concept.key}
              index={index}
              count={values.concepts.length}
              heading={id.admin.conceptTitle}
              onMove={(from, to) =>
                set("concepts", reorder(values.concepts, from, to))
              }
              onRemove={() =>
                set(
                  "concepts",
                  values.concepts.filter((item) => item.key !== concept.key),
                )
              }
              onDragStart={() => setDragFrom(index)}
              onDrop={() => {
                if (dragFrom !== null) {
                  set("concepts", reorder(values.concepts, dragFrom, index));
                  setDragFrom(null);
                }
              }}
            >
              <input
                type="text"
                value={concept.title}
                maxLength={MAX_TITLE}
                placeholder={id.admin.conceptTitle}
                aria-label={`${id.admin.conceptTitle} ${index + 1}`}
                onChange={(event) =>
                  set(
                    "concepts",
                    values.concepts.map((item) =>
                      item.key === concept.key
                        ? { ...item, title: event.target.value }
                        : item,
                    ),
                  )
                }
                onBlur={scheduleAutosave}
                className={inputClass}
              />
              <textarea
                value={concept.body}
                rows={3}
                maxLength={2000}
                placeholder={id.admin.conceptBody}
                aria-label={`${id.admin.conceptBody} ${index + 1}`}
                onChange={(event) =>
                  set(
                    "concepts",
                    values.concepts.map((item) =>
                      item.key === concept.key
                        ? { ...item, body: event.target.value }
                        : item,
                    ),
                  )
                }
                onBlur={scheduleAutosave}
                className={inputClass}
              />
            </RowFrame>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => set("concepts", [...values.concepts, emptyConcept()])}
          className="btn-playful inline-flex min-h-touch w-fit items-center rounded-2xl border-[3px] border-deep-charcoal bg-cloud-white px-5 py-2 text-base font-bold text-deep-charcoal"
        >
          + {id.admin.addConcept}
        </button>
      </section>

      {/* ---- Live preview ------------------------------------------------ */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-display text-xl font-extrabold text-deep-charcoal">
            {id.admin.sectionPreview}
          </h2>
          <span className="ml-auto flex gap-2">
            <button
              type="button"
              aria-pressed={preview === "phone"}
              onClick={() => setPreview("phone")}
              className={`inline-flex min-h-touch items-center rounded-xl border-[3px] border-deep-charcoal px-4 py-2 text-sm font-bold text-deep-charcoal ${
                preview === "phone" ? "bg-discovery-yellow" : "bg-cloud-white"
              }`}
            >
              {id.admin.previewPhone}
            </button>
            <button
              type="button"
              aria-pressed={preview === "desktop"}
              onClick={() => setPreview("desktop")}
              className={`inline-flex min-h-touch items-center rounded-xl border-[3px] border-deep-charcoal px-4 py-2 text-sm font-bold text-deep-charcoal ${
                preview === "desktop" ? "bg-discovery-yellow" : "bg-cloud-white"
              }`}
            >
              {id.admin.previewDesktop}
            </button>
          </span>
        </div>

        <p className="text-sm text-deep-charcoal/70">
          {id.admin.previewHint}
        </p>

        {/* The real component, at a real breakpoint width — not a scaled mock.
         * `sm` is 40rem, so 24rem renders the vertical flow and 44rem renders
         * the horizontal one, exactly as the public page would. */}
        <div className="overflow-x-auto rounded-2xl border-[3px] border-dashed border-deep-charcoal/30 p-4">
          <div
            className={
              preview === "phone"
                ? "mx-auto w-[24rem] max-w-full"
                : "w-[44rem] max-w-full"
            }
          >
            {values.steps.length > 0 ? (
              <ExperimentFlow
                steps={values.steps.map((step) => ({
                  title: step.title || "…",
                  flow_label: step.flow_label,
                }))}
                tone={activeTone}
              />
            ) : (
              <p className="text-sm text-deep-charcoal/60">
                {id.admin.errStepsMin}
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
