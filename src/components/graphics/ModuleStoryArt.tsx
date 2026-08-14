/**
 * Artwork for the module-page story slider (ModuleStory.tsx).
 *
 * Same house rules as ShowcaseArt.tsx, because these sit one section
 * away from it on the same suite page and must read as the same set:
 *   · one viewBox, one stroke weight (2 for the subject, 1.25 for
 *     structure, 0.25 opacity)
 *   · `var(--brand)` for the subject, `currentColor` at low opacity
 *     for anything the eye should not stop on
 *   · no invented numbers, no labels, no fake percentages
 *   · nothing depends on the tint — one blue palette
 *
 * Each drawing argues its slide's sentence rather than decorating it.
 * CORE's own diagnostic slide reuses `CoreArt` from ShowcaseArt.tsx
 * outright rather than drawing a second, near-identical bar chart —
 * the sentence it sits under ("run one, and you see what's driving
 * performance... and what to fix first") is the same claim CoreArt
 * already makes on the homepage.
 */

const box = { viewBox: "0 0 260 150", fill: "none" as const };
const frame = "h-full w-full";
const RULE = { stroke: "currentColor", strokeWidth: 1.25, opacity: 0.25 };

/**
 * GAP — "You're still deciding without a system behind you."
 *
 * The decision itself, drawn as an open diamond, with the inputs
 * around it as short strokes that stop short of reaching it. Nothing
 * connects because there is no system — the fragments are the
 * scattered accounts a decision usually has to be pieced together
 * from, and the diamond is the decision nothing here is actually
 * feeding.
 */
export function GapArt() {
  return (
    <svg {...box} className={frame} aria-hidden="true">
      <rect x="112" y="52" width="36" height="36" rx="4" transform="rotate(45 130 70)" stroke="var(--brand)" strokeWidth="2" />
      <path d="M34 38h28" {...RULE} />
      <path d="M32 112h30" {...RULE} />
      <path d="M196 40h26" {...RULE} />
      <path d="M198 114h26" {...RULE} />
      <path d="M56 78h20" {...RULE} />
      <path d="M186 78h20" {...RULE} />
    </svg>
  );
}

/**
 * CLARITY — "Organisations don't fail because they lack strategy.
 * They fail because they lack clarity."
 *
 * The path is drawn whole, start to end — the strategy is there. A
 * translucent block sits over the middle third of it, not erasing the
 * line but obscuring the reader's view of it. Strategy exists;
 * clarity is the thing missing.
 */
export function ClarityArt() {
  return (
    <svg {...box} className={frame} aria-hidden="true">
      <path d="M24 100 L236 50" stroke="var(--brand)" strokeWidth="2" strokeLinecap="round" />
      <circle cx="24" cy="100" r="4" fill="var(--brand)" />
      <circle cx="236" cy="50" r="4" fill="var(--brand)" />
      <rect x="94" y="28" width="82" height="94" rx="14" fill="currentColor" opacity="0.12" />
    </svg>
  );
}

/**
 * FOUNDATION — "Every other suite in LAMID ONE builds on what you
 * find here first."
 *
 * One solid node, three lines out to three open ones at different
 * heights. Not labelled GROW/TALENT/FINANCE — the topology is the
 * claim (one source, three suites drawing from it), not the names.
 */
export function FoundationArt() {
  const targets = [34, 75, 116];
  return (
    <svg {...box} className={frame} aria-hidden="true">
      <circle cx="38" cy="75" r="10" fill="var(--brand)" />
      {targets.map((y) => (
        <g key={y}>
          <path d={`M50 75 L202 ${y}`} stroke="var(--brand)" strokeWidth="1.5" opacity="0.5" />
          <circle cx="214" cy={y} r="8" stroke="var(--brand)" strokeWidth="2" />
        </g>
      ))}
    </svg>
  );
}
