import { SUITE_MARKS } from "./SuiteMarks";

/**
 * The asset beside each diagnostic row.
 *
 * WHAT IT HAS TO SAY. Every row in that section is a transaction —
 * structured data in, computed result out — and the words already carry
 * it. A decorative panel would just take up half the row. So the
 * graphic states the same thing in a different register: a stack of
 * input lines feeding a marked engine, and a single solid bar coming
 * out of it.
 *
 * The input side is drawn as UNEVEN lines. That is the honest picture
 * of what a user supplies — cost lines of different lengths, some seats
 * with three successors and some with none — and it makes the output
 * bar read as a resolution rather than a fourth input.
 *
 * No numbers or codes. A figure here would be invented, and the module
 * code already sits in the meta line beside "Run it" — printing it in
 * the artwork too rendered it twice in every row.
 */
export function EngineCard({
  suiteId,
  tint,
}: {
  suiteId: string;
  tint: string;
}) {
  const Mark = SUITE_MARKS[suiteId];

  return (
    <div
      className="relative flex h-[190px] w-full items-center justify-center overflow-hidden rounded-2xl sm:h-[210px]"
      style={{
        /* color-mix, not an alpha suffix. `${tint}0F` is 6% opacity —
           over a white card that is a pale wash, over the dark theme's
           midnight it is invisible and the panel loses its frame.
           Mixing against --raised and --line keeps both readable
           because both tokens flip with the theme. */
        background: `color-mix(in srgb, ${tint} 8%, var(--raised))`,
        border: `1px solid color-mix(in srgb, ${tint} 32%, var(--line))`,
      }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 260 120" className="h-full w-full" fill="none">
        {/* Input lines — uneven on purpose. On hover they advance
            toward the engine and brighten, top line first: the stagger
            is what makes five rectangles read as a queue being consumed
            rather than five rectangles sliding. */}
        {[
          { y: 34, w: 46 },
          { y: 48, w: 62 },
          { y: 62, w: 38 },
          { y: 76, w: 54 },
          { y: 90, w: 44 },
        ].map((l, i) => (
          <rect
            key={l.y}
            className="engine-in"
            style={{ transitionDelay: `${i * 55}ms` }}
            x="18"
            y={l.y}
            width={l.w}
            height="4"
            rx="2"
            fill={tint}
            opacity="0.30"
          />
        ))}

        {/* Feed into the engine. The dashes travel on hover — the only
            LOOPING motion in the graphic, and it belongs here because
            feeding is the only part of the transaction that is
            continuous. Everything else resolves and stops. */}
        <path
          className="engine-feed"
          d="M88 62h24"
          stroke={tint}
          strokeWidth="1.5"
          strokeDasharray="3 3"
          opacity="0.55"
        />

        {/* The engine. Swells very slightly — 1.06 about its own centre,
            enough to register as working, not enough to unseat the mark
            pinned over it. */}
        <rect className="engine-core" x="112" y="40" width="44" height="44" rx="12" fill={tint} />

        {/* Out. One solid bar — the computed answer, which extends from
            the engine on hover. It grows from its LEFT edge, so the bar
            reads as being produced by the engine rather than as a shape
            that got wider at both ends. */}
        <path d="M162 62h22" stroke={tint} strokeWidth="1.5" opacity="0.75" />
        <rect className="engine-out" x="188" y="55" width="54" height="14" rx="7" fill={tint} />

      </svg>

      {/* Pinned to the engine block's own centre (x 134/260, y 62/120),
          not centred in the frame — flex centring left it a few pixels
          off the shape it sits on. */}
      <span
        className="absolute -translate-x-1/2 -translate-y-1/2"
        style={{ left: "51.5%", top: "51.7%", color: "#FFFFFF" }}
      >
        {Mark ? <Mark size={22} /> : null}
      </span>
    </div>
  );
}
