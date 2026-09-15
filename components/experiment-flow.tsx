import id from "@/messages/id.json";

/**
 * The experiment flowchart — derived from the steps, never authored.
 *
 * AGENTS.md §4.5 is unusually specific about this component, and every rule below
 * is one of its lines:
 *
 * - **Derived.** It takes the steps and draws them. There is no diagram field in
 *   the author's form, because a hand-drawn diagram would not match the brand,
 *   would not be accessible, and would go stale the moment a step was edited.
 * - **Inline SVG, no diagram library.** A linear chain is a few dozen lines of
 *   arithmetic. React Flow is an interactive graph engine for a problem that is
 *   not a graph, and Mermaid renders client-side with no control over the palette.
 * - **Vertical on mobile, always.** Horizontal only on desktop *and* only at four
 *   steps or fewer, because past that the nodes get too narrow to read.
 * - **Linear only.** No branching, by decision, so the layout has no edge cases.
 * - **Supplementary.** The numbered `<ol>` is the real content; this is a
 *   glanceable summary above it. `role="img"` with a title and description, so a
 *   screen reader gets the list rather than a second reading of the same thing.
 *
 * The two orientations are two SVGs with one shown per breakpoint, rather than
 * one SVG with CSS-driven geometry. SVG has no reflow, and hiding a whole diagram
 * is cheaper and more honest than transforming its insides.
 *
 * No server-only imports: the admin's live preview renders this in the browser.
 */

export type FlowStep = {
  title: string;
  /** Optional, 2–4 words. Falls back to the truncated title. */
  flow_label?: string | null;
};

const VERTICAL = {
  viewWidth: 320,
  nodeX: 30,
  nodeWidth: 260,
  nodeHeight: 56,
  gap: 56,
  pad: 20,
  textX: 78,
  charsPerLine: 26,
} as const;

const HORIZONTAL = {
  nodeWidth: 130,
  nodeHeight: 56,
  gap: 26,
  pad: 20,
  charsPerLine: 12,
} as const;

/** Greedy wrap to at most `maxLines`, ellipsising the overflow. */
function wrap(text: string, maxChars: number, maxLines: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length <= maxChars) {
      line = candidate;
      continue;
    }
    if (line) lines.push(line);
    if (lines.length === maxLines) {
      line = "";
      break;
    }
    line = word;
  }

  if (line && lines.length < maxLines) lines.push(line);

  if (lines.length === 0) return [text.slice(0, maxChars)];

  /* If anything was dropped, mark the last line. */
  const consumed = lines.join(" ").length;
  const original = words.join(" ").length;
  if (consumed < original) {
    const last = lines[lines.length - 1];
    lines[lines.length - 1] =
      last.length >= maxChars ? `${last.slice(0, maxChars - 1)}…` : `${last}…`;
  }

  return lines;
}

/** `flow_label` when the author supplied one, otherwise the step's own title. */
function labelFor(step: FlowStep): string {
  const label = step.flow_label?.trim();
  return label && label.length > 0 ? label : step.title.trim();
}

function ArrowMarker({ id: markerId }: { id: string }) {
  return (
    <marker
      id={markerId}
      viewBox="0 0 10 10"
      refX="8"
      refY="5"
      markerWidth="6"
      markerHeight="6"
      orient="auto-start-reverse"
    >
      <path
        d="M2 1L8 5L2 9"
        fill="none"
        className="stroke-deep-charcoal"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </marker>
  );
}

type FlowProps = {
  steps: readonly FlowStep[];
  /** Node fill, as a `fill-*` utility. Defaults to the neutral section tint. */
  tone?: string;
  className?: string;
};

