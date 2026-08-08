/**
 * THE TIER ARCHITECTURE — one reconciled ladder.
 *
 * ─────────────────────────────────────────────────────────────
 * WHY THIS FILE EXISTS
 * ProdLamid carried three pricing systems that disagreed:
 *
 *  1. `lib/services/tierService.ts` — the runtime gate:
 *     free · premium · enterprise · enterprise_plus · admin
 *  2. `components/subscription/SaasPricingSection.tsx`:
 *     Client Freemium/$99 · Expert Freemium/$49 ·
 *     Enterprise $18,500/mo · Concierge (approval)
 *  3. `app/pricing/page.tsx`:
 *     Starter $49 · Growth $149 · Enterprise custom
 *
 * Three surfaces, three ladders, none matching. This file is the
 * single reconciliation, shaped the way the teardown recommends:
 *
 *  · ONE platform ladder (below) — seats + points, sold to buyers.
 *  · ONE supply-side programme (EXPERT_PROGRAM) — sold to experts,
 *    modelled on a partner programme: membership fee, revenue share,
 *    and a fee the expert can waive for their own client.
 *  · Marketplace access is a FEATURE of the platform ladder, not a
 *    parallel ladder. That is what removed the contradiction.
 *
 * ─────────────────────────────────────────────────────────────
 * THE CORE SEAT RULE (teardown §6.1) — the key structural import.
 * Seat price is indexed to the ACCOUNT'S TIER, not to which suite a
 * person opens. Consequence: moving up a tier re-prices every seat
 * (an expensive, deliberate decision), but adding a sixth suite at
 * the same tier costs nothing per seat. Vertical moves are expensive;
 * horizontal moves are free. That asymmetry is what turns a
 * single-suite customer into an eight-suite customer, and it is why
 * the bundle looks cheap against buying suites individually — the
 * discount is the removal of duplicate seat charges, not a discount
 * on features.
 *
 * ⚠️  PRICES MARKED `confirmed: false` ARE CARRIED OVER FROM
 * CONFLICTING SOURCES AND NEED A COMMERCIAL DECISION BEFORE LAUNCH.
 */

export type TierId = "free" | "starter" | "growth" | "enterprise" | "concierge";

export type Price = {
  monthly: number | null;
  annual: number | null;
  /** Struck-through anchor. Only where a real promotion exists. */
  was?: number;
  unit: "per seat / month" | "per month" | "";
  confirmed: boolean;
};

export type Tier = {
  id: TierId;
  name: string;
  /** Positioning line — the "Essential / Comprehensive / Most powerful"
   *  slot. Always states scope, never adjectives alone. */
  positioning: string;
  price: Price;
  /** Rank encoded as dots as well as position, so it survives
   *  greyscale and screenshots (teardown §7.10 #6). */
  rank: 0 | 1 | 2 | 3 | 4;
  seatsIncluded: number | null;
  extraSeat: number | null;
  pointsGrant: number;
  pointsMonthly: number;
  cta: { label: string; href: string };
  /** Self-serve below the line, sales-assisted above it. The CTA
   *  label change IS the segmentation (teardown §6.1 #2). */
  motion: "self-serve" | "sales-assisted" | "approval";
  recommended?: boolean;
  runtimeKey: string;
};

