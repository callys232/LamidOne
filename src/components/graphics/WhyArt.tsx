/**
 * Artwork for the three "Why LAMID ONE" cards.
 *
 * Each one draws its card's sentence — so the drawing does the work the
 * words already do, in a register a reader takes in before reading:
 *
 *   unified   four strands, in four colours, converging into one blue.
 *             "One ecosystem, not four disconnected tools" is a claim
 *             about topology, which is a thing a line can show and a
 *             sentence has to assert.
 *   partnership  a measured scale meeting an open curve. The machine
 *             half is regular and tick-marked; the human half is a
 *             single unrepeatable arc. They overlap rather than sit
 *             side by side, because the card says "sharpened by", not
 *             "alongside".
 *   scale     the same glyph at three sizes — "the system doesn't
 *             change shape with headcount, only the view does", drawn
 *             literally. The mark is identical each time and only the
 *             scale moves; three DIFFERENT shapes would contradict the
 *             sentence they sit under.
 *
 * EACH ONE ANSWERS THE SIZE TOGGLE. The cards now change with the
 * segment, so a drawing that stayed fixed while the copy under it
 * changed would be the one element on the card telling a reader their
 * choice did not matter.
 *
 * What changes is a QUANTITY, never the shape — one geometry per card,
 * parameterised. Redrawing them per segment would say LAMID ONE is
 * three products; scaling them says it is one product seen at three
 * sizes, which is the argument the third card makes in words.
 *
 * One frame, one stroke weight, `currentColor` for anything not
 * carrying a suite tint, so the three read as a set.
 */

export type Segment = "solo" | "sme" | "enterprise";
export type WhyArtProps = { segment: Segment };

const box = { viewBox: "0 0 240 96", fill: "none" as const };
const frame = "h-full w-full";

const INDEX: Record<Segment, number> = { solo: 0, sme: 1, enterprise: 2 };

/**
 * Four strands into one.
 *
 * THE ONE PLACE THAT KEEPS THE FOUR COLOURS. Every other accent on the
 * site was unified to the brand blue; these four were too, and are
 * deliberately back. The drawing's entire argument is that four
 * SEPARATE things become one — four identical blue strokes merge into a
 * single band before they reach the junction, drawing the opposite of
 * what the card says. Hue is the only channel that keeps four lines
 * legible as four at this stroke weight. It is also the last thing on
 * the page reading as a palette rather than as decoration: four colours
 * in, one brand blue out, which stops being visible the moment the
 * input matches the output.
 *
 * PER SEGMENT: how many SOURCES feed each strand. One for a solo
 * founder — "one person, four disciplines". Two for an SME's teams.
 * Four for an enterprise's business units. The four strands never
 * change, because the four suites do not.
 */
export function UnifiedArt({ segment }: WhyArtProps) {
  const sources = { solo: 1, sme: 2, enterprise: 4 }[segment];
  const strands = [
    { y: 14, tint: "#0052CC" },
    { y: 38, tint: "#00A86B" },
    { y: 58, tint: "#C75CFF" },
    { y: 82, tint: "#FFB400" },
  ];

  return (
    <svg {...box} className={frame} aria-hidden="true">
      {strands.map((s) => (
        <g key={s.y}>
          <path
            d={`M8 ${s.y}H84C112 ${s.y} 112 48 140 48`}
            stroke={s.tint}
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.85"
          />
          {/* The sources, as beads on the strand's own line — they read
              as things feeding in rather than as a separate legend. */}
          {Array.from({ length: sources }).map((_, i) => (
            <circle key={i} cx={10 + i * 9} cy={s.y} r="2.5" fill={s.tint} />
          ))}
        </g>
      ))}
      {/* The single ecosystem out. */}
      <path d="M140 48h84" stroke="var(--brand)" strokeWidth="5" strokeLinecap="round" />
      <circle cx="140" cy="48" r="5" fill="var(--brand)" />
    </svg>
  );
}

/**
 * A measured scale meeting an open curve.
 *
 * PER SEGMENT: how finely the machine half is graduated. The human arc
 * is one stroke at every size — that is the point of the card, and the
 * half that does not scale.
 */
export function PartnershipArt({ segment }: WhyArtProps) {
  const ticks = { solo: 4, sme: 8, enterprise: 13 }[segment];
  const step = 96 / (ticks - 1);

  return (
    <svg {...box} className={frame} aria-hidden="true">
      {/* Machine: regular, tick-marked, repeatable. */}
      <path d="M8 66h112" stroke="currentColor" strokeWidth="1.5" opacity="0.35" />
      {Array.from({ length: ticks }).map((_, i) => (
        <path
          key={i}
          d={`M${16 + i * step} 66v${i % 2 === 0 ? -14 : -8}`}
          stroke="currentColor"
          strokeWidth="1.5"
          opacity="0.35"
        />
      ))}
      {/* Human: one arc, drawn once, at every size. Overlaps the scale
          rather than sitting beside it — "sharpened by", not
          "alongside". */}
      <path
        d="M40 78C84 78 96 20 152 20c40 0 56 26 80 34"
        stroke="var(--brand)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx="152" cy="20" r="5" fill="var(--brand)" />
    </svg>
  );
}

/**
 * The same mark at three scales.
 *
 * PER SEGMENT: which of the three is lit. This is the drawing that
 * carries the toggle most directly — a reader picking "SME" sees the
 * middle glyph come up and the other two recede, which says "you are
 * here, and the other two are the same system" in one move. The
 * geometry is identical at all three sizes, so the recessive pair are
 * not lesser products; they are the same mark further away.
 */
export function ScaleArt({ segment }: WhyArtProps) {
  const active = INDEX[segment];
  const glyphs = [
    { cx: 40, r: 9 },
    { cx: 112, r: 19 },
    { cx: 200, r: 30 },
  ];

  return (
    <svg {...box} className={frame} aria-hidden="true">
      <path d="M30 48h180" stroke="currentColor" strokeWidth="1.25" opacity="0.2" />
      {glyphs.map((g, i) => {
        const on = i === active;
        return (
          <g key={g.cx} opacity={on ? 1 : 0.22}>
            <circle cx={g.cx} cy="48" r={g.r} stroke="var(--brand)" strokeWidth="2" />
            <circle cx={g.cx} cy="48" r={g.r * 0.45} fill="var(--brand)" />
            {/* A halo on the selected size only — enough to find at a
                glance without changing the mark itself. */}
            {on && (
              <circle
                cx={g.cx}
                cy="48"
                r={g.r + 6}
                stroke="var(--brand)"
                strokeWidth="1"
                opacity="0.4"
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}

export const WHY_ART: Record<string, (p: WhyArtProps) => React.ReactElement> = {
  unified: UnifiedArt,
  partnership: PartnershipArt,
  scale: ScaleArt,
};
