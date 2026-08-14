import type { SuiteId } from "./suites";

/**
 * THIRD-PARTY INDUSTRY CONTEXT — never LAMID ONE's own measured results.
 *
 * Every unverified `Stat` in suites.ts (`verified: false`) stays exactly
 * that: unverified. This file does NOT fill those placeholders — mixing
 * a real external statistic into a slot the rest of the codebase treats
 * as "this suite's own achieved number" would misrepresent both. Instead
 * this is a second, clearly separate category: what independent
 * research says about the *problem* a suite addresses, cited by
 * publisher, report and year, with a link. `IndustryContext.tsx` is the
 * only component that reads this file, and it renders under its own
 * "Industry context — not a LAMID ONE measurement" label so a reader
 * never mistakes the two for the same kind of claim.
 *
 * SOURCING BAR. Each entry was checked against a named report or
 * publication from a credible, citable body (McKinsey, Bain, SHRM, APQC,
 * Gartner, LinkedIn) — not an SEO aggregator restating a number nobody
 * can trace. Several plausible-sounding stats were researched and
 * rejected on this basis:
 *   - DESK: CRM-time-saved and invoicing-speed claims all traced only to
 *     unsourced marketing blogs (crm.org, resolvepay, billed.app, etc.)
 *     with no named report behind the number. DESK carries nothing here
 *     rather than a number nobody could stand behind — same call already
 *     made for its `EngineExample` (no wired free tool yet either).
 *   - LEARN: the widely repeated "72% average completion rate" and "90%
 *     of training forgotten within a week" traced to SEO content and an
 *     1885 psychology paper respectively, not a current corporate-
 *     learning study. Used LinkedIn's 2025 Workplace Learning Report
 *     instead, which is a genuine, dated, named report.
 *   - CORE's strategy-execution figure ("67% of strategy fails on
 *     execution, not planning") could not be traced past secondary
 *     sources disagreeing on its origin — dropped. Kept only the
 *     decision-making figure, which has a named, checkable source.
 *
 * SIGNAL's entry carries a `note` for the same reason: Gartner's 2024
 * prediction is real and precisely sourced, but a 2026 retrospective
 * found the literal 25% figure hadn't played out as stated. Citing the
 * prediction without that caveat would overstate what is actually known
 * — same discipline as the "partial" column in this site's comparison
 * tables and the QUOTES/`verified` rule everywhere else in this codebase.
 */
export type IndustryStat = {
  suiteId: SuiteId;
  stat: string;
  source: string;
  url: string;
  note?: string;
};

export const INDUSTRY_RESEARCH: IndustryStat[] = [
  {
    suiteId: "core",
    stat: "Inefficient decision-making costs a typical Fortune 500 company roughly 530,000 days of managers' time a year — about $250 million in annual wages, before counting the cost of the decisions themselves. Companies that manage to decide both fast and well see at least 20% higher financial returns than their peers.",
    source: "McKinsey Quarterly — \"Three Keys to Faster, Better Decisions\" (2019)",
    url: "https://www.mckinsey.com/capabilities/people-and-organizational-performance/our-insights/three-keys-to-faster-better-decisions",
  },
  {
    suiteId: "grow",
    stat: "72% of executives say they want to run a growth company — but only 22% say they actually have the team and resources allocated to support that growth.",
    source: "McKinsey — \"Growth Ambitions, Action Shortfalls\"",
    url: "https://www.mckinsey.com/featured-insights/week-in-charts/growth-ambitions-action-shortfalls",
  },
  {
    suiteId: "talent",
    stat: "Only 19% of organizations have a formal succession plan — and most of those cover senior executive roles only, leaving critical roles further down the org chart with no named cover at all.",
    source: "ScottMadden — \"Succession Planning: Why It Must Be a 2025 Priority\" (2025)",
    url: "https://www.scottmadden.com/insight/succession-planning-why-it-must-be-a-2025-priority/",
  },
  {
    suiteId: "talent",
    stat: "Replacing an employee typically costs 50%–200% of their annual salary once recruiting, onboarding and lost productivity are counted.",
    source: "SHRM — \"The Myth of Replaceability: Preparing for the Loss of Key Employees\" (2025)",
    url: "https://www.shrm.org/executive-network/insights/myth-replaceability-preparing-loss-of-key-employees",
  },
  {
    suiteId: "finance",
    stat: "Top-performing organizations complete their annual budget cycle in 25 days or less — roughly half the ~50 days it takes organizations at the 75th percentile.",
    source: "APQC — Open Standards Benchmarking, \"Cycle Time to Complete the Annual Budget\"",
    url: "https://www.apqc.org/resource-library/resource-listing/cycle-time-complete-annual-budget",
  },
  {
    suiteId: "signal",
    stat: "Gartner predicted in 2024 that traditional search engine volume would fall 25% by 2026 as buyers increasingly get answers from AI chatbots and virtual agents instead of a search results page.",
    source: "Gartner — press release (Feb 2024)",
    url: "https://www.gartner.com/en/newsroom/press-releases/2024-02-19-gartner-predicts-search-engine-volume-will-drop-25-percent-by-2026-due-to-ai-chatbots-and-other-virtual-agents",
    note: "A 2026 retrospective found the literal 25% figure hasn't played out exactly as stated — cited here as Gartner's prediction and the direction it named, not a confirmed outcome.",
  },
  {
    suiteId: "learn",
    stat: "88% of organizations say they're concerned about employee retention — and offering learning and development opportunities is the single most-cited retention strategy.",
    source: "LinkedIn — 2025 Workplace Learning Report",
    url: "https://business.linkedin.com/learn/resources/workplace-learning-report",
  },
  {
    suiteId: "market",
    stat: "The global average time to fill an open role is 44 days, from job requisition to accepted offer.",
    source: "SHRM — \"The State of Recruiting 2025\", from SHRM's Talent Acquisition Benchmarking Report",
    url: "https://www.shrm.org/executive-network/insights/people-strategy/state-of-recruiting-2025-insights-to-maximize-recruitment",
  },
];

export const industryResearchForSuite = (suiteId: string): IndustryStat[] =>
  INDUSTRY_RESEARCH.filter((s) => s.suiteId === suiteId);
