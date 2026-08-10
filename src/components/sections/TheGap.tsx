import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Section } from "@/components/ui/Section";
import { HP_GAP, HP_ECOSYSTEM } from "@/content/homepage";
import { SUITE_MARKS } from "@/components/graphics/SuiteMarks";

/**
 * THE GAP — the blind spots, grouped by the suite that watches each.
 *
 * WHY GROUPED AND NOT LISTED. The first version was a flat list of
 * seven with a suite tag on each row, which read "Core, Core, Grow,
 * Grow, Talent, Finance, Finance" down the rail. The repetition was
 * noise: the same four words over and over, and the reader still had to
 * assemble the structure themselves.
 *
 * Grouped, the seven become a COVERAGE MAP. Four cells, every blind
 * spot inside one of them, none left over — which is the claim the
 * section makes ("one system that sees the whole enterprise") shown
 * rather than asserted, on the same screen it is made. It also gives
 * each suite a visible remit before the suite section names it, so that
 * section lands as a consequence rather than a product tour.
 *
 * The counts are deliberately uneven — 2 / 2 / 1 / 2. Padding them to
 * an even grid would mean inventing a blind spot to fill TALENT, and a
 * lopsided honest map is better than a tidy invented one.
 *
 * Grouping happens here rather than in the content file so HP_GAP stays
 * a flat list that is easy to reorder or extend; tints and names come
 * from HP_ECOSYSTEM so this can never disagree with the section below.
 */
export function TheGap() {
  const grouped = HP_ECOSYSTEM.suites
    .map((suite) => ({
      suite,
      spots: HP_GAP.fragments.filter((f) => f.watchedBy === suite.id),
    }))
    .filter((g) => g.spots.length > 0);

  return (
    <Section id="gap" className="border-t">
      {/* FULL WIDTH, NOT A SPLIT COLUMN — and the reason is the section
          below. EcosystemHub runs prose beside a 2×2 of cards; this ran
          prose beside a 2×2 of cards. Two consecutive sections in the
          same shape read as one template applied twice rather than as
          two separate points, and the reader stops looking.

          Laid out as a MAP it also argues better. The claim is coverage
          — seven blind spots, four suites, none left over — and four
          cells in a single row lets a reader verify that in one glance
          instead of scanning a 2×2 and counting. The heading keeps its
          own measure above it so the line length stays readable at full
          width. */}
      <div className="max-w-2xl">
        <p className="eyebrow">{HP_GAP.eyebrow}</p>
        <h2 className="font-display mt-5 text-[clamp(1.9rem,3.6vw,2.75rem)] font-normal leading-[1.15]">
          {HP_GAP.title}
        </h2>
        <p className="lead mt-5">{HP_GAP.lead}</p>
      </div>

      <div className="mt-11">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {grouped.map(({ suite, spots }) => {
            const Mark = SUITE_MARKS[suite.id];
            return (
              /* Each cell now links to the suite that watches its blind
                 spots. These were deliberately inert — the reasoning
                 being that a coverage cell had nowhere useful to go —
                 but that was wrong in one specific way: a reader who
                 recognises their own business in "market access
                 barriers" has formed an intent RIGHT THERE, and making
                 them carry it two sections down to the ecosystem grid
                 to act on it is friction with nothing bought by it.

                 The lift already implied a click and did not honour
                 one, which is the worse of the two states to be in. */
              <Link
                key={suite.id}
                href={suite.href}
                className="card card-interactive group/spot flex flex-col p-6"
                style={{
                  borderTop: `3px solid ${suite.tint}`,
                  ["--suite-tint" as string]: suite.tint,
                }}
              >
                <p
                  className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em]"
                  style={{ color: suite.tint }}
                >
                  {Mark && (
                    <span className="transition-transform duration-200 ease-out group-hover/spot:scale-125">
                      <Mark size={15} />
                    </span>
                  )}
                  {suite.name}
                </p>

                {/* The dots swell rather than move. A blind spot is a
                    thing being SEEN here, and the dots are the only
                    element on the card that can carry that without the
                    text shifting under the reader's eye. */}
                <ul className="mt-4 flex-1 space-y-2.5">
                  {spots.map((s, n) => (
                    <li key={s.name} className="flex gap-2.5 text-[15px] leading-snug">
                      <span
                        className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full transition-transform duration-200 ease-out group-hover/spot:scale-[1.6]"
                        style={{ background: suite.tint, transitionDelay: `${n * 60}ms` }}
                        aria-hidden="true"
                      />
                      {s.name}
                    </li>
                  ))}
                </ul>

                {/* Bottom left, on its own line. The `flex-1` on the
                    list above is what pins it there: the four cells
                    hold 2, 2, 1 and 2 spots, so without it the arrow
                    would float to wherever each list happened to end
                    and the row would have four different baselines.

                    Left rather than right because every other line in
                    the cell starts at the left margin — the suite name,
                    each blind spot — so an arrow on the right edge is
                    the only element a reader's eye has to travel for.
                    The link's accessible name is still the cell's own
                    text, so the glyph stays decorative. */}
                <ArrowRight
                  className="mt-5 h-4 w-4 transition-transform duration-200 ease-out group-hover/spot:translate-x-1.5"
                  style={{ color: suite.tint }}
                  aria-hidden="true"
                />
              </Link>
            );
          })}
        </div>

        {/* The count, stated plainly — the whole argument in one line,
            and derived, so adding a fragment to HP_GAP cannot leave it
            stale. It sat above the cells when this was a split column,
            where it asked the reader to take the coverage on trust.
            Under the row it reads as the caption to a map they have
            just looked at, which is the only position where "none left
            over" is something they have already verified.

            "None left over" closed it and has been cut — the two counts
            beside each other already say it, and the phrase was doing
            emphasis rather than work. */}
        <p className="faint mt-6 text-sm leading-relaxed">
          {HP_GAP.fragments.length} blind spots. {grouped.length} suites watching them.
        </p>
      </div>

      {/* The thesis, held back until the reader has seen the map. */}
      <p
        className="font-display mt-14 border-t pt-10 text-[clamp(1.25rem,2.4vw,1.75rem)] leading-snug"
        style={{ borderColor: "var(--line)" }}
      >
        {HP_GAP.thesis}
      </p>
    </Section>
  );
}
