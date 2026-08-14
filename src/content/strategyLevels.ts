/**
 * STRATEGY ALTITUDE — which level of a business a suite actually speaks to.
 *
 * "Strategy" pitched as one flat layer hides the difference between a
 * board setting purpose and deciding where resources go, a business
 * unit deciding how to compete, a function contributing to those goals
 * at full effectiveness, and a team running it week to week. Four
 * different questions, four different owners — and each suite answers
 * a specific one of them rather than "strategy" in general.
 *
 * SINGLE SOURCE OF TRUTH, same rule as brand.ts's stat figures: the
 * label text is written once here and every card/hero that shows a
 * suite's altitude reads it from this file, so it cannot drift.
 */

export type StrategyLevel = "corporate" | "business" | "functional" | "operational";

/**
 * `description` keeps the source pyramid's own rhythm AND its actual
 * claims, not just the shape of its sentences. Three of the four
 * levels are two sentences — an opening clause naming what the level
 * is concerned with, then "It involves decisions regarding/related
 * to…" naming the decision — and Functional is deliberately ONE
 * sentence, because that is what the source gives it; forcing a
 * second sentence onto it earlier this session added a claim the
 * source never makes. Every noun the source names (mission, vision
 * and goals at Corporate; maximising effectiveness at Functional;
 * performance management at Operational) is kept — only the suite
 * names are LAMID ONE's own.
 */
export const STRATEGY_LEVELS: Record<
  StrategyLevel,
  { label: string; owner: string; description: string; inPractice: string }
> = {
  corporate: {
    label: "Corporate",
    /* `owner` is the layer the source pyramid names and this file
       previously dropped: WHO sits at this altitude in an org chart,
       not just what the altitude is concerned with. Wording matches
       the pyramid's own labels (Board of Directors / Heads of Business
       Units / Heads of Business Functions / Team Leaders and Team
       Members) so a reader can self-locate — "that's my seat" — rather
       than only recognising the decision type in the abstract. */
    owner: "Board of Directors",
    description:
      "Concerned with the overall purpose and scope of the business — its mission, vision and goals. It involves decisions regarding how to allocate resources across the whole portfolio and set the overarching strategy the other levels work within.",
    /* `inPractice` is the driver's-seat line — same rule as CORE's own
       hero rewrite (see modules.ts): "you" do the acting, the suite is
       the tool, not the other way round. This is what turns a textbook
       definition of the altitude into a claim the reader can actually
       go operate, rather than just recognise. */
    inPractice: "You hold decision authority and rationale as one live record in CORE, priced in FINANCE against the same figures the board sees.",
  },
  business: {
    label: "Business",
    owner: "Heads of Business Units",
    description:
      "Focuses on how a business unit will compete within its market or segment. It involves decisions related to positioning, differentiation and competitive advantage.",
    inPractice: "You sequence the growth options actually open to you in GROW, priced against the capacity you really have.",
  },
  functional: {
    label: "Functional",
    owner: "Heads of Business Functions",
    description:
      "Focuses on how each function — finance, people, operations, marketing — contributes to the overall strategic goals, maximising the effectiveness of every area it touches.",
    inPractice: "You score capability against the roles you need now in TALENT, and turn that read into a costed budget in FINANCE.",
  },
  operational: {
    label: "Operational",
    owner: "Team Leaders and Team Members",
    description:
      "Concerned with the day-to-day activities and processes needed to carry out the strategy effectively. It involves decisions regarding resource allocation, workflow optimisation and performance management at execution level.",
    inPractice: "You see your real delivery pace in CORE's cadence mapping, and catch drift before it compounds.",
  },
};

/** Short label list for a suite's altitude, in a fixed reading order. */
export function altitudeLabel(levels: StrategyLevel[]): string {
  const order: StrategyLevel[] = ["corporate", "business", "functional", "operational"];
  return order
    .filter((l) => levels.includes(l))
    .map((l) => STRATEGY_LEVELS[l].label)
    .join(" · ");
}
