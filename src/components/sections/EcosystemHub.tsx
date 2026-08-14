import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Section } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { HP_ECOSYSTEM } from "@/content/homepage";
import { SUITE_MARKS, CheckMark } from "@/components/graphics/SuiteMarks";
import { SuiteMore, Reveal } from "@/components/sections/SuiteMore";
import { SUITES_BY_ID, type SuiteId } from "@/content/suites";
import { altitudeLabel } from "@/content/strategyLevels";
import { PRIMARY_SUITES } from "@/content/aios";

/**
 * "Four suites. One ecosystem." — the hub grid.
 *
 * CORE, GROW, TALENT and FINANCE are the four SUITES. Engines are the
 * tools inside them — Q44, R01, F04, A22 — not a layer above. aios.ts's
 * `PRIMARY_SUITES` export (renamed from the misleading `ENGINES`) is
 * the suite grouping; do not read the taxonomy off the word "engine".
 *
 * LAYOUT — the split column. Prose on the left, a 2×2 of suites on the
 * right, which is the shape HubSpot's product grid uses and it earns
 * its place here for a specific reason: the heading, the definition of
 * the three levels and the closing line are ONE argument, and stacking
 * them full-width above the cards made a reader traverse all three
 * before reaching the thing they describe. Beside the grid, the
 * argument and its evidence are on screen together.
 *
 * It also rehomes the callout, which used to sit under the grid as a
 * dark band — the last thing on the section and therefore the first
 * thing skipped.
 *
 * Two cards per row rather than four. At four-across each suite gets a
 * name and a sentence, which is a logo wall. At two-across each gets a
 * definition and its strongest claims, which is an argument. Four
 * suites is few enough that a reader will read all of them if each is
 * worth reading.
 *
 * Colour is carried on the mark, the heading, the ticks and the link —
 * never on the card body or its border AT REST. That is the rationing
 * rule from globals.css applied to a section with four accents in it:
 * enough for each suite to own its identity, not so much that the page
 * becomes a paint chart.
 *
 * ON HOVER the ration is spent, deliberately and on one card at a time.
 * The body warms, the border commits to the suite colour, and the card
 * lifts on a tinted shadow (`.card-interactive`, fed by `--suite-tint`).
 * Four cards painted at once would be the paint chart; one card painted
 * because the cursor is on it is the reader choosing where the colour
 * goes. Everything inside answers the same hover — the mark scales, the
 * ticks step in sequence, the dashed rule goes solid, the arrow runs —
 * so the card reads as one object responding, not five.
 */
