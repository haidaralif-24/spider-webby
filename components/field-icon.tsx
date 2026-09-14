/**
 * The three field icon silhouettes.
 *
 * AGENTS.md §4.9 / brief §5.10: colour must never be the only signal. Roughly 1
 * in 12 boys has a colour vision deficiency and blue/purple is exactly the pair
 * that gets confused — Physics and Chemistry. Every place a field is identified
 * by colour must carry one of these shapes alongside it, so the colour
 * reinforces the signal instead of carrying it.
 *
 * Server component. Icons are inline SVG in the repo — never Cloudinary, never
 * raster (AGENTS.md §4.4). They inherit `currentColor`, so the caller decides
 * the colour and the icon stays palette-agnostic.
 */

export type FieldSlug = "fisika" | "kimia" | "biologi";

type FieldIconProps = {
  field: FieldSlug;
  className?: string;
};

export function FieldIcon({ field, className }: FieldIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      /* Decorative: the field name is always adjacent as text, so announcing
       * the icon too would just be noise for a screen reader. */
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {field === "fisika" && <PhysicsGlyph />}
      {field === "kimia" && <ChemistryGlyph />}
      {field === "biologi" && <BiologyGlyph />}
    </svg>
  );
}

/** Physics — an atom with three orbits. */
function PhysicsGlyph() {
  return (
    <>
      <circle cx="12" cy="12" r="2.6" fill="currentColor" stroke="none" />
      <ellipse cx="12" cy="12" rx="10" ry="4.4" />
      <ellipse cx="12" cy="12" rx="10" ry="4.4" transform="rotate(60 12 12)" />
      <ellipse
        cx="12"
        cy="12"
        rx="10"
        ry="4.4"
        transform="rotate(120 12 12)"
      />
    </>
  );
}

/** Chemistry — an Erlenmeyer flask with a fill line. */
function ChemistryGlyph() {
  return (
    <>
      <path d="M9.5 3h5" />
      <path d="M10.8 3v6.2L5.6 18.4A2 2 0 0 0 7.4 21.4h9.2a2 2 0 0 0 1.8-3L13.2 9.2V3" />
      <path d="M7.6 15h8.8" />
    </>
  );
}

/** Biology — a leaf with a centre vein. */
function BiologyGlyph() {
  return (
    <>
      <path d="M4 20C4 11.2 11.2 4 20 4c0 8.8-7.2 16-16 16Z" />
      <path d="M4 20 14.2 9.8" />
    </>
  );
}