export const TIERS: Tier[] = [
  {
    id: "free",
    name: "Free",
    positioning: "Foundational tools to see where you stand.",
    price: { monthly: 0, annual: 0, unit: "", confirmed: true },
    rank: 0,
    seatsIncluded: 2,
    extraSeat: null,
    /* Exactly one diagnostic. See FREE_GRANT in content/agents.ts —
       the number is derived from Catalyst's cost so it cannot drift. */
    pointsGrant: 40,
    pointsMonthly: 0,
    cta: { label: "Get started free", href: "/signup" },
    motion: "self-serve",
    runtimeKey: "free",
  },
  {
    id: "starter",
    name: "Starter",
    positioning: "Essential decision, growth, people, finance and client tools for a small team.",
    price: { monthly: 49, annual: 39, was: 69, unit: "per seat / month", confirmed: true },
    rank: 1,
    seatsIncluded: null,
    extraSeat: null,
    pointsGrant: 800,
    pointsMonthly: 500,
    cta: { label: "Buy now", href: "/signup?plan=starter" },
    motion: "self-serve",
    recommended: true,
    runtimeKey: "premium",
  },
  {
    id: "growth",
    name: "Growth",
    positioning: "Comprehensive intelligence across every suite, with the full agent layer.",
    price: { monthly: 149, annual: 119, was: 199, unit: "per seat / month", confirmed: true },
    rank: 2,
    seatsIncluded: null,
    extraSeat: null,
    pointsGrant: 2000,
    pointsMonthly: 2000,
    cta: { label: "Start free trial", href: "/signup?plan=growth" },
    motion: "self-serve",
    runtimeKey: "premium",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    positioning: "Our most complete platform, with governance, residency and assurance.",
    /* Publishing a floor pre-qualifies enterprise leads and stops
       wasted calls (teardown §3). Derived from ProdLamid's $18,500/mo
       marketplace enterprise contract — NEEDS CONFIRMATION. */
    price: { monthly: 1850, annual: 1550, was: 2200, unit: "per month", confirmed: false },
    rank: 3,
    seatsIncluded: 25,
    extraSeat: 65,
    pointsGrant: 2000,
    pointsMonthly: 10000,
    cta: { label: "Talk to sales", href: "/contact-sales" },
    motion: "sales-assisted",
    runtimeKey: "enterprise",
  },
  {
    id: "concierge",
    name: "Concierge",
    positioning: "Dedicated delivery management for complex, high-value programmes.",
    price: { monthly: null, annual: null, unit: "", confirmed: true },
    rank: 4,
    seatsIncluded: null,
    extraSeat: null,
    pointsGrant: 5000,
    pointsMonthly: 0,
    cta: { label: "Request access", href: "/concierge" },
    motion: "approval",
    runtimeKey: "enterprise_plus",
  },
];

export const TIERS_BY_ID = Object.fromEntries(TIERS.map((t) => [t.id, t])) as Record<TierId, Tier>;

/* ───────────────────────────────────────────────────────────────
   THE FULL FEATURE MATRIX
   Every function, grouped. `true` = included · `false` = not
   included · string = included with a stated limit.
   Order of tiers in `values`: free, starter, growth, enterprise,
   concierge.
   ─────────────────────────────────────────────────────────────── */

import { AGENTS } from "./agents";

/**
 * Per-tier availability overrides for agents whose access is not a
 * simple on/off at `minTier`. Everything not listed here just follows
 * `minTier` — true from that tier upward, false below it — which is
 * why most agents need no entry at all.
 */
const AGENT_TIER_OVERRIDES: Partial<Record<string, [MatrixValue, MatrixValue, MatrixValue, MatrixValue, MatrixValue]>> = {
  diagnostic: ["1 / month", true, true, true, true],
  matching: ["Automatic only", "Manual trigger", "Manual trigger", "Manual trigger", "AI + human curated"],
};

const RANK_ORDER: TierId[] = ["free", "starter", "growth", "enterprise", "concierge"];

function agentMatrixRows(): MatrixRow[] {
  const minRank: Record<TierId, number> = { free: 0, starter: 1, growth: 2, enterprise: 3, concierge: 4 };
  const rows: MatrixRow[] = AGENTS.filter((a) => a.surface === "platform").map((a) => ({
    feature: a.name,
    note: `${a.role} · ${a.points} pts / outcome`,
    ref: a.id,
    values: AGENT_TIER_OVERRIDES[a.id]
      ?? (RANK_ORDER.map((t) => minRank[t] >= minRank[a.minTier]) as [MatrixValue, MatrixValue, MatrixValue, MatrixValue, MatrixValue]),
  }));

  rows.push(
    { feature: "Agent usage reporting", values: [false, "Basic", "Full", "Full", "Full"] },
    { feature: "Data excluded from third-party model training", values: [true, true, true, true, true] },
  );
  return rows;
}

export type MatrixValue = boolean | string;
export type MatrixRow = {
  feature: string;
  /** User-facing qualifier — a price, a limit, a list. RENDERED. */
  note?: string;
  /**
   * Internal module reference (q44, f02, core-diagnostic). NEVER
   * RENDERED. Kept so engineering can trace a pricing row to the engine
   * that implements it, but a buyer has no use for "Q44" — they want
   * "Decision clarity score". Codes in a customer-facing table read as
   * a leaked internal spreadsheet.
   */
  ref?: string;
  values: [MatrixValue, MatrixValue, MatrixValue, MatrixValue, MatrixValue];
};
export type MatrixGroup = { group: string; blurb?: string; rows: MatrixRow[] };

