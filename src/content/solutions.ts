/**
 * SOLUTIONS — segment and role pages.
 *
 * Same software, re-cut by who is buying. "Works for every size" is a
 * claim; a page per segment is the proof of it (teardown §1 §7).
 */

import type { FaqItem } from "@/components/sections/Faq";
import type { SuiteId } from "./suites";
import type { TierId } from "./tiers";
import type { PrimarySuite } from "./aios";

export type Solution = {
  slug: string;
  kind: "size" | "role";
  nav: string;
  eyebrow: string;
  headline: string;
  subhead: string;
  /**
   * The primary suite whose value this buyer is actually shopping for.
   *
   * Set on the four ROLE pages, where the mapping is exact — a CFO is
   * buying Financial Performance, a CPO is buying Capability. It drives
   * the value shown in the hero, so the thread that starts on the
   * landing slide is visible on the page a role-based buyer lands on.
   *
   * Deliberately absent on the three SIZE pages. A founder is not
   * shopping for one of the four values; they are shopping for all of
   * them at a size that fits. Forcing a primary suite onto those pages
   * would narrow the offer rather than clarify it — so they get the
   * full four-value line instead.
   */
  suite?: PrimarySuite["id"];
  /** What this buyer is actually trying to avoid. */
  pains: string[];
  /** Ordered starting path — not a feature list. */
  path: { title: string; body: string }[];
  suites: SuiteId[];
  recommendedTier: TierId;
  faq: FaqItem[];
  closing: { title: string; body: string };
};

