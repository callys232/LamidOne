/**
 * The diagrams inside the suite showcase panels.
 *
 * WHAT REPLACED WHAT. The showcase's artwork was three offset
 * rectangles — a wash, a solid, and a neutral card carrying the suite's
 * name in small italics. It looked like a product screenshot from a
 * distance and resolved into nothing at reading distance, which is the
 * worst outcome for the largest graphic on the page: it occupies half
 * the section and spends it on texture.
 *
 * Each slide now draws its own VERB, because the four titles are verbs
 * and that is the whole structure of the section — CORE finds it, GROW
 * sequences it, TALENT staffs it, FINANCE prices it. A reader who looks
 * at the picture instead of reading the paragraph should still come
 * away with the mechanism.
 *
 * HOUSE RULES, so four drawings read as one set:
 *   · one viewBox, one stroke weight (2 for subjects, 1.25 for
 *     structure), one corner radius
 *   · `var(--brand)` for the subject, `currentColor` at low opacity for
 *     axes, rules and anything the eye should not stop on
 *   · no invented numbers, no axis labels, no fake percentages — the
 *     shapes carry the argument and a figure here would be the only
 *     fabricated number on the site
 *   · nothing depends on the tint, since the palette is one blue
 */

const box = { viewBox: "0 0 260 150", fill: "none" as const };
const frame = "h-full w-full";

/** Structural ink — axes, baselines, anything recessive. */
const RULE = { stroke: "currentColor", strokeWidth: 1.25, opacity: 0.25 };

/**
 * CORE FINDS IT — a baseline, and the one reading that breaks it.
 *
 * A row of bars against a dashed threshold: most sit under it, one
 * crosses and is marked. That is what a diagnostic returns — not a
 * verdict on everything, but the specific place the business is out of
 * line. The bars are uneven and unlabelled on purpose; labelling them
 * would invent categories the engine does not have.
 */
