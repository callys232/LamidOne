import Link from "next/link";
import { Section, SectionHeading } from "@/components/ui/Section";
import { STRATEGY_LEVELS, type StrategyLevel } from "@/content/strategyLevels";
import { CORE, GROW, TALENT, FINANCE, type Suite } from "@/content/suites";

/**
 * The altitude map — one glance at all four levels of strategy and
 * which suite answers each one.
 *
 * Card-language, not a literal pyramid: this site's own design rule
 * (see Section.tsx) is that sections separate by whitespace and a
 * hairline, never a stacked illustration. Four cards in reading order
 * (corporate, business, functional, operational) carry the same
 * information a pyramid diagram would — who sits at that altitude,
 * what they decide, which suite answers it — without introducing a
 * second visual system alongside the tinted-card one already in use
 * everywhere else on the site.
 *
 * The description text (strategyLevels.ts) keeps the source pyramid's
 * own two-sentence rhythm rather than being rewritten into this site's
 * usual terse fragments — an opening clause naming the scope, then "It
 * involves decisions regarding/related to…" naming the decision. Same
 * shape, all four cards, so the parallel reads as one framework.
 *
 * `inPractice` is the second half every card needs and the pyramid
 * never had to provide: the definition explains what the altitude
 * IS, but says nothing about how a reader gets there. Without it this
 * section taught taxonomy, not capability — accurate, but not a reason
 * to believe LAMID ONE is where you'd go operate at that altitude.
 *
 * Only the four primary suites are named, matching the homepage's own
 * rule (HP_WHY / EcosystemHub): the four sub-suites fold into their
 * parent rather than getting a ninth, tenth name on a page that has
 * already said "four suites".
 */

const ORDER: StrategyLevel[] = ["corporate", "business", "functional", "operational"];
const PRIMARY_SUITES: Suite[] = [CORE, GROW, TALENT, FINANCE];

export function AltitudeMap() {
  return (
    <Section id="altitude" className="border-t">
      <SectionHeading
        eyebrow="Strategic altitude"
        title="Four levels of strategy. A suite for each one."
        blurb="Most tools answer one altitude and call the whole thing strategy. Here's which suite answers which — and why CORE is the one exception, built to run at two of them at once."
      />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {ORDER.map((level) => {
          const def = STRATEGY_LEVELS[level];
          const suites = PRIMARY_SUITES.filter((s) => s.strategyLevel.includes(level));
          return (
            <div key={level} className="card flex flex-col p-6">
              <p className="eyebrow">{def.label} Level Strategy</p>
              {/* The "who" the pyramid names and the card previously
                  dropped — a reader can self-locate against an org-chart
                  seat before reading the decision-type definition below
                  it, rather than only recognising it after the fact. */}
              <p className="faint mt-1.5 text-xs font-semibold uppercase tracking-wide">
                For {def.owner}
              </p>
              <p className="muted mt-3 text-sm leading-relaxed">{def.description}</p>
              {/* The driver's-seat line — same rule as CORE's own hero
                  rewrite: "you" act, the suite is the tool. Set apart in
                  full ink rather than muted grey, so the card reads as
                  definition, then the thing you actually go and do. */}
              <p className="mt-3 flex-1 text-sm font-medium leading-relaxed">{def.inPractice}</p>
              <hr className="mt-5 border-0 border-t" style={{ borderColor: "var(--line-soft)" }} />
              <div className="mt-4 flex flex-wrap gap-2">
                {suites.map((s) => (
                  <Link
                    key={s.id}
                    href={`/suites/${s.id}`}
                    className="rounded px-2.5 py-1 text-xs font-semibold transition-colors hover:bg-[color:var(--surface)]"
                    style={{ color: s.tint, border: `1px solid ${s.tint}` }}
                  >
                    {s.name}
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </Section>
  );
}