export const FEATURE_MATRIX: MatrixGroup[] = [
  {
    group: "Access and seats",
    blurb: "Seat price follows the account tier, not the suite. Adding a suite never re-prices a seat.",
    rows: [
      { feature: "Users included", values: ["2", "Per seat", "Per seat", "25 included", "Unlimited"] },
      { feature: "Additional seat", values: [false, "$39 / mo", "$119 / mo", "$65 / mo", "Included"] },
      { feature: "Organisation workspace", values: [false, false, true, true, true] },
      { feature: "Single sign-on (SSO)", values: [false, false, false, true, true] },
      { feature: "Role-based access control", values: [false, "Basic", "Full", "Full", "Full"] },
      { feature: "Multi-account management", values: [false, false, false, true, true] },
      { feature: "Sandbox environment", values: [false, false, false, true, true] },
    ],
  },
  {
    group: "LAMID Points",
    blurb: "Agents and marketplace actions are metered per completed outcome. Failed runs cost nothing.",
    rows: [
      { feature: "Points on signup", note: "Free covers exactly one diagnostic", values: ["40", "800", "2,000", "2,000 shared", "5,000 on approval"] },
      { feature: "Monthly points allowance", values: [false, "500", "2,000", "10,000", "Negotiated"] },
      { feature: "Buy additional points", values: [true, true, true, true, true] },
      { feature: "Shared team points pool", values: [false, false, true, true, true] },
      { feature: "Purchased points expire", values: ["Never", "Never", "Never", "Never", "Never"] },
    ],
  },
  {
    group: "LAMID CORE — strategy, decisions and execution",
    blurb:
      "Every row is a usable engine, not a module count. A buyer needs to know what they can open, not how many things exist.",
    rows: [
      { feature: "Business diagnostic", ref: "core-diagnostic", values: ["1 free run", true, true, true, true] },
      { feature: "Core dashboard", ref: "core-dashboard", values: [true, true, true, true, true] },
      { feature: "Decision clarity score", ref: "q44", values: [true, true, true, true, true] },
      { feature: "Decision landscape mapping", ref: "q01", values: [false, true, true, true, true] },
      { feature: "Current decision status", ref: "q02", values: [false, true, true, true, true] },
      { feature: "Decision path simulator", ref: "q03", values: [false, false, true, true, true] },
      { feature: "Outcome probability", ref: "q04", values: [false, false, true, true, true] },
      { feature: "Conflicting priorities detector", ref: "q06", values: [false, true, true, true, true] },
      { feature: "Full scenario explorer", ref: "q12", values: [false, false, true, true, true] },
      { feature: "Root cause tracer", ref: "q13", values: [false, false, true, true, true] },
      { feature: "Early warning signals", ref: "q15", values: [false, false, true, true, true] },
      { feature: "Stakeholder alignment score", ref: "q17", values: [false, true, true, true, true] },
      { feature: "Decision framework builder", ref: "q21", values: [false, false, true, true, true] },
      { feature: "Decision authority matrix", ref: "q98", values: [false, false, false, true, true] },
      { feature: "Compliance and policy rules", ref: "q97", values: [false, false, false, true, true] },
      { feature: "Enterprise governance", ref: "q99", values: [false, false, false, true, true] },
      { feature: "Executive sign-off and certification", ref: "q100", values: [false, false, false, true, true] },
      { feature: "Cadence mapping", ref: "r01", values: [true, true, true, true, true] },
      { feature: "Pace of execution", ref: "r02", values: [false, true, true, true, true] },
      { feature: "Cadence drift alert", ref: "r03", values: [false, true, true, true, true] },
      { feature: "Cadence stability score", ref: "r04", values: [false, true, true, true, true] },
      { feature: "Workload balance monitor", ref: "r05", values: [false, true, true, true, true] },
      { feature: "Cross-team cadence fit", ref: "r06", values: [false, false, true, true, true] },
      { feature: "Real-time cadence pulse", ref: "r14", values: [false, false, true, true, true] },
      { feature: "Cadence governance console", ref: "r28", values: [false, false, false, true, true] },
      { feature: "Strategic identity and direction", ref: "s01–s02", values: [false, true, true, true, true] },
      { feature: "Strategic priority weighting", ref: "s09", values: [false, true, true, true, true] },
      { feature: "Strategic coherence and convergence", ref: "s03–s04", values: [false, false, true, true, true] },
      { feature: "Market trend response tracker", ref: "s11", values: [false, false, true, true, true] },
      { feature: "Productivity mapping and velocity", ref: "p01–p02", values: [false, true, true, true, true] },
      { feature: "Productivity drift and stability", ref: "p03–p04", values: [false, false, true, true, true] },
      { feature: "Process and workflow optimisation", ref: "p21–p22", values: [false, false, true, true, true] },
      { feature: "Transformation and change engines", ref: "p26–p27, z01–z06", values: [false, false, true, true, true] },
      { feature: "Protection, security and resilience", ref: "x01–x07", values: [false, false, false, true, true] },
      { feature: "Operating rhythm console", ref: "core-operating-rhythm", values: [false, true, true, true, true] },
      { feature: "Strategic alignment console", ref: "core-strategic-alignment", values: [false, false, true, true, true] },
      { feature: "Executive console", ref: "core-executive-console", values: [false, false, true, true, true] },
      { feature: "Change management", ref: "core-change-management", values: [false, false, true, true, true] },
      { feature: "Operating model builder", ref: "operating-model", values: [false, false, true, true, true] },
      { feature: "Custom engine configuration", values: [false, false, false, true, true] },
    ],
  },
  {
    group: "LAMID GROW — customer and digital growth",
    rows: [
      { feature: "Growth diagnostic", values: ["1 / month", true, true, true, true] },
      { feature: "Growth dashboard", ref: "grow-dashboard", values: [true, true, true, true, true] },
      { feature: "Digital maturity assessment", ref: "grow-digital-maturity", values: [false, true, true, true, true] },
      { feature: "Growth planner", ref: "grow-planner", values: [false, true, true, true, true] },
      { feature: "Opportunity signals", ref: "grow-opportunity-signals", values: [false, false, true, true, true] },
      { feature: "Market intelligence", ref: "grow-market-intelligence", values: [false, false, true, true, true] },
      { feature: "Growth pathways", ref: "grow-pathways", values: [false, false, true, true, true] },
      { feature: "Modernisation planning", ref: "grow-modernisation", values: [false, false, true, true, true] },
      { feature: "Advisory console", ref: "grow-advisory-console", values: [false, false, false, true, true] },
      { feature: "Executive growth report", ref: "grow-executive-report", values: [false, false, true, true, true] },
      { feature: "Enterprise intelligence summary", ref: "z08", values: [false, false, false, true, true] },
    ],
  },
  {
    group: "LAMID TALENT — people intelligence",
    rows: [
      { feature: "Talent diagnostics", ref: "talent-diagnostics", values: ["1 / month", true, true, true, true] },
      { feature: "Talent dashboard", ref: "talent-dashboard", values: [false, true, true, true, true] },
      { feature: "Capability assessment", ref: "talent-capability · a15", values: [false, true, true, true, true] },
      { feature: "Talent risk", ref: "a08", values: [false, true, true, true, true] },
      { feature: "Talent opportunity", ref: "a09", values: [false, true, true, true, true] },
      { feature: "Performance alignment", ref: "a24", values: [false, true, true, true, true] },
      { feature: "Career pathing", ref: "a25", values: [false, true, true, true, true] },
      { feature: "Bench strength", ref: "a22", values: [false, false, true, true, true] },
      { feature: "Succession pipeline", ref: "a21", values: [false, false, true, true, true] },
      { feature: "Behavioural competency", ref: "a23", values: [false, false, true, true, true] },
      { feature: "Engagement signals", ref: "a27", values: [false, false, true, true, true] },
      { feature: "Workforce forecasting", ref: "a26", values: [false, false, true, true, true] },
      { feature: "Workforce planning and readiness", ref: "talent-workforce-*", values: [false, false, true, true, true] },
      { feature: "Leadership pipeline", ref: "talent-leadership-pipeline", values: [false, false, true, true, true] },
      { feature: "Leadership uplift", ref: "a16", values: [false, false, true, true, true] },
      { feature: "Talent acceleration I–IV", ref: "a17–a20", values: [false, false, true, true, true] },
      { feature: "Culture intelligence", ref: "talent-culture-intelligence", values: [false, false, false, true, true] },
      { feature: "Executive talent", ref: "a28", values: [false, false, false, true, true] },
      { feature: "Job openings and requisitions", values: [false, true, true, true, true] },
      { feature: "Candidate pipeline", values: [false, true, true, true, true] },
      { feature: "Résumé parsing", values: [false, true, true, true, true] },
      { feature: "Mentorship matching", values: [false, false, true, true, true] },
      { feature: "Enterprise talent integration", ref: "a29–a32", values: [false, false, false, true, true] },
    ],
  },
  {
    group: "LAMID FINANCE — financial clarity",
    rows: [
      { feature: "Budget estimator", note: "free tool", ref: "f02", values: [true, true, true, true, true] },
      { feature: "Budgeting and forecasting", ref: "f02", values: ["Single project", true, true, true, true] },
      { feature: "Financial visibility", ref: "f01", values: [false, true, true, true, true] },
      { feature: "Financial KPI tracking", ref: "f03", values: [false, true, true, true, true] },
      { feature: "Cost optimisation", ref: "f04", values: [false, true, true, true, true] },
      { feature: "Enterprise value", ref: "f05", values: [false, false, true, true, true] },
      { feature: "Financial governance", ref: "f06", values: [false, false, false, true, true] },
      { feature: "CFO transformation", ref: "f07", values: [false, false, false, true, true] },
      { feature: "Finance dashboard", ref: "finance-dashboard", values: [false, true, true, true, true] },
      { feature: "Actuals tracking against budget", values: [false, true, true, true, true] },
    ],
  },
  {
    group: "LAMID DESK — client and revenue operations",
    rows: [
      { feature: "Contacts and organisations", values: ["50 contacts", true, true, true, true] },
      { feature: "Engagement pipeline", values: [false, true, true, true, true] },
      { feature: "Proposal builder", ref: "premium/proposal-drafter", values: [false, true, true, true, true] },
      { feature: "Quotes", values: [false, true, true, true, true] },
      { feature: "Contract generation", note: "PDF", values: [false, true, true, true, true] },
      { feature: "Milestone management", values: [true, true, true, true, true] },
      { feature: "Invoicing", values: [false, true, true, true, true] },
      { feature: "Payments — card and subscription", note: "Stripe", values: [true, true, true, true, true] },
      { feature: "Payments — local rails", note: "Paystack", values: [true, true, true, true, true] },
      { feature: "Wallet and transaction history", values: [true, true, true, true, true] },
      { feature: "Shared inbox", values: [false, false, true, true, true] },
      { feature: "Ticketing", values: [false, true, true, true, true] },
      { feature: "Client portal", values: [false, true, true, true, true] },
      { feature: "Portfolio view", values: [false, false, true, true, true] },
    ],
  },
  {
    group: "LAMID SIGNAL — market visibility and content",
    rows: [
      { feature: "AI visibility check", note: "free tool", values: [true, true, true, true, true] },
      { feature: "Answer-engine visibility tracking", values: [false, "1 brand", "3 brands", "Unlimited", false] },
      { feature: "Citation analysis", values: [false, false, true, true, false] },
      { feature: "Content drafting", note: "Runs on Points", values: [false, true, true, true, false] },
      { feature: "Brand voice", values: [false, false, true, true, false] },
      { feature: "Campaign builder", values: [false, false, true, true, false] },
      { feature: "Landing pages", values: [false, "3", "25", "Unlimited", false] },
      { feature: "Enquiry forms onto the DESK pipeline", values: [false, true, true, true, false] },
      { feature: "Event management and bookings", values: [false, true, true, true, false] },
      { feature: "Newsletter and consent management", values: [false, true, true, true, false] },
      { feature: "Performance reporting", values: [false, "Basic", true, true, false] },
    ],
  },
  {
    group: "LAMID MARKET — expert marketplace",
    rows: [
      { feature: "Browse the vetted expert network", values: [true, true, true, true, true] },
      { feature: "Expert profiles with engagement history", values: [true, true, true, true, true] },
      { feature: "Post a project", note: "50 pts each", values: ["3 / month", true, "Unlimited", "Unlimited", "Unlimited"] },
      { feature: "Expert matching", note: "30 pts", values: ["Automatic", "Manual trigger", "Manual trigger", "Manual trigger", "AI + human curated"] },
      { feature: "Project estimation from comparables", values: [false, true, true, true, true] },
      { feature: "Direct hire without a brief", values: [false, true, true, true, true] },
      { feature: "Bid review and acceptance", values: [true, true, true, true, true] },
      { feature: "Engagement workspace and messaging", values: [true, true, true, true, true] },
      { feature: "Milestone escrow", values: [true, true, true, true, true] },
      { feature: "Automatic release policy", values: [false, true, true, true, true] },
      { feature: "Dispute resolution", values: ["Standard", "Standard", "Assisted", "Assisted", "Managed"] },
      { feature: "Reviews and ratings", values: [true, true, true, true, true] },
      { feature: "Curated expert collections", values: [false, true, true, true, true] },
      { feature: "Concierge sourcing with assigned manager", values: [false, false, false, true, true] },
    ],
  },
  {
    group: "AI agents",
    blurb: "Charged per completed outcome in LAMID Points. See the agent directory for per-outcome costs.",
    /* Rows are GENERATED from AGENTS_BY_ID (content/agents.ts) below,
       not hardcoded here. The matrix previously spelled out "Diagnostic
       Agent", "Matching Agent" etc. — the generic job names — and never
       got updated when those agents were given their real names
       (Catalyst, Compass…), so the pricing page and the agent directory
       silently disagreed. Pulling name/role/points from the one agent
       registry makes that drift structurally impossible: rename an
       agent once, every table that lists it updates together. */
    rows: agentMatrixRows(),
  },
  {
    group: "Engagement limits and commercial terms",
    blurb: "The quantitative limits that sit across MARKET and DESK.",
    rows: [
      { feature: "Simultaneous engagements", values: ["1", "3", "10", "12", "Unlimited"] },
      { feature: "Priority expert deployment", values: [false, false, true, true, true] },
      { feature: "Dedicated sourcing manager", values: [false, false, false, true, true] },
      { feature: "E-signature", values: [false, "10 / month", "50 / month", "Unlimited", "Unlimited"] },
      { feature: "Multi-currency checkout", note: "9 currencies", values: [true, true, true, true, true] },
      { feature: "Custom contracts and legal templates", values: [false, false, false, true, true] },
      { feature: "Document share and controlled exchange", values: [false, true, true, true, true] },
    ],
  },
  {
    group: "Analytics and reporting",
    rows: [
      { feature: "Dashboard", values: ["Basic", "Basic", "Advanced", "Advanced", "Custom"] },
      { feature: "Suite dashboards", values: [false, "2 suites", "All suites", "All suites", "All suites"] },
      { feature: "AI-generated reports", values: [false, false, true, true, true] },
      { feature: "Executive and board reporting", values: [false, false, true, true, true] },
      { feature: "Custom impact and KPI dashboards", values: [false, false, false, "Limited", true] },
      /* Was "CSV / CSV / CSV, PDF / CSV, PDF, API". CSV is real on
         every tier (lib/engineExport.ts). PDF export of a MODEL is not
         built — only invoices render as PDF — and there is no export
         API. Promising both in the tier matrix is exactly the kind of
         claim the trust centre exists to prevent. */
      { feature: "Data export", values: ["CSV", "CSV", "CSV", "CSV", "CSV"] },
      { feature: "API access", values: [false, false, "Read", "Read / write", "Read / write"] },
    ],
  },
  {
    group: "LAMID LEARN — learning management",
    blurb:
      "The multi-tenant learning platform (learn-by-lamid). Structured programmes, live events, AI tutoring and certified outcomes.",
    rows: [
      { feature: "Course catalogue access", values: ["Public courses", true, true, true, true] },
      { feature: "Structured programmes", values: ["1 path", "5 paths", "Unlimited", "Unlimited", "Unlimited"] },
      { feature: "Live events and cohort sessions", values: [false, "Attend", "Attend", "Attend and host", "Attend and host"] },
      { feature: "AI tutor", ref: "Runs on LAMID Points", values: [false, true, true, true, true] },
      { feature: "Certification and certified outcomes", values: [false, "1 seat", "All seats", "All seats", "All seats"] },
      { feature: "Assessment against real platform work", values: [false, true, true, true, true] },
      { feature: "Instructor and author tools", values: [false, false, false, true, true] },
      { feature: "Multi-tenant learning workspace", values: [false, false, false, true, true] },
      { feature: "Learner progress and completion reporting", values: ["Self only", "Self only", "Team", "Organisation", "Organisation"] },
      { feature: "Playbook and template library", values: ["Public only", true, true, true, true] },
      { feature: "Custom branded learning portal", values: [false, false, false, "Option", true] },
      { feature: "Quarterly strategy reviews", values: [false, false, false, false, true] },
    ],
  },
  {
    group: "LAMID DOCUSHARE — files, workspaces and sharing",
    blurb:
      "The file infrastructure layer (HybridShare). Storage add-ons are priced separately from seats — see the DocuShare pricing page.",
    rows: [
      { feature: "Local storage included", values: ["5 GB", "50 GB", "500 GB", "Unlimited", "Unlimited"] },
      { feature: "Cloud storage add-on", values: ["+$5 / mo → 50 GB", "+$10 / mo → 500 GB", "+$25 / mo → 2 TB", "+$50 / mo → 10 TB", "Negotiated"] },
      { feature: "Workspace members", values: ["1", "Up to 5", "Up to 20", "Unlimited", "Unlimited"] },
      { feature: "Team, project and department workspaces", values: [false, true, true, true, true] },
      { feature: "File versioning", values: [true, true, true, true, true] },
      { feature: "Fine-grained member permissions", values: [false, true, true, true, true] },
      { feature: "Role-based access", note: "Owner, Admin, Editor, Viewer", values: ["Owner only", true, true, true, true] },
      { feature: "Password-protected share links", values: [false, true, true, true, true] },
      { feature: "Link expiry dates and download limits", values: [false, true, true, true, true] },
      { feature: "Share view analytics", note: "Geo and device", values: [false, "Basic", true, true, true] },
      { feature: "Connectors", note: "Google Drive, OneDrive, Dropbox, databases, REST", values: [false, "2 connectors", "Unlimited", "Unlimited", "Unlimited"] },
      { feature: "Data classification", values: [false, false, true, true, true] },
      { feature: "Audit logs", values: [false, "30 days", "1 year", "Unlimited", "Unlimited"] },
      { feature: "Storage and access reporting", values: [false, "Basic", true, true, true] },
      { feature: "REST API, webhooks and SDKs", values: [false, false, "Read", true, true] },
      { feature: "SAML 2.0 SSO", values: [false, false, false, true, true] },
      { feature: "SCIM provisioning", values: [false, false, false, true, true] },
      { feature: "Custom domain and white-labelling", values: [false, false, false, true, true] },
    ],
  },
  {
    group: "Security, governance and compliance",
    rows: [
      { feature: "Encryption in transit and at rest", values: [true, true, true, true, true] },
      { feature: "Two-factor authentication", values: [true, true, true, true, true] },
      { feature: "Audit and activity log", values: [false, "30 days", "1 year", "Unlimited", "Unlimited"] },
      { feature: "Field-level permissions", values: [false, false, false, true, true] },
      { feature: "Approval workflows", values: [false, false, "Basic", true, true] },
      { feature: "Data residency", note: "Region selection", values: [false, false, false, true, true] },
      { feature: "Uptime commitment", values: [false, false, false, "99.9%", "99.9%"] },
      { feature: "White-label portal", values: [false, false, false, "Option", true] },
    ],
  },
  {
    group: "Support and services",
    rows: [
      { feature: "Support channel", values: ["Community", "Email", "Email and chat", "Priority, 24/7", "Priority, 24/7"] },
      { feature: "First response target", values: ["—", "2 business days", "8 business hours", "1 hour", "2 hours, any time"] },
      { feature: "Onboarding", values: ["Self-serve", "Self-serve", "Guided", "Managed", "Managed"] },
      { feature: "Dedicated account director", values: [false, false, false, true, true] },
      { feature: "Dedicated delivery manager", values: [false, false, false, false, true] },
      { feature: "Migration assistance", values: [false, false, false, true, true] },
    ],
  },
];

