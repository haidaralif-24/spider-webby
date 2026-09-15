import type { FieldSlug } from "@/lib/content";

/**
 * Per-field presentation.
 *
 * Kept apart from `lib/content.ts` on purpose: that file is content and will be
 * replaced by database queries in P1, while everything here is Tailwind classes
 * and would not survive a translation into SQL.
 *
 * Rules this table exists to enforce (AGENTS.md §4.8, §4.9):
 * - A field colour is a fill, a border or a chip. Never text on a light
 *   background — all three sit at 2.5–3.2:1 against white. Every string on a
 *   field fill is Deep Charcoal.
 * - Colour is never the only signal. Each field carries its own icon silhouette
 *   (`FieldIcon`) and its own decorative motif, so a reader who cannot separate
 *   blue from purple still knows which page they are on.
 * - Class names are written out, never interpolated. Tailwind scans source for
 *   complete strings and would purge `bg-field-${slug}`.
 *
 * The three fields are meant to feel different from each other. `surface` is
 * where most of that lives: graph paper for Physics, an atom lattice for
 * Chemistry, and no ruled pattern at all for Biology — organic, soft, grown.
 */
export type FieldTheme = {
  /** Solid field-coloured fill. */
  fill: string;
  /** Faint ink colour for the motif, as a Tailwind stroke/fill utility. */
  ink: string;
  /** Background texture for the field hero. */
  surface: string;
  /** The decorative glow, as a `--glow-color` custom property. */
  glow: string;
  /** Hero band background. */
  band: string;
  /**
   * The field colour as a raw `var()` reference, for the places that need a
   * colour *value* rather than a class — the page-transition wipe is the only
   * one today. Still a token, never a hex literal (AGENTS.md §4.8).
   */
  tint: string;
};

export const FIELD_THEME: Record<FieldSlug, FieldTheme> = {
  fisika: {
    fill: "bg-field-fisika",
    ink: "stroke-deep-charcoal",
    surface: "field-grid-paper",
    glow: "[--glow-color:var(--color-curious-blue)]",
    band: "bg-linear-to-b from-cloud-white via-lab-mist to-cloud-white",
    tint: "var(--color-curious-blue)",
  },
  kimia: {
    fill: "bg-field-kimia",
    ink: "stroke-deep-charcoal",
    surface: "field-dot-lattice",
    glow: "[--glow-color:var(--color-fun-purple)]",
    band: "bg-linear-to-b from-cloud-white via-lab-mist to-cloud-white",
    tint: "var(--color-fun-purple)",
  },
  biologi: {
    fill: "bg-field-biologi",
    ink: "stroke-deep-charcoal",
    surface: "field-organic",
    glow: "[--glow-color:var(--color-science-green)]",
    band: "bg-linear-to-b from-cloud-white via-lab-mist to-cloud-white",
    tint: "var(--color-science-green)",
  },
};
