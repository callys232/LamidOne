/**
 * Artwork for the four routes after a diagnosis.
 *
 * Each drawing states its route's mechanism, not its mood — the brief
 * for every one was "what would a diagram of this actually show":
 *
 *   self      one operator, one loop. The arrow returns to where it
 *             started, because the point of this route is that the
 *             second run is a comparison rather than a restart.
 *   sourced   candidates as bars of unequal length with one lifted and
 *             ticked. Scoring produces a RANK, so the bars must differ;
 *             equal bars would draw a directory, which is the thing
 *             this route is explicitly not.
 *   managed   hub and spokes, the hub filled. One named person holding
 *             the engines, the specialists and the milestones.
 *   growth    a stepped climb with two deferred options faded below it.
 *             The deferred pair is the honest half: this route
 *             sequences under capacity, so something is always left.
 *
 * All four share a 260×120 frame, one accent, and the same stroke
 * weights, so they read as a set rather than four illustrations.
 * `currentColor` is not used — each takes its route tint explicitly,
 * because these sit on a tinted panel where inheriting would make them
 * disappear.
 */

type ArtProps = { tint: string };

const frame = "h-full w-full";
const box = { viewBox: "0 0 260 120", fill: "none" as const };

/** 01 — Run it yourself. One operator, one closed loop. */
export function SelfArt({ tint }: ArtProps) {
  return (
    <svg {...box} className={frame} aria-hidden="true">
      <circle cx="60" cy="60" r="18" fill={tint} opacity="0.16" />
      <circle cx="60" cy="60" r="7" fill={tint} />
      {/* Out to the result… */}
      <path d="M86 60h58" stroke={tint} strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />
      <rect x="150" y="46" width="62" height="12" rx="6" fill={tint} />
      <rect x="150" y="64" width="40" height="12" rx="6" fill={tint} opacity="0.4" />
      {/* …and back again. The loop is the argument. */}
      <path
        d="M206 84c0 14-30 22-76 22S54 96 54 82"
        stroke={tint} strokeWidth="1.5" opacity="0.55" strokeLinecap="round"
      />
      <path d="M54 88l-5-7 10-1z" fill={tint} opacity="0.75" />
    </svg>
  );
}

/** 02 — Bring in a specialist. Candidates, ranked. */
export function SourcedArt({ tint }: ArtProps) {
  const rows = [
    { y: 30, w: 108, op: 1, top: true },
    { y: 52, w: 84, op: 0.45 },
    { y: 74, w: 66, op: 0.32 },
    { y: 96, w: 48, op: 0.22 },
  ];
  return (
    <svg {...box} className={frame} aria-hidden="true">
      {rows.map((r) => (
        <g key={r.y}>
          <circle cx="34" cy={r.y + 6} r="7" fill={tint} opacity={r.op} />
          <rect x="50" y={r.y} width={r.w} height="12" rx="6" fill={tint} opacity={r.op} />
        </g>
      ))}
      {/* The top match, ticked. */}
      <circle cx="180" cy="36" r="11" fill={tint} />
      <path d="M175 36l3.5 3.5L186 32.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** 03 — A dedicated manager. One hub, many strands. */
export function ManagedArt({ tint }: ArtProps) {
  const spokes = [
    { x: 46, y: 26 }, { x: 46, y: 94 },
    { x: 214, y: 26 }, { x: 214, y: 94 },
    { x: 130, y: 18 }, { x: 130, y: 102 },
  ];
  return (
    <svg {...box} className={frame} aria-hidden="true">
      {spokes.map((s) => (
        <g key={`${s.x}-${s.y}`}>
          <path d={`M130 60L${s.x} ${s.y}`} stroke={tint} strokeWidth="1.25" opacity="0.4" />
          <circle cx={s.x} cy={s.y} r="7" fill={tint} opacity="0.42" />
        </g>
      ))}
      <circle cx="130" cy="60" r="21" fill={tint} opacity="0.18" />
      <circle cx="130" cy="60" r="13" fill={tint} />
    </svg>
  );
}

/** 04 — A growth pathway. Sequenced, with what was deferred. */
export function GrowthArt({ tint }: ArtProps) {
  const steps = [
    { x: 34, y: 84, h: 20 },
    { x: 78, y: 68, h: 36 },
    { x: 122, y: 48, h: 56 },
    { x: 166, y: 28, h: 76 },
  ];
  return (
    <svg {...box} className={frame} aria-hidden="true">
      {steps.map((s, i) => (
        <rect
          key={s.x} x={s.x} y={s.y} width="30" height={s.h} rx="6"
          fill={tint} opacity={0.35 + i * 0.22}
        />
      ))}
      <path
        d="M40 78l44-16 44-20 44-20"
        stroke={tint} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      />
      <circle cx="172" cy="22" r="4.5" fill={tint} />

      {/* Deferred — present, and visibly not selected. */}
      <rect x="212" y="72" width="34" height="9" rx="4.5" fill={tint} opacity="0.22" />
      <rect x="212" y="87" width="26" height="9" rx="4.5" fill={tint} opacity="0.16" />
    </svg>
  );
}

export const ROUTE_ART: Record<string, (p: ArtProps) => React.ReactElement> = {
  self: SelfArt,
  sourced: SourcedArt,
  managed: ManagedArt,
  growth: GrowthArt,
};
