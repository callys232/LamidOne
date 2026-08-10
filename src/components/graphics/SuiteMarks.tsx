/**
 * SUITE MARKS — the four glyphs, as components.
 *
 * These existed only as inline SVG pasted into the design mock, which
 * meant four copies of each per page and no way to change one. They are
 * assets now: one definition each, sized and coloured by the caller.
 *
 * WHY NOT LUCIDE. The rest of the site uses lucide, and should keep
 * doing so for UI affordances — chevrons, arrows, close buttons. These
 * four are different: each is an argument about what its suite does,
 * and a generic icon set has no drawing for "concentric clarity" or
 * "capability that compounds". A borrowed pictogram would say less.
 *
 *   CORE     concentric rings closing on a centre point — a diagnosis
 *            resolving from noise to a single reading.
 *   GROW     a line that climbs through a dip, not a clean 45°, with
 *            the arrow leaving frame. Growth that survives a setback.
 *   TALENT   two figures at different scales, the smaller behind the
 *            larger — a bench, not a headcount.
 *   FINANCE  three ascending bars with the tallest open at the top,
 *            because a forecast is unbounded where a report is not.
 *
 * `currentColor` throughout, so a caller sets colour once on the parent
 * and the mark follows the theme rather than pinning a hex.
 */

type MarkProps = {
  /** Rendered size in px. Square. */
  size?: number;
  className?: string;
};

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true as const,
  focusable: "false" as const,
});

export function CoreMark({ size = 24, className }: MarkProps) {
  return (
    <svg {...base(size)} className={className}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function GrowMark({ size = 24, className }: MarkProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M3 17l6-6 4 4 8-8" />
      <path d="M15 6h6v6" />
    </svg>
  );
}

export function TalentMark({ size = 24, className }: MarkProps) {
  return (
    <svg {...base(size)} className={className}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 20c0-3.6 2.5-6 5.5-6s5.5 2.4 5.5 6" />
      <circle cx="18" cy="9" r="2.4" />
      <path d="M15.5 20c0-2.6 1.6-4.5 3.8-4.8" />
    </svg>
  );
}

export function FinanceMark({ size = 24, className }: MarkProps) {
  return (
    <svg {...base(size)} className={className}>
      <rect x="4" y="12" width="4" height="8" />
      <rect x="10" y="7" width="4" height="13" />
      <path d="M16 20V3h4v17" />
    </svg>
  );
}

/** A tick, drawn to the same weight as the marks above. */
export function CheckMark({ size = 16, className }: MarkProps) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 16 16" fill="none"
      stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true" focusable="false" className={className}
    >
      <path d="M3 8l3.5 3.5L13 4.5" />
    </svg>
  );
}

/** Resolve a mark by suite id. Returns null for anything unmapped, so a
 *  caller falls back rather than rendering the wrong suite's glyph. */
export const SUITE_MARKS: Record<string, (p: MarkProps) => React.ReactElement> = {
  core: CoreMark,
  grow: GrowMark,
  talent: TalentMark,
  finance: FinanceMark,
};