/* ───────────────────────────────────────────────────────────────
   SUPPLY SIDE — the expert programme
   Modelled on a partner programme: membership rather than
   pay-per-lead, multi-year revenue share, and a client-facing fee
   the expert can waive at our expense — which buys loyalty far more
   cheaply than a larger commission would (teardown §7.4).
   ─────────────────────────────────────────────────────────────── */

export const EXPERT_PROGRAM = {
  eyebrow: "For experts",
  title: "List your practice. Keep the relationship.",
  blurb:
    "Experts pay for membership, not for leads. You keep a share of every engagement you source for three years, and you can waive your client's onboarding fee at our cost.",
  tiers: [
    {
      id: "expert-free",
      name: "Listed",
      price: { monthly: 0, annual: 0, unit: "", confirmed: true },
      rank: 0 as const,
      pointsGrant: 100,
      cta: { label: "Create a profile", href: "/signup?role=expert" },
      features: [
        "100 points on signup",
        "Public expert profile",
        "Bid on open projects — 20 pts per bid",
        "Apply to up to 10 projects per month",
        "Basic earnings analytics",
        "In-app messaging and workspace",
        "Milestone escrow on every engagement",
        "Standard support",
      ],
    },
    {
      id: "expert-pro",
      name: "Practising",
      price: { monthly: 49, annual: 499, unit: "per month", confirmed: true },
      rank: 1 as const,
      pointsGrant: 500,
      recommended: true,
      cta: { label: "Join the programme", href: "/for-experts/join" },
      features: [
        "500 points on signup, refilled monthly",
        "Unlimited project applications",
        "Boost a bid — 60 pts, 2× visibility",
        "Priority placement in matched shortlists",
        "AI-assisted profile optimisation",
        "Predictive project-fit scoring",
        "Advanced earnings dashboard",
        "Early access to new briefs",
        "LAMID certification included — 1 seat",
        "Listed in curated collections",
        "20% revenue share for 3 years on sourced engagements",
        "Waive your client's onboarding fee, up to $2,000",
        "24/7 priority support",
      ],
    },
  ],
} as const;