function VerticalFlow({ steps, tone, className }: FlowProps) {
  const { viewWidth, nodeX, nodeWidth, nodeHeight, gap, pad, textX, charsPerLine } =
    VERTICAL;
  const height = pad * 2 + steps.length * nodeHeight + (steps.length - 1) * gap;
  const markerId = "flow-arrow-vertical";

  return (
    <svg
      viewBox={`0 0 ${viewWidth} ${height}`}
      role="img"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>{id.a11y.flowchartTitle}</title>
      <desc>{id.a11y.flowchartDesc}</desc>
      <defs>
        <ArrowMarker id={markerId} />
      </defs>

      {steps.map((step, index) => {
        const y = pad + index * (nodeHeight + gap);
        const lines = wrap(labelFor(step), charsPerLine, 2);
        const nextY = y + nodeHeight + gap;

        return (
          <g key={`${index}-${step.title}`}>
            {index < steps.length - 1 ? (
              <line
                x1={viewWidth / 2}
                y1={y + nodeHeight}
                x2={viewWidth / 2}
                y2={nextY}
                className="stroke-deep-charcoal"
                strokeWidth={2.5}
                markerEnd={`url(#${markerId})`}
              />
            ) : null}

            <rect
              x={nodeX}
              y={y}
              width={nodeWidth}
              height={nodeHeight}
              rx={16}
              className={`${tone} stroke-deep-charcoal`}
              strokeWidth={3}
            />

            <circle
              cx={nodeX + 26}
              cy={y + nodeHeight / 2}
              r={13}
              className="fill-cloud-white stroke-deep-charcoal"
              strokeWidth={2.5}
            />
            <text
              x={nodeX + 26}
              y={y + nodeHeight / 2}
              textAnchor="middle"
              dominantBaseline="central"
              className="fill-deep-charcoal text-[13px] font-bold"
            >
              {index + 1}
            </text>

            {lines.map((line, lineIndex) => (
              <text
                key={line}
                x={textX}
                y={
                  lines.length === 1
                    ? y + nodeHeight / 2
                    : y + 20 + lineIndex * 18
                }
                dominantBaseline="central"
                className="fill-deep-charcoal text-[14px] font-semibold"
              >
                {line}
              </text>
            ))}
          </g>
        );
      })}
    </svg>
  );
}

function HorizontalFlow({ steps, tone, className }: FlowProps) {
  const { nodeWidth, nodeHeight, gap, pad, charsPerLine } = HORIZONTAL;
  const width =
    pad * 2 + steps.length * nodeWidth + (steps.length - 1) * gap;
  const height = pad * 2 + nodeHeight;
  const markerId = "flow-arrow-horizontal";

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>{id.a11y.flowchartTitle}</title>
      <desc>{id.a11y.flowchartDesc}</desc>
      <defs>
        <ArrowMarker id={markerId} />
      </defs>

      {steps.map((step, index) => {
        const x = pad + index * (nodeWidth + gap);
        const lines = wrap(labelFor(step), charsPerLine, 2);

        return (
          <g key={`${index}-${step.title}`}>
            {index < steps.length - 1 ? (
              <line
                x1={x + nodeWidth}
                y1={pad + nodeHeight / 2}
                x2={x + nodeWidth + gap}
                y2={pad + nodeHeight / 2}
                className="stroke-deep-charcoal"
                strokeWidth={2.5}
                markerEnd={`url(#${markerId})`}
              />
            ) : null}

            <rect
              x={x}
              y={pad}
              width={nodeWidth}
              height={nodeHeight}
              rx={16}
              className={`${tone} stroke-deep-charcoal`}
              strokeWidth={3}
            />

            <circle
              cx={x + 20}
              cy={pad + 16}
              r={11}
              className="fill-cloud-white stroke-deep-charcoal"
              strokeWidth={2.5}
            />
            <text
              x={x + 20}
              y={pad + 16}
              textAnchor="middle"
              dominantBaseline="central"
              className="fill-deep-charcoal text-[12px] font-bold"
            >
              {index + 1}
            </text>

            {lines.map((line, lineIndex) => (
              <text
                key={line}
                x={x + nodeWidth / 2}
                y={
                  lines.length === 1
                    ? pad + 36
                    : pad + 30 + lineIndex * 15
                }
                textAnchor="middle"
                dominantBaseline="central"
                className="fill-deep-charcoal text-[12px] font-semibold"
              >
                {line}
              </text>
            ))}
          </g>
        );
      })}
    </svg>
  );
}

export function ExperimentFlow({
  steps,
  tone = "fill-lab-mist",
  className,
}: FlowProps) {
  if (steps.length === 0) return null;

  /* Horizontal is only allowed on desktop AND only at four steps or fewer
   * (AGENTS.md §4.5). Past four, the vertical form is the only one rendered —
   * not merely the only one shown. */
  const horizontalAllowed = steps.length <= 4;

  return (
    <div className={className}>
      <VerticalFlow
        steps={steps}
        tone={tone}
        className={horizontalAllowed ? "w-full sm:hidden" : "w-full"}
      />
      {horizontalAllowed ? (
        <HorizontalFlow steps={steps} tone={tone} className="hidden w-full sm:block" />
      ) : null}
    </div>
  );
}