export function CoreArt() {
  const bars = [26, 44, 34, 58, 30, 72, 38, 48];
  return (
    <svg {...box} className={frame} aria-hidden="true">
      <path d="M22 118h216" {...RULE} />
      {/* The threshold the diagnostic measures against. */}
      <path d="M22 56h216" stroke="var(--brand)" strokeWidth="1.25" strokeDasharray="4 4" opacity="0.45" />
      {bars.map((h, i) => {
        const x = 30 + i * 26;
        const over = h > 62;
        return (
          <rect
            key={i}
            x={x}
            y={118 - h}
            width="14"
            height={h}
            rx="3"
            fill="var(--brand)"
            opacity={over ? 1 : 0.28}
          />
        );
      })}
      {/* The finding, ringed. */}
      <circle cx="167" cy="46" r="9" stroke="var(--brand)" strokeWidth="2" />
      <path d="M167 32V20" stroke="var(--brand)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/**
 * GROW SEQUENCES IT — an order, and what fell out of it.
 *
 * Three blocks on the line in sequence, connected, and a fourth sitting
 * below it greyed. "Which options you can resource, in what order, and
 * what gets deferred and why" — the deferred one has to be visible or
 * the drawing shows a plan rather than a decision.
 */
export function GrowArt() {
  const seq = [0, 1, 2];
  return (
    <svg {...box} className={frame} aria-hidden="true">
      <path d="M22 58h216" {...RULE} />
      {seq.map((i) => {
        const x = 34 + i * 72;
        return (
          <g key={i}>
            <rect x={x} y="36" width="48" height="44" rx="8" fill="var(--brand)" />
            {i < 2 && (
              <path
                d={`M${x + 54} 58h12`}
                stroke="var(--brand)"
                strokeWidth="2"
                strokeLinecap="round"
              />
            )}
          </g>
        );
      })}
      {/* Deferred — same shape, off the line, dashed. */}
      <rect
        x="34"
        y="104"
        width="48"
        height="30"
        rx="8"
        stroke="var(--brand)"
        strokeWidth="1.5"
        strokeDasharray="5 4"
        opacity="0.45"
      />
      <path d="M58 96V84" {...RULE} strokeDasharray="3 3" />
    </svg>
  );
}

/**
 * TALENT STAFFS IT — seats, filled and unfilled.
 *
 * Four seats on the sequence above: three carry a person already in the
 * business, one is open and drawn as a ranked shortlist arriving from
 * outside. That is the card's actual claim — capability inside, the
 * marketplace outside, and the join between them.
 */
export function TalentArt() {
  const seats = [0, 1, 2, 3];
  return (
    <svg {...box} className={frame} aria-hidden="true">
      <path d="M22 44h216" {...RULE} />
      {seats.map((i) => {
        const x = 40 + i * 58;
        const filled = i < 3;
        return (
          <g key={i}>
            {/* The seat. */}
            <rect
              x={x - 16}
              y="28"
              width="32"
              height="32"
              rx="9"
              stroke="var(--brand)"
              strokeWidth={filled ? 0 : 1.5}
              fill={filled ? "var(--brand)" : "none"}
              strokeDasharray={filled ? undefined : "5 4"}
              opacity={filled ? 1 : 0.5}
            />
          </g>
        );
      })}
      {/* The shortlist, ranked, feeding the open seat. */}
      {[0, 1, 2].map((i) => (
        <rect
          key={i}
          x="150"
          y={86 + i * 18}
          width={72 - i * 16}
          height="10"
          rx="5"
          fill="var(--brand)"
          opacity={0.85 - i * 0.25}
        />
      ))}
      <path
        d="M214 78V64"
        stroke="var(--brand)"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * FINANCE PRICES IT — a cost stack, and where it lands.
 *
 * Segments accumulating into one column against a target line, with the
 * forecast running past it. Costing the sequence and modelling what it
 * does to enterprise value, in the only two marks that say it: a total
 * built from parts, and a line that continues after the parts stop.
 */
export function FinanceArt() {
  const segs = [30, 22, 16, 12];
  let y = 118;
  return (
    <svg {...box} className={frame} aria-hidden="true">
      <path d="M22 118h216" {...RULE} />
      {/* The stack — parts summing to a total. */}
      {segs.map((h, i) => {
        y -= h + 2;
        return (
          <rect
            key={i}
            x="34"
            y={y}
            width="40"
            height={h}
            rx="3"
            fill="var(--brand)"
            opacity={1 - i * 0.2}
          />
        );
      })}
      {/* The target it is measured against. */}
      <path d="M22 42h216" stroke="var(--brand)" strokeWidth="1.25" strokeDasharray="4 4" opacity="0.45" />
      {/* The forecast, continuing past the stack. */}
      <path
        d="M92 104C124 104 130 66 162 60c26-5 44 6 70 -10"
        stroke="var(--brand)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx="232" cy="50" r="5" fill="var(--brand)" />
    </svg>
  );
}

export const SHOWCASE_ART: Record<string, () => React.ReactElement> = {
  core: CoreArt,
  grow: GrowArt,
  talent: TalentArt,
  finance: FinanceArt,
};

/* ───────────────────────────────────────────────────────────────
   BACKING MARKS — the saturated panel behind the canvas
   ───────────────────────────────────────────────────────────────

   The middle panel is the only fully saturated surface in the section
   and it was a flat gradient, which made the deck read as one detailed
   card sitting on two blanks.

   These are the ECHO of the front diagram, not a second drawing: the
   same motif, stripped to its structure and drawn in white at low
   opacity. That is why they are simpler than they could be — a panel
   that is 60% obscured by the card in front of it cannot carry
   information, so it carries RHYTHM. Reading them is not the point;
   recognising that the card underneath is the same kind of object is.

   White rather than a token, because this panel is brand blue in both
   themes — it is one of the few surfaces on the site whose background
   does not flip, so its foreground must not either. */
const INK = { stroke: "#FFFFFF", strokeLinecap: "round" as const, fill: "none" };
const backBox = { viewBox: "0 0 160 210", fill: "none" as const };

/** CORE — a scan: rules, and a step that crosses one of them. */
function CoreBacking() {
  return (
    <svg {...backBox} className="h-full w-full" preserveAspectRatio="none" aria-hidden="true">
      {[40, 80, 120, 160].map((y) => (
        <path key={y} d={`M16 ${y}h128`} {...INK} strokeWidth="1" opacity="0.18" />
      ))}
      <path d="M16 150l26-14 26 8 26-46 26 12 24-30" {...INK} strokeWidth="2" opacity="0.55" />
      <circle cx="118" cy="90" r="4" fill="#FFFFFF" opacity="0.8" />
    </svg>
  );
}

/** GROW — a sequence: three steps climbing, one dropped. */
function GrowBacking() {
  return (
    <svg {...backBox} className="h-full w-full" preserveAspectRatio="none" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <rect
          key={i}
          x={22 + i * 40}
          y={132 - i * 26}
          width="26"
          height={30 + i * 26}
          rx="4"
          fill="#FFFFFF"
          opacity={0.22 + i * 0.12}
        />
      ))}
      <path d="M16 176h128" {...INK} strokeWidth="1" opacity="0.25" />
      <path d="M22 44h44" {...INK} strokeWidth="2" strokeDasharray="5 5" opacity="0.4" />
    </svg>
  );
}

/** TALENT — seats, and the one still open. */
function TalentBacking() {
  return (
    <svg {...backBox} className="h-full w-full" preserveAspectRatio="none" aria-hidden="true">
      {[0, 1, 2, 3].map((r) =>
        [0, 1, 2].map((c) => {
          const open = r === 1 && c === 2;
          return (
            <circle
              key={`${r}-${c}`}
              cx={34 + c * 46}
              cy={44 + r * 42}
              r="7"
              fill={open ? "none" : "#FFFFFF"}
              stroke={open ? "#FFFFFF" : undefined}
              strokeWidth={open ? 2 : undefined}
              strokeDasharray={open ? "4 3" : undefined}
              opacity={open ? 0.75 : 0.2 + (r % 2) * 0.1}
            />
          );
        }),
      )}
    </svg>
  );
}

/** FINANCE — a stack, and a line that carries on past it. */
function FinanceBacking() {
  return (
    <svg {...backBox} className="h-full w-full" preserveAspectRatio="none" aria-hidden="true">
      {[0, 1, 2, 3].map((i) => (
        <rect
          key={i}
          x="24"
          y={158 - i * 26}
          width="34"
          height="22"
          rx="3"
          fill="#FFFFFF"
          opacity={0.3 - i * 0.05}
        />
      ))}
      <path d="M16 180h128" {...INK} strokeWidth="1" opacity="0.25" />
      <path d="M70 150c26 0 30-44 46-56 12-9 20-6 28-14" {...INK} strokeWidth="2" opacity="0.6" />
      <circle cx="144" cy="80" r="4" fill="#FFFFFF" opacity="0.85" />
    </svg>
  );
}

export const SHOWCASE_BACKING: Record<string, () => React.ReactElement> = {
  core: CoreBacking,
  grow: GrowBacking,
  talent: TalentBacking,
  finance: FinanceBacking,
};