/* ───────────────────────────────────────────────────────────────
   RUNTIME MAPPING
   Keeps this content layer honest against the existing gate in
   ProdLamid's `lib/services/tierService.ts`, so marketing claims and
   enforced entitlements cannot drift apart.
   ─────────────────────────────────────────────────────────────── */

export const RUNTIME_TIER_MAP: Record<TierId, string> = {
  free: "free",
  starter: "premium",
  growth: "premium",
  enterprise: "enterprise",
  concierge: "enterprise_plus",
};

/**
 * Feature keys enforced by `tierService.hasFeature()`. Listed here so a
 * marketing row can be traced to the gate that actually enforces it.
 * `admin` is a role, not a purchasable tier, and is deliberately absent
 * from every customer-facing surface.
 */
export const RUNTIME_FEATURE_KEYS = [
  "ai_matching",
  "ai_project_match",
  "advanced_analytics",
  "unlimited_projects",
  "priority_support",
  "ai_preferences",
  "white_label",
  "org_dashboard",
  "dedicated_account",
] as const;

/**
 * Support response targets, keyed by tier.
 *
 * Lives in the content layer (not lib/tickets.ts) specifically so it
 * has zero server-only imports. lib/tickets.ts pulls in lib/store.ts,
 * which pulls in the `mongodb` driver — fine on the server, but if a
 * "use client" page imports anything from tickets.ts, Next bundles
 * mongodb (which needs Node's `tls`) into the BROWSER build and the
 * build fails. This constant is the one piece of that module a client
 * component legitimately needs, so it is kept import-safe on its own.
 */
export const RESPONSE_TARGET: Record<TierId, string> = {
  free: "Community support only",
  starter: "2 business days",
  growth: "8 business hours",
  enterprise: "1 hour",
  concierge: "2 hours, any time",
};

export const responseTargetFor = (tier: TierId) => RESPONSE_TARGET[tier];

export const BILLING_FOOTNOTE =
  "Discount available to new customers only, for a limited time. Seat price follows your account tier. Prices shown exclude applicable tax. Agent and marketplace usage runs on LAMID Points; paid plans include a monthly allowance.";
