import type { FieldSlug } from "@/lib/content";

/**
 * One decorative motif per field, and the main reason the three field pages do
 * not look like the same page in three colours.
 *
 * Physics is a system: an orbit, a body, a projectile on a dotted arc. Straight
 * lines, dashed paths, things moving along predictable routes.
 *
 * Chemistry is a lattice: a molecule with nodes and bonds, bubbles rising
 * through a wavy liquid. Round things, clustered, changing.
 *
 * Biology is growth: a leaf with veins and two cells mid-division. No dashes, no
 * straight lines, nothing mechanical.
 *
 * All three are inline SVG server components — zero client JS, zero image
 * requests (AGENTS.md §4.4, §4.5). All of them are `aria-hidden`: the field name
 * is always adjacent as real text, and the icon silhouette in the heading is
 * what actually carries the signal for a reader who cannot separate the three
 * field colours (§4.9).
 *
 * Colour comes from Tailwind theme tokens, never a hex literal (§4.8).
 */

/** A soft four-point sparkle, centred on `x`, `y`. */
function sparkle(x: number, y: number) {
  return `M${x} ${y - 13}l3.4 9.6L${x + 13} ${y}l-9.6 3.4L${x} ${y + 13}l-3.4-9.6L${x - 13} ${y}z`;
}

export function FieldMotif({
  field,
  className,
}: {
  field: FieldSlug;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 320 320"
      aria-hidden="true"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {field === "fisika" && <PhysicsMotif />}
      {field === "kimia" && <ChemistryMotif />}
      {field === "biologi" && <BiologyMotif />}
    </svg>
  );
}

/** Physics — a system in motion. */
function PhysicsMotif() {
  return (
    <>
      {/* Orbit, tilted so it reads as a path rather than a target. */}
      <g transform="rotate(-16 170 130)">
        <ellipse
          cx={170}
          cy={130}
          rx={118}
          ry={52}
          className="fill-none stroke-deep-charcoal/30"
          strokeWidth={3}
          strokeDasharray="10 12"
        />
        <g className="motif-orbit">
          <circle
            cx={170}
            cy={78}
            r={13}
            className="fill-curious-blue stroke-deep-charcoal"
            strokeWidth={5}
          />
        </g>
      </g>

      {/* The body being orbited. */}
      <circle
        cx={170}
        cy={130}
        r={28}
        className="fill-curious-blue stroke-deep-charcoal"
        strokeWidth={6}
      />
      <circle cx={161} cy={121} r={8} className="fill-cloud-white/60" />

      {/* A projectile on its arc — the same physics, drawn flat. */}
      <path
        d="M16 296Q140 170 296 252"
        className="fill-none stroke-deep-charcoal/35"
        strokeWidth={3}
        strokeDasharray="9 11"
      />
      <circle
        cx={296}
        cy={252}
        r={15}
        className="fill-energy-orange stroke-deep-charcoal"
        strokeWidth={5}
      />

      <g className="fill-discovery-yellow">
        <path d={sparkle(58, 92)} />
        <path d={sparkle(276, 150)} />
      </g>
    </>
  );
}

/** Chemistry — a lattice and things rising through it. */
function ChemistryMotif() {
  /* One hexagon, six nodes, six bonds. Centre (160, 104), radius 58. */
  const nodes = [
    [218, 104],
    [189, 154.2],
    [131, 154.2],
    [102, 104],
    [131, 53.8],
    [189, 53.8],
  ] as const;

  const bubbles = [
    { cx: 62, cy: 236, r: 15, delay: "0s", duration: "6.5s" },
    { cx: 116, cy: 210, r: 9, delay: "1.4s", duration: "5.5s" },
    { cx: 244, cy: 232, r: 12, delay: "0.7s", duration: "7s" },
    { cx: 272, cy: 196, r: 7, delay: "2.1s", duration: "5s" },
  ];

  return (
    <>
      {/* Liquid. A wavy surface so it does not read as a flat fill. */}
      <path
        d="M0 252Q40 232 80 252T160 252T240 252T320 252V320H0Z"
        className="fill-fun-purple/35"
      />

      {/* Molecule: bonds first, then the nodes on top. */}
      <path
        d={`M${nodes.map((n) => n.join(" ")).join("L")}Z`}
        className="fill-none stroke-deep-charcoal"
        strokeWidth={7}
        strokeLinejoin="round"
      />
      <g
        className="fill-fun-purple stroke-deep-charcoal"
        strokeWidth={5}
        strokeLinecap="round"
      >
        {nodes.map(([cx, cy]) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={11} />
        ))}
      </g>

      {/* Bubbles, each on its own cycle so the cluster never pulses in unison. */}
      {bubbles.map((bubble) => (
        <circle
          key={`${bubble.cx}-${bubble.cy}`}
          cx={bubble.cx}
          cy={bubble.cy}
          r={bubble.r}
          className="motif-bubble fill-cloud-white stroke-deep-charcoal"
          strokeWidth={3}
          style={{
            animationDelay: bubble.delay,
            animationDuration: bubble.duration,
          }}
        />
      ))}

      <g className="fill-discovery-yellow">
        <path d={sparkle(52, 96)} />
      </g>
    </>
  );
}

/** Biology — growth, drawn without a single straight line. */
function BiologyMotif() {
  return (
    <>
      {/* Two cells caught mid-division, in the empty corner the leaf leaves. */}
      <circle
        cx={74}
        cy={74}
        r={30}
        className="fill-science-green/40 stroke-deep-charcoal"
        strokeWidth={5}
      />
      <circle cx={74} cy={74} r={9} className="fill-deep-charcoal/40" />
      <circle
        cx={118}
        cy={74}
        r={30}
        className="fill-science-green/25 stroke-deep-charcoal"
        strokeWidth={5}
      />
      <circle cx={118} cy={74} r={9} className="fill-deep-charcoal/40" />

      {/* The leaf, hinged at its stem end so the whole thing sways. */}
      <g className="motif-leaf">
        <path
          d="M48 272C48 148 148 48 272 48c0 124-100 224-224 224Z"
          className="fill-science-green stroke-deep-charcoal"
          strokeWidth={7}
        />
        {/* Midrib and three side veins, all starting on the midrib. */}
        <path
          d="M48 272Q160 160 272 48"
          className="fill-none stroke-deep-charcoal"
          strokeWidth={6}
          strokeLinecap="round"
        />
        <g
          className="fill-none stroke-deep-charcoal/45"
          strokeWidth={4}
          strokeLinecap="round"
        >
          <path d="M104 216Q126 224 150 214" />
          <path d="M140 180Q162 188 186 178" />
          <path d="M176 144Q198 152 222 142" />
        </g>
      </g>

      <g className="fill-discovery-yellow">
        <path d={sparkle(280, 268)} />
      </g>
    </>
  );
}
