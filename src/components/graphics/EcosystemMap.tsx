/**
 * The ecosystem's own shape, drawn as faint line work behind the
 * closing band.
 *
 * WHAT IT DRAWS. The three levels the page has just spent a section
 * defining, as a map: one ecosystem node, branching to four suites,
 * branching to the tools inside them. It is the sitemap of the product
 * and of the page at the same time — a reader arriving at the final ask
 * sees the structure of what they are being asked to enter, without
 * another paragraph explaining it.
 *
 * WHY IT CAN BE THIS FAINT. It is not carrying information; the section
 * above carried it. This is RECOGNITION — the same shape a second time,
 * at the moment of the ask. Anything legible enough to read here would
 * compete with the one CTA the band exists to hold, which is the only
 * thing on this band that must be read.
 *
 * White, not a token: the band is brand blue in both themes, so its
 * foreground must not flip with the theme either.
 *
 * `slice` rather than `meet`, so the map fills the band at any width
 * and crops at the edges instead of letter-boxing into a strip down the
 * middle. The interesting part — the branching — is centre-left, so
 * cropping takes tool nodes off the right edge, which costs nothing.
 */

const NODE = "#FFFFFF";

/**
 * Four suites, each with a few tools.
 *
 * DELIBERATELY SPARSE. The first pass drew 22 tool nodes, which at this
 * opacity stopped reading as a structure and started reading as noise
 * behind the text — the branching, which is the only part worth
 * recognising, was lost in it. Three tools a suite is enough to say
 * "and there are more of these"; drawing the real count would be a
 * texture, not a map.
 */
const SUITES = [
  { y: 90, tools: 3 },
  { y: 170, tools: 2 },
  { y: 250, tools: 3 },
  { y: 330, tools: 2 },
];

const ORIGIN = { x: 150, y: 210 };
const SUITE_X = 620;
const TOOL_X0 = 900;

export function EcosystemMap() {
  return (
    <svg
      viewBox="0 0 1440 420"
      preserveAspectRatio="xMidYMid slice"
      className="h-full w-full"
      fill="none"
      aria-hidden="true"
      /* ONE OPACITY FOR THE WHOLE MAP, on the root rather than folded
         into each stroke. The values inside are relative weights — the
         origin heavier than the suites, the suites heavier than the
         tool lines — and that hierarchy is what makes the shape
         readable at all. Dimming here scales all of them together and
         keeps it; dimming them individually would flatten the map into
         one grey wash at the first adjustment.

         It is also the single number to turn if this ever needs to be
         fainter or stronger again. */
      style={{ opacity: 0.32 }}
    >
      {/* Ecosystem → suite. Cubic curves with both control points on
          the midline, so the four branches leave the origin as one
          bundle and separate late — a hub feeding four, rather than
          four lines that happen to touch. */}
      {SUITES.map((s) => (
        <path
          key={`branch-${s.y}`}
          d={`M${ORIGIN.x} ${ORIGIN.y}C${(ORIGIN.x + SUITE_X) / 2} ${ORIGIN.y} ${(ORIGIN.x + SUITE_X) / 2} ${s.y} ${SUITE_X} ${s.y}`}
          stroke={NODE}
          strokeWidth="1.5"
          opacity="0.22"
        />
      ))}

      {/* Suite → tools. Short, straight, evenly pitched: past the suite
          level the structure stops branching and starts listing. */}
      {SUITES.map((s) =>
        Array.from({ length: s.tools }).map((_, i) => {
          const spread = (i - (s.tools - 1) / 2) * 34;
          const x = TOOL_X0 + 80 + i * 150;
          return (
            <g key={`tool-${s.y}-${i}`}>
              <path
                d={`M${SUITE_X} ${s.y}L${x} ${s.y + spread}`}
                stroke={NODE}
                strokeWidth="1"
                opacity="0.08"
              />
              <circle cx={x} cy={s.y + spread} r="3.5" fill={NODE} opacity="0.22" />
            </g>
          );
        }),
      )}

      {/* The four suites. */}
      {SUITES.map((s) => (
        <g key={`suite-${s.y}`}>
          <circle cx={SUITE_X} cy={s.y} r="11" fill={NODE} opacity="0.4" />
          <circle cx={SUITE_X} cy={s.y} r="20" stroke={NODE} strokeWidth="1" opacity="0.25" />
        </g>
      ))}

      {/* The ecosystem — the one node everything else hangs off, and the
          only one drawn twice over: a solid centre and two rings, so it
          reads as the origin at a glance even at this opacity. */}
      <circle cx={ORIGIN.x} cy={ORIGIN.y} r="16" fill={NODE} opacity="0.5" />
      <circle cx={ORIGIN.x} cy={ORIGIN.y} r="30" stroke={NODE} strokeWidth="1.25" opacity="0.3" />
      <circle cx={ORIGIN.x} cy={ORIGIN.y} r="48" stroke={NODE} strokeWidth="1" opacity="0.16" />
    </svg>
  );
}