export const SOLUTIONS: Solution[] = [
  /* ── By organisation size ─────────────────────────────── */
  {
    slug: "small-business",
    kind: "size",
    nav: "Founders and small teams",
    eyebrow: "For founders and small teams",
    headline: "You do not need a strategy department. You need to stop guessing.",
    subhead:
      "Start free with a diagnostic, a costed budget and a client pipeline. Add suites when they earn it — never a platform migration.",
    pains: [
      "Advisory firms quote more than the problem is worth",
      "The numbers live in a spreadsheet only one person understands",
      "Clients, contracts and invoices are spread across four tools",
      "Specialist help is sourced through whoever you happen to know",
    ],
    path: [
      { title: "Run the free diagnostic", body: "Ten minutes, no card. It tells you which part of the business is actually costing you." },
      { title: "Cost your next project properly", body: "The budget estimator computes overhead, contingency and tax, and exports the working." },
      { title: "Put clients on one pipeline", body: "LAMID DESK holds contacts, proposals, milestones, invoices and payments on one record." },
      { title: "Bring in an expert only when you need one", body: "Post a brief, get a matched shortlist, pay through escrow on approved milestones." },
    ],
    suites: ["core", "finance", "desk", "market"],
    recommendedTier: "starter",
    faq: [
      { q: "Is there a free plan for small businesses?", a: "Yes. Two users, one free business diagnostic, the budget estimator, 50 contacts, milestone escrow and 5 GB of document storage — with no card required and no time limit. The diagnostic is the full engine, not a preview; after it, further runs are bought as points." },
      { q: "What does it cost when we outgrow free?", a: "Starter is $39 per seat per month billed annually, or $49 monthly. That opens the core engines across every suite plus proposals, invoicing and unlimited expert matching." },
      { q: "We are three people. Is this too much platform?", a: "Start with one suite. Most small teams begin with FINANCE for the budget engines and DESK for clients, and never open TALENT until they are hiring. You are not charged for suites by count — seat price follows your tier." },
      { q: "How is this cheaper than hiring a consultant?", a: "A single consulting diagnostic typically costs more than a year of Starter. Here the diagnostic costs 40 points, and when you do need a specialist you source them per engagement rather than on a retainer." },
    ],
    closing: { title: "Start with the thing that hurts most.", body: "The free plan has no time limit and no card." },
  },
  {
    slug: "mid-market",
    kind: "size",
    nav: "Mid-market",
    eyebrow: "For mid-market organisations",
    headline: "The stage where informal stops working.",
    subhead:
      "You have outgrown the spreadsheet and the all-hands, but you are not ready for an enterprise transformation programme. This is the layer in between.",
    pains: [
      "Different functions hold different versions of the truth",
      "Delivery pace varies by team and nobody can say what normal is",
      "People decisions are made on impression rather than evidence",
      "Board reporting is rebuilt by hand every quarter",
    ],
    path: [
      { title: "Baseline the whole organisation", body: "Run diagnostics across strategy, cadence, talent and finance to establish one shared read." },
      { title: "Put the teams on one shared workspace", body: "Organisation workspace, shared points pool, team structures and role-based access." },
      { title: "Make reporting generated, not assembled", body: "Executive and board reporting comes from live data rather than a manual rebuild." },
      { title: "Build the bench before you need it", body: "TALENT scores capability and succession cover continuously; LEARN certifies against the gap." },
    ],
    suites: ["core", "grow", "talent", "finance", "desk"],
    recommendedTier: "growth",
    faq: [
      { q: "How many seats does mid-market usually need?", a: "Most organisations start with the leadership team plus function heads — typically eight to twenty-five seats on Growth — and expand once the reporting proves useful." },
      { q: "Can we roll out one suite at a time?", a: "Yes, and most do. Because seat price follows your account tier rather than the suite count, adding the second and third suite costs nothing extra per seat." },
      { q: "Do we need an implementation project?", a: "No. Growth includes guided onboarding rather than a managed implementation. Enterprise adds managed onboarding and migration assistance if you are moving off existing systems." },
      { q: "What is the difference between Growth and Enterprise?", a: "Growth gives you every engine and the full agent layer. Enterprise adds SSO, SCIM, field-level permissions, approval workflows, multi-account management, a sandbox, data residency, an unlimited audit log, a 99.9% uptime commitment and a dedicated account director." },
    ],
    closing: { title: "Get one version of the truth.", body: "Start with a diagnostic across two functions and compare the reads." },
  },
  {
    slug: "enterprise",
    kind: "size",
    nav: "Enterprise and government",
    eyebrow: "For enterprise and government",
    headline: "Governance, residency and assurance — without a two-year programme.",
    subhead:
      "SSO, SCIM, field-level permissions, approval workflows, multi-account management, data residency and an unlimited audit trail, on the same engines the rest of the platform runs.",
    pains: [
      "Procurement requires controls that most platforms cannot evidence",
      "Business units operate as separate estates with no consolidated view",
      "Decision authority is documented in policy but not enforced in systems",
      "Every transformation begins with a data-gathering exercise from scratch",
    ],
    path: [
      { title: "Pass the security review first", body: "The trust centre states what is implemented and what is not, so procurement is not a discovery exercise." },
      { title: "Model the estate", body: "Multi-account management holds business units separately while consolidating the executive view." },
      { title: "Enforce the authority matrix", body: "Decision authority and policy rules become live data with approval workflows behind them." },
      { title: "Run change with evidence", body: "Transformation and governance engines track drift, stability and compliance continuously." },
    ],
    /* Was ["core", "grow", "talent", "finance", "desk", "docushare"] —
       DOCUSHARE dropped: it isn't a `Suite` SuiteGrid can render a card
       for anymore (see content/docushare.ts). The FAQ on this page
       still names it directly ("across both the core platform and
       DocuShare"), so the fact isn't lost, just no longer a grid card. */
    suites: ["core", "grow", "talent", "finance", "desk"],
    recommendedTier: "enterprise",
    faq: [
      { q: "Are you SOC 2 certified?", a: "Not yet, and we say so plainly in the trust centre rather than in a procurement questionnaire. The underlying controls a SOC 2 audit examines — encryption, access control, audit logging, change management — are implemented and documented, and we will walk your security team through them." },
      { q: "Can we choose where data is stored?", a: "Yes. Data residency region selection is available on Enterprise, with the available regions confirmed during contracting." },
      { q: "Do you support SSO and automated provisioning?", a: "Yes — SAML 2.0 single sign-on and SCIM provisioning on Enterprise, across both the core platform and DocuShare." },
      { q: "How does Enterprise pricing work?", a: "From $1,850 per month, including 25 seats and 10,000 monthly points, with additional seats at $65. The exact figure depends on seats, points and residency requirements, so it is agreed with sales." },
      { q: "How is this different from a systems integrator programme?", a: "An SI programme starts with a discovery phase that rebuilds knowledge you already have. Here the engines compute a baseline from structured inputs in weeks, and the model stays afterwards rather than leaving with the integrator." },
    ],
    closing: { title: "Send us the security questionnaire.", body: "We answer it honestly, including where the answer is 'not yet'." },
  },

  /* ── By role ──────────────────────────────────────────── */
  {
    slug: "ceo",
    suite: "core",
    kind: "role",
    nav: "Chief executive",
    eyebrow: "For chief executives",
    headline: "One source of truth, not four dashboards telling four stories.",
    subhead:
      "Strategy, delivery cadence, workforce and financial position on one executive console — computed, not self-reported.",
    pains: [
      "Each function reports a different version of the same quarter",
      "Drift is only visible once results have already missed",
      "Board packs take a week to assemble and are stale on arrival",
    ],
    path: [
      { title: "Establish one baseline", body: "A diagnostic across every function, scored on the same basis." },
      { title: "Watch the cadence, not the status", body: "Delivery tempo is measured rather than self-reported, so drift surfaces early." },
      { title: "Generate the board pack", body: "Executive reporting is produced from live data instead of rebuilt by hand." },
    ],
    suites: ["core", "finance", "talent", "grow"],
    recommendedTier: "growth",
    faq: [
      { q: "How long before this is useful?", a: "The first diagnostic returns a scored read in under an hour of structured input. Cadence engines need roughly six delivery periods before they can call a trend rather than noise — and they will tell you when the signal is too volatile to call." },
      { q: "Do my leadership team have to maintain it?", a: "The cadence and delivery engines read work already happening. The diagnostic and planning engines need structured input from whoever owns each area, typically once per cycle." },
    ],
    closing: { title: "Get one read the whole leadership team shares.", body: "Start with a diagnostic across two functions." },
  },
  {
    slug: "cfo",
    suite: "finance",
    kind: "role",
    nav: "Chief financial officer",
    eyebrow: "For chief financial officers",
    headline: "Numbers you can defend, with the arithmetic attached.",
    subhead:
      "Budgets, forecasts, cost structure and enterprise value computed from your figures — versioned, permissioned and exportable, never generated by a model.",
    pains: [
      "Three versions of the budget are in active circulation",
      "Nobody can reproduce how last quarter's forecast was built",
      "Cost leakage is found in hindsight rather than in advance",
    ],
    path: [
      { title: "Move one model off the spreadsheet", body: "Rebuild the current budget in f02 and compare it to what actually happened." },
      { title: "Find the line outrunning revenue", body: "Cost optimisation reads margin period by period on your own figures." },
      { title: "Connect capital to performance", body: "Financial KPIs and enterprise value tracked against the cadence and talent engines." },
    ],
    suites: ["finance", "core", "desk"],
    recommendedTier: "growth",
    faq: [
      { q: "Does AI produce any of the financial figures?", a: "No. Every figure is arithmetic computed from your inputs, and the calculation is exportable. Agents can draft commentary around a result but never generate the number." },
      /* Was "CSV on every tier and PDF from Growth". CSV is now true of
         every module (lib/engineExport.ts); PDF export of a model is
         not built, and claiming it here while the trust centre lists
         what is not done would have been the exact inconsistency this
         platform sells against. */
      { q: "Can we keep using Excel alongside it?", a: "Yes. Every engine result exports to CSV on every tier, including the working — the arithmetic behind each figure, not just the final numbers. Invoices export as PDF; models do not yet." },
    ],
    closing: { title: "Rebuild one model and compare.", body: "The budget estimator is free — bring last quarter's numbers." },
  },
  {
    slug: "cpo",
    suite: "talent",
    kind: "role",
    nav: "Chief people officer",
    eyebrow: "For chief people officers",
    headline: "People decisions with financial-grade evidence.",
    subhead:
      "Capability, risk, succession and engagement scored continuously on 40+ signals — so workforce arguments carry the same weight as budget ones.",
    pains: [
      "Flight risk is discovered at the exit interview",
      "Succession grids are annual and stale within a quarter",
      "Capability is asserted in reviews but never measured",
    ],
    path: [
      { title: "Baseline capability against roles you need now", body: "Not against last year's org chart — against the roles the current plan requires." },
      { title: "Score cover for every critical role", body: "Bench strength and succession pipelines held as live data." },
      { title: "Close the gap and prove it", body: "LEARN certifies against the measured gap, then re-run the baseline to show uplift." },
    ],
    suites: ["talent", "learn", "core"],
    recommendedTier: "growth",
    faq: [
      { q: "Does this replace our HRIS?", a: "No. An HRIS records who works here and what they are paid. These engines read capability, risk and readiness on top of that. The two are complementary." },
      { q: "How is engagement measured without a survey?", a: "From behavioural and workload signal — including who is absorbing unsustainable load — so a team becoming stretched surfaces in weeks rather than at the next survey cycle." },
    ],
    closing: { title: "Find out where your cover is thin.", body: "The bench strength snapshot is free with an account." },
  },
  {
    slug: "strategy",
    suite: "grow",
    kind: "role",
    nav: "Strategy and transformation",
    eyebrow: "For strategy and transformation leaders",
    headline: "Decisions that survive contact with delivery.",
    subhead:
      "Map the decision, weight the factors, keep the rationale — then watch whether the organisation's actual cadence can carry the plan.",
    pains: [
      "The strategy is agreed and then quietly diverges from the work",
      "Nobody can reconstruct why a major decision was taken",
      "Transformation progress is reported rather than measured",
    ],
    path: [
      { title: "Structure the decision before the room", body: "Clarity scoring, option weighting and framework building before it goes to committee." },
      { title: "Attach it to delivery", body: "Priorities carry their dependent decisions and the cadence required to deliver them." },
      { title: "Track drift, stability and recurrence", body: "Transformation engines flag when progress stalls and when a decision is being remade." },
    ],
    suites: ["core", "grow"],
    recommendedTier: "growth",
    faq: [
      { q: "How many decision engines are there?", a: "100 across the q-series, from decision landscape mapping through scenario exploration, root-cause tracing, authority matrices and governance. Availability by tier is listed in the pricing comparison." },
      { q: "Can we import an existing strategy?", a: "Yes. Priorities and decisions can be entered directly, and the engines will score coherence and flag conflicting priorities in what you already have." },
    ],
    closing: { title: "Structure one decision properly.", body: "The decision clarity check is free and takes three minutes." },
  },
];

export const getSolution = (slug: string) => SOLUTIONS.find((s) => s.slug === slug);
export const SIZE_SOLUTIONS = SOLUTIONS.filter((s) => s.kind === "size");
export const ROLE_SOLUTIONS = SOLUTIONS.filter((s) => s.kind === "role");