export function EcosystemHub() {
  return (
    <Section id="ecosystem" tone="tint" className="border-t">
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">

        {/* ── The argument ───────────────────────────────────
            Splits at `lg`, not `md`. TheGap is the section directly
            above and uses the same 5/7 asymmetry from `md` up — two
            consecutive sections adopting one layout at the same
            breakpoint would read as a template rather than as two
            different points. Holding this one back to `lg` means the
            tablet range gets stacked prose over a 2×2, which is a
            different shape from the one above it. */}
        {/* `self-center` against the card column, not the top of it.
            The prose is three short elements now — eyebrow, heading,
            one control — and the grid beside it is two rows of cards.
            Top-aligned, that left a column of dead space under the
            heading roughly as tall as the block itself, which read as
            something having failed to load. Centred, the two columns
            share an optical midline.

            It follows the OPEN state too: expanding the pull-down grows
            this column and it re-centres, which is correct — the block
            stays balanced against the cards at both heights rather
            than being pinned for one of them. */}
        <div className="lg:col-span-5 lg:self-center">
          <p className="eyebrow">{HP_ECOSYSTEM.eyebrow}</p>

          {/* "Four suites." takes the brand gradient — `.text-gradient-
              brand` in globals.css, which sweeps the accent into the
              page's ink across the phrase and is theme-aware by
              construction (--ink flips, so it resolves blue→black on
              light and blue→white on dark from one rule).

              Only the middle beat. The heading states three levels and
              the suites are the one this section is about; colouring
              all three would rank none of them. `pb-[0.08em]` because
              background-clip:text crops to the glyph box, which clips
              the descender on the "p" in "suites" without it. */}
          <h2 className="font-display mt-5 text-[clamp(1.9rem,3.6vw,2.75rem)] font-normal leading-[1.15]">
            {HP_ECOSYSTEM.titleLead}{" "}
            <span className="text-gradient-brand inline-block pb-[0.08em]">
              {HP_ECOSYSTEM.titleEmphasis}
            </span>{" "}
            {HP_ECOSYSTEM.titleTail}
          </h2>

          {/* The two explanatory paragraphs, behind the same pull-down
              the cards use. They are the argument, and as the first
              thing in this column they opened the section with 70 words
              before a single suite was named. */}
          <Reveal paragraphs={[HP_ECOSYSTEM.lead, HP_ECOSYSTEM.callout]} />

          {/* Below the pull-down, not above it. The CTA is the exit
              from this section and the disclosure is optional detail
              within it — putting the button first would ask a reader to
              leave before the section had finished making its case.
              It also means the button does not move when the prose
              opens: it is already the last thing in the column. */}
          <div className="mt-8">
            <Button href={HP_ECOSYSTEM.cta.href} variant="primary">
              {HP_ECOSYSTEM.cta.label}
            </Button>
          </div>
        </div>

        {/* ── The evidence ───────────────────────────────────
            `content-start` so the cards keep their natural height
            instead of stretching to match the prose column, which on a
            short left column would have inflated all four. */}
        <div className="grid content-start gap-5 sm:grid-cols-2 lg:col-span-7">
        {HP_ECOSYSTEM.suites.map((s, i) => {
          const Mark = SUITE_MARKS[s.id];
          const [lead, ...more] = s.checks;
          const primary = PRIMARY_SUITES.find((p) => p.id === s.id);
          return (
            <article
              key={s.id}
              className="card card-interactive group/card relative flex flex-col p-7 sm:p-8"
              style={{
                /* Feeds the whole hover state in globals.css — ground,
                   border and shadow all resolve from this one value, so
                   each card answers in its own suite colour. */
                ["--suite-tint" as string]: s.tint,
                /* The first card carries the raised surface, as in the
                   mock — it anchors the grid without implying CORE is
                   the one to buy. */
                ...(i === 0 ? { background: "var(--surface)" } : null),
              }}
            >
              {/* The mark is the card's face, so it takes the pop: a
                  small scale from its own bottom-left corner, which
                  keeps it pinned to the text below instead of drifting
                  toward it. 1.12 is the ceiling before a 26px glyph
                  starts to look like it is being pushed at the reader. */}
              {Mark && (
                <span className="origin-bottom-left transition-transform duration-200 ease-out group-hover/card:scale-[1.12]">
                  <Mark size={26} className="shrink-0" />
                </span>
              )}

              <h3 className="font-display mt-3.5 text-xl font-semibold" style={{ color: s.tint }}>
                {s.name}
              </h3>
              <p className="faint mt-1 text-[11px] font-semibold uppercase tracking-wide">
                {altitudeLabel(SUITES_BY_ID[s.id as SuiteId].strategyLevel)} strategy
              </p>

              {/* The driver's-seat line — same field, same rule as
                  AltitudeMap's own `inPractice` line on /why-lamid-one,
                  now on the page most readers actually land on. Set in
                  full ink rather than muted grey so it reads as the
                  thing you go and do, not a footnote to the label above
                  it. */}
              {primary && (
                <p className="mt-3 text-[14.5px] font-medium leading-snug">{primary.inPractice}</p>
              )}

              <hr
                className="mt-4 border-0 border-t"
                style={{ borderColor: "var(--line-soft)" }}
              />

              {/* BULLETS ONLY, ONE SHOWING. The card carried a
                  definition paragraph and three full sentences — four
                  cards of it asked a reader to finish an essay before
                  choosing a suite. It is a list now: short phrases, one
                  visible, the rest behind the toggle.

                  Native <details>, so the disclosure costs no client
                  JavaScript and works before hydration — this section
                  is otherwise a server component and worth keeping
                  that way. */}
              <ul className="mt-4 space-y-2.5">
                <li className="flex gap-2.5 text-[14.5px] leading-snug">
                  <span
                    className="mt-[3px] shrink-0 transition-transform duration-200 ease-out group-hover/card:translate-x-[2px]"
                    style={{ color: s.tint }}
                  >
                    <CheckMark />
                  </span>
                  {lead}
                </li>
              </ul>

              {/* The one client-side piece on this card — it animates
                  the card's HEIGHT, which CSS alone cannot do from a
                  collapsed <details>. See SuiteMore.tsx. */}
              {more.length > 0 && (
                <div className="flex-1">
                  <SuiteMore items={more} tint={s.tint} />
                </div>
              )}

              {/* The rule goes solid and takes the suite colour on
                  hover — the card's quietest element, and the one that
                  makes the whole surface feel switched on rather than
                  just tinted. */}
              <hr
                className="my-5 border-0 border-t border-dashed transition-colors duration-200 group-hover/card:border-solid"
                style={{ borderColor: "var(--line)" }}
              />

              {/* This used to stretch over the whole card via
                  `after:inset-0`, so anywhere on the surface was a
                  click through to the suite. That has to go now the
                  card holds a "Read more": an overlay covering the card
                  would swallow the disclosure, and even raised clear of
                  it, a card that is entirely one link AND contains a
                  second control is ambiguous — the reader cannot tell
                  which one they are about to hit.

                  The card still LIFTS on hover, so the affordance is
                  intact; only the click target narrowed to the words
                  that name where it goes. The arrow still runs on the
                  CARD's group, not the link's, so it answers a hover
                  anywhere on the surface. */}
              <Link
                href={s.href}
                className="inline-flex items-center gap-1.5 self-start text-[14.5px] font-bold"
                style={{ color: s.tint }}
              >
                Explore {s.name}
                <ArrowRight
                  className="h-3.5 w-3.5 transition-transform duration-200 ease-out group-hover/card:translate-x-1"
                  aria-hidden="true"
                />
              </Link>
            </article>
          );
        })}
        </div>
      </div>
    </Section>
  );
}
