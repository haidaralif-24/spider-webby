/**
 * Webby — the SpiderWeb mascot.
 *
 * Hand-rolled inline SVG, not a raster asset and not a Cloudinary upload
 * (AGENTS.md §4.4: mascot, icons and UI art are SVG files in the repo). Inline
 * rather than a file in `public/` so the parts stay animatable with pure CSS and
 * the whole mascot costs one request fewer on mobile data.
 *
 * Server component — zero client JS (AGENTS.md §4.5).
 *
 * Anatomy, in draw order: 8 legs → body → head → goggle strap → lenses → cheeks
 * → mouth → test tube → gripping hand → sparkles. Legs are drawn twice, once in
 * charcoal at a heavier stroke and once in purple on top — that is what gives
 * the cartoon "sticker" outline without a second set of paths.
 *
 * Colour comes from Tailwind theme tokens (`stroke-fun-purple`, `fill-science-green`),
 * never a hex literal, so a palette change stays a one-file edit (AGENTS.md §4.8).
 */

/** Four per side. The second group is the first mirrored across x = 160. */
const LEGS = [
  "M104 168C52 148 36 112 52 88",
  "M92 196C34 190 18 162 26 136",
  "M96 224C40 238 22 264 32 286",
  "M108 246C66 274 56 296 68 306",
  "M216 168C268 148 284 112 268 88",
  "M228 196C286 190 302 162 294 136",
  "M224 224C280 238 298 264 288 286",
  "M212 246C254 274 264 296 252 306",
] as const;

/** A soft four-point sparkle, used twice. Centred on `x`, `y`. */
function sparklePath(x: number, y: number) {
  return `M${x} ${y - 16}l4.2 11.8L${x + 16} ${y}l-11.8 4.2L${x} ${y + 16}l-4.2-11.8L${x - 16} ${y}z`;
}

type WebbyMascotProps = {
  /**
   * Required, never optional. The mascot is meaningful content, not decoration,
   * so a missing description has to be a type error rather than an a11y bug
   * (AGENTS.md §4.9). Same reasoning as `MediaImage`'s `alt` prop.
   */
  alt: string;
  className?: string;
};

export function WebbyMascot({ alt, className }: WebbyMascotProps) {
  return (
    <svg
      viewBox="0 0 320 320"
      role="img"
      aria-label={alt}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>{alt}</title>

      {/* ---- Legs: charcoal outline pass ---- */}
      <g
        className="fill-none stroke-deep-charcoal"
        strokeWidth={25}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {LEGS.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>

      {/* ---- Legs: purple fill pass ---- */}
      <g
        className="fill-none stroke-fun-purple"
        strokeWidth={15}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {LEGS.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>

      {/* ---- Abdomen ---- */}
      <ellipse
        cx={160}
        cy={208}
        rx={76}
        ry={66}
        className="fill-fun-purple stroke-deep-charcoal"
        strokeWidth={7}
      />
      <ellipse cx={160} cy={216} rx={46} ry={38} className="fill-cloud-white/40" />
      <circle cx={146} cy={232} r={6} className="fill-deep-charcoal/15" />
      <circle cx={174} cy={232} r={6} className="fill-deep-charcoal/15" />

      {/* ---- Cephalothorax (the head, in cartoon-spider terms) ---- */}
      <circle
        cx={160}
        cy={112}
        r={58}
        className="fill-fun-purple stroke-deep-charcoal"
        strokeWidth={7}
      />

      {/* ---- Goggle strap, arcing over the forehead ---- */}
      <path
        d="M110 96Q160 62 210 96"
        className="fill-none stroke-deep-charcoal"
        strokeWidth={16}
        strokeLinecap="round"
      />

      {/* ---- Goggle lenses ---- */}
      <circle
        cx={134}
        cy={120}
        r={27}
        className="fill-cloud-white stroke-deep-charcoal"
        strokeWidth={7}
      />
      <circle
        cx={186}
        cy={120}
        r={27}
        className="fill-cloud-white stroke-deep-charcoal"
        strokeWidth={7}
      />
      <circle cx={134} cy={120} r={20} className="fill-curious-blue/25" />
      <circle cx={186} cy={120} r={20} className="fill-curious-blue/25" />

      {/* ---- Eyes, behind the glass ---- */}
      <circle cx={136} cy={124} r={9} className="fill-deep-charcoal" />
      <circle cx={188} cy={124} r={9} className="fill-deep-charcoal" />
      <circle cx={132.5} cy={120} r={3.4} className="fill-cloud-white" />
      <circle cx={184.5} cy={120} r={3.4} className="fill-cloud-white" />

      {/* ---- Glass glints ---- */}
      <path
        d="M120 106Q127 99 137 101"
        className="fill-none stroke-cloud-white"
        strokeWidth={5}
        strokeLinecap="round"
      />
      <path
        d="M172 106Q179 99 189 101"
        className="fill-none stroke-cloud-white"
        strokeWidth={5}
        strokeLinecap="round"
      />

      {/* ---- Cheeks and a grin ---- */}
      <circle cx={124} cy={152} r={8} className="fill-discovery-yellow/70" />
      <circle cx={196} cy={152} r={8} className="fill-discovery-yellow/70" />
      <path
        d="M146 152Q160 168 174 152"
        className="fill-none stroke-deep-charcoal"
        strokeWidth={6}
        strokeLinecap="round"
      />

      {/* ---- Test tube, gripped by the front-right leg ----
       * `.webby-tube` is the hover hook: the stage (see globals.css) bobs this
       * group, and the gripping hand rides along with it because it is inside. */}
      <g className="webby-tube">
        <g transform="translate(272 84) rotate(16)">
          <path
            d="M-13-62L-13-14Q-13 0 0 0Q13 0 13-14L13-62Z"
            className="fill-cloud-white stroke-deep-charcoal"
            strokeWidth={6}
            strokeLinejoin="round"
          />
          {/* Liquid. Drawn inside the glass, so the tube walls stay visible. */}
          <path
            d="M-10-34L-10-14Q-10-3 0-3Q10-3 10-14L10-34Z"
            className="fill-science-green"
          />
          <circle cx={-4} cy={-20} r={3} className="fill-cloud-white/70" />
          <circle cx={4} cy={-12} r={2.2} className="fill-cloud-white/70" />
          {/* Rim */}
          <ellipse
            cx={0}
            cy={-62}
            rx={15}
            ry={5}
            className="fill-cloud-white stroke-deep-charcoal"
            strokeWidth={5}
          />
        </g>
        <circle
          cx={268}
          cy={88}
          r={12}
          className="fill-fun-purple stroke-deep-charcoal"
          strokeWidth={6}
        />
      </g>

      {/* ---- Sparkles ---- */}
      <g className="fill-discovery-yellow">
        <path className="webby-sparkle" d={sparklePath(70, 48)} />
        <path className="webby-sparkle" d={sparklePath(238, 54)} />
      </g>
      <circle cx={252} cy={150} r={6} className="webby-sparkle fill-curious-blue" />
      <circle cx={66} cy={232} r={5} className="webby-sparkle fill-energy-orange" />
    </svg>
  );
}
