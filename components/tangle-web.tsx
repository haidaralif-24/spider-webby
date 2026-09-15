/**
 * A spider web with a piece missing.
 *
 * The 404 illustration, and the reason it is a web rather than a generic "lost"
 * graphic: the brand is a spider, so a broken web is the site's own way of saying
 * "there is a gap here". One segment of the outer ring is omitted, which is the
 * whole joke.
 *
 * Inline SVG in the repo, never Cloudinary, never raster (AGENTS.md §4.4).
 * Decorative — the heading beside it carries the message, so an accessible label
 * would only be read twice.
 */

const SPOKES = 8;
const CENTRE = 160;
const OUTER = 154;
const INNER = 46;
const RINGS = [46, 82, 118, 154];

/** The segment of the outer ring that is missing. */
const GAP = 1;

/** A vertex on the web, angle 0 pointing up. */
function vertex(radius: number, index: number): readonly [number, number] {
  const angle = (Math.PI * 2 * index) / SPOKES - Math.PI / 2;
  return [
    Number((CENTRE + radius * Math.cos(angle)).toFixed(1)),
    Number((CENTRE + radius * Math.sin(angle)).toFixed(1)),
  ] as const;
}

/**
 * A ring of the web.
 *
 * The chords sag toward the centre rather than running straight between spokes.
 * Straight chords make an octagon; the sag is what makes it read as silk.
 *
 * `skip` omits one segment and restarts the path, so the ring is drawn open.
 */
function ringPath(radius: number, skip = -1, sag = 0.14): string {
  const points = Array.from({ length: SPOKES }, (_, index) => vertex(radius, index));
  let d = "";

  for (let index = 0; index < SPOKES; index += 1) {
    const from = points[index];
    const to = points[(index + 1) % SPOKES];

    if (index === skip) {
      d += `M${to[0]} ${to[1]}`;
      continue;
    }

    const midX = (from[0] + to[0]) / 2;
    const midY = (from[1] + to[1]) / 2;
    const controlX = Number((midX + (CENTRE - midX) * sag).toFixed(1));
    const controlY = Number((midY + (CENTRE - midY) * sag).toFixed(1));

    if (!d) d += `M${from[0]} ${from[1]}`;
    d += `Q${controlX} ${controlY} ${to[0]} ${to[1]}`;
  }

  return d;
}

export function TangleWeb({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 320 320"
      aria-hidden="true"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Spokes, from the inner ring outward so the middle stays clear for the
       * mascot that sits on top of this. */}
      <g
        className="stroke-deep-charcoal/25"
        strokeWidth={2.5}
        strokeLinecap="round"
      >
        {Array.from({ length: SPOKES }, (_, index) => {
          const [x, y] = vertex(OUTER, index);
          const [fromX, fromY] = vertex(INNER, index);
          return <line key={index} x1={fromX} y1={fromY} x2={x} y2={y} />;
        })}
      </g>

      {/* Rings. The outermost is the one with the gap. */}
      <g className="fill-none stroke-deep-charcoal/25" strokeWidth={2.5}>
        {RINGS.map((radius) => (
          <path
            key={radius}
            d={ringPath(radius, radius === OUTER ? GAP : -1)}
            strokeLinecap="round"
          />
        ))}
      </g>

      {/* The broken strand, still hanging from the gap. The gap is segment
       * `GAP` of the outer ring, which sits in the upper right. */}
      <path
        d="M272 116q14 18 3 34t8 32"
        className="fill-none stroke-deep-charcoal/35"
        strokeWidth={2.5}
        strokeLinecap="round"
      />
    </svg>
  );
}
