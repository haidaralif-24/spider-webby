/**
 * Webby's head, at logo size.
 *
 * A separate component from `WebbyMascot` rather than a scaled-down copy of it:
 * at 36px the eight legs, the test tube and the sparkles collapse into mud, so
 * the mark keeps only what survives — head, goggles, grin.
 *
 * Tuned twice. The first pass had a thick goggle strap and a small head, which
 * at 36px read as a dark blob with a pale centre rather than as a purple spider.
 * The head is now nearly full-bleed in the viewBox, the strap is thin, and the
 * outline is 2.5 rather than 3 — more purple survives the downscale.
 *
 * Inline SVG in the repo, never Cloudinary, never raster (AGENTS.md §4.4).
 * Decorative: the wordmark beside it already says the name, so an accessible
 * label would only be announced twice.
 */
export function WebbyMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      aria-hidden="true"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Head */}
      <circle
        cx={24}
        cy={25}
        r={21}
        className="fill-fun-purple stroke-deep-charcoal"
        strokeWidth={2.5}
      />
      {/* Goggle strap */}
      <path
        d="M10 17.5Q24 8 38 17.5"
        className="fill-none stroke-deep-charcoal"
        strokeWidth={4}
        strokeLinecap="round"
      />
      {/* Lenses */}
      <circle
        cx={17}
        cy={26.5}
        r={7.5}
        className="fill-cloud-white stroke-deep-charcoal"
        strokeWidth={2.5}
      />
      <circle
        cx={31}
        cy={26.5}
        r={7.5}
        className="fill-cloud-white stroke-deep-charcoal"
        strokeWidth={2.5}
      />
      {/* Eyes */}
      <circle cx={18} cy={27.5} r={2.8} className="fill-deep-charcoal" />
      <circle cx={32} cy={27.5} r={2.8} className="fill-deep-charcoal" />
      {/* Grin */}
      <path
        d="M20 37Q24 40.5 28 37"
        className="fill-none stroke-deep-charcoal"
        strokeWidth={2.5}
        strokeLinecap="round"
      />
    </svg>
  );
}
