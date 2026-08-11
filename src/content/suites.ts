/**
 * The suite registry — LAMID ONE's noun tree.
 *
 * Adding a suite here creates its page, its nav entry, its pricing column
 * and its footer link. Removing one removes all four. No component holds
 * suite content.
 *
 * COMPRESSION RULE (teardown §2): ProdLamid exposes ~400 engine routes
 * (q01–q100, p01–p30, r01–r30, a08–a32, f01–f07, s01–s12, x01–x07,
 * z01–z15). None of those belong in navigation. They roll up into the
 * suites below and live *inside* a suite page or the app. HubSpot shows
 * 12 products, not 12,000 features.
 *
 * AUDIENCE: `enterprise` suites carry the original four. `smb` marks the
 * four added in this rebuild to close the small-business gap — see
 * ADDED_FOR_SMB at the foot of this file for the rationale.
 */

import type { LucideIcon } from "lucide-react";
import {
  Network, TrendingUp, GraduationCap, Landmark,
  Inbox, Radar, BookOpen, Store,
} from "lucide-react";

export type SuiteId =
  | "core" | "grow" | "talent" | "finance"
  | "desk" | "signal" | "learn" | "market" | "docushare";

export type Stat = { value: string; label: string; verified: boolean };

export type UseCaseBlock = {
  eyebrow: string;
  /** Serif H2. Sentence-shaped, ends in a full stop. */
  title: string;
  body: string;
  /** Red-bullet list. 3–4 items, each a thing the reader gets. */
  bullets: string[];
  /** Stats travel WITH the claim they support (teardown §7.9 #3) —
   *  not collected into one band at the foot of the page. */
  stats: Stat[];
  /**
   * Why the process should produce the claim above, stated without a
   * number — same voice as `methods.ts`'s `whyNotAverage`. Rendered
   * only where `stats` carries an unverified entry, so an unverified
   * claim is never left with nothing behind it while we wait for a
   * real figure to verify it with (see brand.ts's placeholder policy).
   */
  mechanism?: string;
  image?: string;
  learnMore?: { label: string; href: string };
};

export type Feature = { name: string; description: string; routePrefix?: string };

export type ComparisonRow = {
  capability: string;
  /** true = includes · "partial" = partial/inconsistent · false = absent.
   *  The middle state is what makes the table credible: a comparison
   *  where the alternative scores zero everywhere reads as propaganda. */
  values: (true | false | "partial")[];
};

export type Suite = {
  id: SuiteId;
  name: string;
  /** Plain-words category, always present under the name. */
  kind: string;
  audience: "enterprise" | "smb" | "both";
  tint: string;
  Icon: LucideIcon;
  /** H1. Mature offering → keyword-led. New offering → conversational. */
  headline: string;
  subhead: string;
  /** Route prefixes in ProdLamid this suite rolls up. */
  rollsUp: string[];
  engineCount: number;
  useCases: UseCaseBlock[];
  features: Feature[];
  comparison: { headline: string; blurb: string; columns: string[]; rows: ComparisonRow[] };
  /** Which platform tiers this suite is sold in. See tiers.ts. */
  tiers: string[];
  closing: { title: string; body: string };
  /**
   * Externally hosted products. The suite still gets a full page inside
   * the ecosystem — navigable, priced, in the grid — but every CTA on it
   * opens the live app in a new tab. `<ExternalLaunch />` renders the
   * target host and an external-link affordance so the jump is never a
   * surprise.
   */
  external?: { url: string; appName: string; label: string };
  /**
   * Static dashboard-preview asset, /public/screenshots/{id}-dashboard.svg.
   *
   * These are illustrative previews built in the same visual language
   * as the live in-page mockups (components/mock/ProductMock.tsx) —
   * NOT captures of a running application. Every page that renders one
   * says so in its alt text, because implying a live screenshot when
   * none was taken is exactly the kind of claim this build refuses to
   * make elsewhere (see the outcome-stat and case-study empty states).
   */
  dashboardScreenshot: string;
  /**
   * Page treatment. `standard` is the eight-suite template.
   * `studio` is the variant used for externally hosted products — same
   * type scale, same grid, same CTA grammar, but a tinted full-bleed
   * hero with an angular mask instead of a product screenshot. Different
   * atmosphere, identical system (teardown §7.7).
   */
  treatment?: "standard" | "studio";
};

/* ───────────────────────────────────────────────────────────────
   THE FOUR ORIGINAL SUITES (enterprise-facing)
   ─────────────────────────────────────────────────────────────── */

export const CORE: Suite = {
  id: "core",
  dashboardScreenshot: "/screenshots/core-dashboard.svg",
  name: "LAMID CORE",
  kind: "Strategy and execution software",
  audience: "both",
  tint: "#1A7CFF",
  Icon: Network,
  headline: "Human-AI Fusion: The Operating System for Modern Consulting",
  subhead:
    "Decision intelligence, operating rhythm, and governance on one layer — so the plan you agreed and the work you're doing stay the same thing.",
  rollsUp: ["q", "p", "r", "s", "x", "z", "core"],
  engineCount: 194,
  useCases: [
    {
      eyebrow: "Decision intelligence",
      title: "Make the decision, then show your working.",
      body:
        "Map the decision, weigh it against the factors that apply, and keep the rationale attached to the outcome. Six months later, you pull the record — you don't have to trust someone's memory.",
      bullets: [
        "Map options, factors and weightings before you commit",
        "See where a decision is stalling, and who it's waiting on",
        "Keep the rationale attached to the decision, permanently",
        "Detect decisions you keep remaking under a different name",
        "Ground it in the math, statistics and financial logic a board would check",
      ],
      stats: [
        { value: "100", label: "decision engines in the suite", verified: true },
        { value: "—", label: "faster to a signed-off decision", verified: false },
      ],
      mechanism: "A decision usually stalls because nobody can see where it's stuck, not because the analysis is slow. Making the stall visible — who it's waiting on, and why — is what closes the gap, whatever the eventual number turns out to be.",
      learnMore: { label: "Learn more about decision intelligence", href: "/suites/core#decision" },
    },
    {
      eyebrow: "Operating rhythm",
      title: "Find the cadence your organisation actually runs at.",
      body:
        "Most plans fail on tempo, not strategy. Cadence mapping shows the real rhythm of delivery, flags drift before it compounds, and names the team that's out of sync.",
      bullets: [
        "See your real delivery pace — not the one in the plan",
        "Get alerted the moment a team's cadence drifts",
        "Track workload balance across every unit",
        "Run coherence checks between strategy, execution and leadership",
        "Send drift straight to FINANCE, before it's a forecast problem",
      ],
      stats: [
        { value: "30", label: "cadence engines from mapping to governance", verified: true },
        { value: "—", label: "reduction in schedule drift", verified: false },
      ],
    },
    {
      eyebrow: "Governance and assurance",
      title: "Prove the controls without stopping the work.",
      body:
        "Keep authority, policy and compliance status live — don't assemble it the week before an audit.",
      bullets: [
        "Hold your decision authority matrix as live data",
        "Track policy and compliance rules against real activity",
        "Prove continuity and resilience posture on demand",
        "Get structured governance frameworks at software speed — not a 12-week wait",
        "Turn chaotic tasks into organised, trackable systems",
      ],
      stats: [{ value: "7", label: "governance and assurance engines", verified: true }],
    },
    {
      eyebrow: "Engagement workflow",
      title: "One flow from first conversation to final invoice.",
      body:
        "Onboarding, discovery, strategy, delivery and closure run as one sequence, not five disconnected tools — the diagnostic that opened the conversation is still attached when the invoice goes out. Judgement stays on the decision. The paperwork runs itself.",
      bullets: [
        "Onboarding — post the brief, sign the contract, collect the retainer in DESK",
        "Discovery — interview stakeholders and map the bottlenecks with CORE's diagnostics",
        "Strategy — commit to a recommendation, with the rationale attached",
        "Implementation — track milestones and deliverables through DESK",
        "Closure — report, review and invoice, from the same record",
      ],
      stats: [{ value: "5", label: "connected stages, one record throughout", verified: true }],
    },
  ],
  features: [
    { name: "Decision landscape mapping", description: "See every open decision, its owner, its stage, and what it blocks.", routePrefix: "q01" },
    { name: "Scenario explorer", description: "Model outcomes across scenarios and compare them side by side.", routePrefix: "q12" },
    { name: "Decision clarity score", description: "Score how well-formed a decision is before it goes to the room.", routePrefix: "q44" },
    { name: "Root cause tracer", description: "Trace an outcome back through the decisions that produced it.", routePrefix: "q13" },
    { name: "Operating rhythm", description: "Map the cadence each team actually runs at, and where they diverge.", routePrefix: "r01" },
    { name: "Cadence drift alert", description: "Get told when delivery tempo moves away from plan.", routePrefix: "r03" },
    { name: "Strategic alignment", description: "Hold strategy, priorities and execution against one another.", routePrefix: "s01" },
    { name: "Executive console", description: "One board-level view of decisions, cadence and risk.", routePrefix: "core-executive-console" },
    { name: "Change management", description: "Run change programmes with the decisions that drive them attached.", routePrefix: "core-change-management" },
    { name: "Decision authority matrix", description: "Define and enforce who can decide what, at what threshold.", routePrefix: "q98" },
    { name: "Policy and compliance rules", description: "Keep policy rules live against real organisational activity.", routePrefix: "q97" },
    { name: "Transformation tracking", description: "Track transformation progress, drift and stability over time.", routePrefix: "z01" },
  ],
  comparison: {
    headline: "Strategy decks go stale. LAMID CORE stays current.",
    blurb:
      "Most organisations run strategy in slides and execution in a project tool, with nothing holding the two together. CORE keeps the decision, the rationale and the delivery rhythm in one place.",
    columns: ["LAMID CORE", "Strategy consultants", "Project tools"],
    rows: [
      { capability: "Decision rationale retained after the engagement ends", values: [true, false, false] },
      { capability: "Updates as the business moves, not once a year", values: [true, false, "partial"] },
      { capability: "Connects strategy to delivery cadence", values: [true, "partial", "partial"] },
      { capability: "Governance and authority held as live data", values: [true, false, false] },
      { capability: "Priced per outcome, not per consultant day", values: [true, false, "partial"] },
    ],
  },
  tiers: ["free", "starter", "growth", "enterprise", "concierge"],
  /* Was "Put your strategy back in one direction." / "Start with a
     diagnostic and see where the drift is." — replaced with the
     reference design's framing, then adjusted a second time when the
     button this band opens changed from Q44 (a 3-minute self-serve
     tool) to /demo (a live working session — see the note on
     SUITE_DIAGNOSTIC.core in the suite page template). "Takes three
     minutes" was true of Q44 and would not be true of a working
     session, so the body now describes what /demo itself promises
     rather than a duration that no longer applies to what the button
     opens. Did not borrow the reference design's "Strategic Readiness
     Score" name either — the thing Q44 actually computes is the
     Decision Clarity Score, and naming the wrong score would be the
     same overclaim already corrected on the homepage's own closing
     band. */
  closing: { title: "See where your strategy actually stands.", body: "A working session on your own numbers. No slide deck, no commitment." },
};

export const GROW: Suite = {
  id: "grow",
  dashboardScreenshot: "/screenshots/grow-dashboard.svg",
  name: "LAMID GROW",
  kind: "Digital Growth & Advisory",
  audience: "both",
  tint: "#1A7CFF",
  Icon: TrendingUp,
  headline: "Where People and AI Build the Future — Helping Organisations Grow Smarter and Faster",
  subhead:
    "Watch how customers find you, engage you and stay — and see where growth is compounding versus where it is leaking.",
  rollsUp: ["grow", "z"],
  engineCount: 24,
  useCases: [
    {
      eyebrow: "Market intelligence",
      title: "Know where the opportunity is before the quarter tells you.",
      body:
        "Opportunity signals, market timing and digital maturity, assessed continuously — so you know demand is building, not just that it already did. Built on advisory experience across African and emerging markets, not a template written for somewhere else.",
      bullets: [
        "Track opportunity signals across your markets",
        "Assess digital maturity against where you need to be",
        "See which growth pathways are open to you",
        "Read competitive positioning as it updates — not once a quarter",
        "Check it against CORE's own decision record — no deck to reconcile",
      ],
      stats: [{ value: "—", label: "faster to identify a market shift", verified: false }],
      mechanism: "A quarterly report can only describe a shift that already happened. Reading the same signals continuously, instead of on a commissioning cycle, is what makes 'faster' structurally true rather than a hoped-for outcome.",
    },
    {
      eyebrow: "Growth planning",
      title: "Plan growth you can resource.",
      body:
        "The growth planner ties ambition to capacity, so the plan you sign off is one your people, cash and operating rhythm can genuinely sustain.",
      bullets: [
        "Build a growth plan against real capacity",
        "Model modernisation paths and what each requires",
        "Report progress to the board without rebuilding the deck",
        "Replace manual processes with automated structures",
        "Carry FINANCE's KPIs through to revenue — plan and forecast never disagree",
      ],
      stats: [{ value: "—", label: "of growth plans delivered on schedule", verified: false }],
    },
    {
      eyebrow: "Advisory and scaling",
      title: "Build structures that hold as you get bigger, not after.",
      body:
        "Turn ambition into a structure that can carry growth — restructuring, business modelling and market-expansion guidance from modernisation frameworks and expert advisory, for a business that grows predictably and stays lean.",
      bullets: [
        "Tie modernisation frameworks to your actual operating model",
        "Get advisory on restructuring, business modelling and market expansion",
        "Drive innovation with hybrid intelligence, not headcount alone",
        "Grow predictably. Stay lean.",
      ],
      stats: [{ value: "8", label: "features from market intelligence to transformation tracking", verified: true }],
    },
  ],
  features: [
    { name: "Market intelligence", description: "Continuous read on the markets you operate in.", routePrefix: "grow-market-intelligence" },
    { name: "Opportunity signals", description: "Surface openings while they are still open.", routePrefix: "grow-opportunity-signals" },
    { name: "Digital maturity", description: "Score digital maturity and see the gap to target.", routePrefix: "grow-digital-maturity" },
    { name: "Growth planner", description: "Tie growth ambition to real capacity and cash.", routePrefix: "grow-planner" },
    { name: "Modernisation pathways", description: "Compare modernisation routes and their requirements.", routePrefix: "grow-modernisation" },
    { name: "Advisory console", description: "Run advisory engagements against live growth data.", routePrefix: "grow-advisory-console" },
    { name: "Executive report", description: "Board-ready growth reporting generated from the data.", routePrefix: "grow-executive-report" },
    { name: "Transformation engine", description: "Track transformation pace, drift and stability.", routePrefix: "z02" },
  ],
  comparison: {
    headline: "Market reports describe. LAMID GROW decides.",
    blurb: "A market report tells you what happened. GROW connects the signal to the plan, the capacity and the decision.",
    columns: ["LAMID GROW", "Market research firms", "Internal BI"],
    rows: [
      { capability: "Signals tied to a resourced plan", values: [true, false, "partial"] },
      { capability: "Continuous rather than commissioned", values: [true, false, true] },
      { capability: "Board reporting generated, not rebuilt", values: [true, "partial", "partial"] },
      { capability: "Growth ambition checked against capacity", values: [true, false, false] },
    ],
  },
  tiers: ["free", "starter", "growth", "enterprise", "concierge"],
  closing: { title: "Find where your growth is leaking.", body: "The diagnostic maps it in under ten minutes." },
};

export const TALENT: Suite = {
  id: "talent",
  dashboardScreenshot: "/screenshots/talent-dashboard.svg",
  name: "LAMID TALENT",
  kind: "Human-AI Talent Intelligence & Workforce Acceleration",
  audience: "both",
  tint: "#1A7CFF",
  Icon: GraduationCap,
  headline: "People Intelligence Software That Reads Your Workforce Like Your Numbers",
  subhead:
    "Capability, risk, succession and engagement held as data — so people decisions carry the same evidence as financial ones.",
  rollsUp: ["a", "talent"],
  engineCount: 33,
  useCases: [
    {
      eyebrow: "Capability and risk",
      title: "Know which teams are strong, stretched, or at risk.",
      body:
        "Talent risk, capability uplift and bench strength — scored against the roles you need filled now, not last year's org chart.",
      bullets: [
        "Score capability against the roles you need now",
        "See which teams are carrying unsustainable load",
        "Identify flight risk before the resignation",
        "Map bench strength for every critical role",
        "Feed capability and risk straight into FINANCE's cost lines",
      ],
      stats: [
        { value: "40+", label: "signals used in capability matching", verified: false },
        { value: "33",  label: "talent engines in the suite", verified: true },
      ],
      mechanism: "A single manager's read on a team is one signal. Scoring against many named signals, rather than one person's impression, is what keeps a capability read from collapsing into whoever spoke last in the room.",
    },
    {
      eyebrow: "Succession and pathways",
      title: "Build the bench before you need it.",
      body:
        "Succession pipelines, career pathing and leadership uplift, run as a system — not a spreadsheet rebuilt every cycle.",
      bullets: [
        "Hold live succession pipelines for critical roles",
        "Give people a visible path, and track movement along it",
        "Target leadership development where the gap actually is",
      ],
      stats: [{ value: "—", label: "of critical roles with a ready successor", verified: false }],
    },
  ],
  features: [
    { name: "Talent risk", description: "Score and monitor workforce risk continuously.", routePrefix: "a08" },
    { name: "Talent opportunity", description: "Find capability you already have and are not using.", routePrefix: "a09" },
    { name: "Performance alignment", description: "Hold performance against the strategy it should serve.", routePrefix: "a24" },
    { name: "Succession pipeline", description: "Live succession cover for every critical role.", routePrefix: "a21" },
    { name: "Bench strength", description: "Know your depth before someone resigns.", routePrefix: "a22" },
    { name: "Career pathing", description: "Visible paths, tracked movement.", routePrefix: "a25" },
    { name: "Mentorship", description: "Match and track mentoring relationships.", routePrefix: "api/talent/mentorship" },
    { name: "Workforce forecasting", description: "Forecast headcount and capability against the plan.", routePrefix: "a26" },
    { name: "Engagement signals", description: "Read engagement from behaviour, not just surveys.", routePrefix: "a27" },
    { name: "Behavioural competency", description: "Assess competency on evidence rather than impression.", routePrefix: "a23" },
    { name: "Leadership uplift", description: "Target leadership development at the measured gap.", routePrefix: "a16" },
    { name: "Talent acceleration", description: "Four-stage acceleration for high-potential people.", routePrefix: "a17" },
    { name: "Workforce readiness", description: "Score readiness for what is coming, not what happened.", routePrefix: "talent-workforce-readiness" },
  ],
  comparison: {
    headline: "An HRIS records people. LAMID TALENT reads them.",
    blurb: "Your HR system knows who works here and what they are paid. TALENT knows who is at risk, who is ready, and where the bench is thin.",
    columns: ["LAMID TALENT", "HRIS / payroll", "Annual engagement survey"],
    rows: [
      { capability: "Capability scored against roles you need now", values: [true, false, false] },
      { capability: "Continuous rather than annual", values: [true, "partial", false] },
      { capability: "Succession cover held as live data", values: [true, "partial", false] },
      { capability: "Connects people risk to business risk", values: [true, false, false] },
      { capability: "Evidence trail for people decisions", values: [true, "partial", false] },
    ],
  },
  tiers: ["free", "starter", "growth", "enterprise", "concierge"],
  closing: { title: "See your workforce as clearly as your P&L.", body: "Start with a capability read on one team." },
};

export const FINANCE: Suite = {
  id: "finance",
  dashboardScreenshot: "/screenshots/finance-dashboard.svg",
  name: "LAMID FINANCE",
  kind: "Financial clarity software",
  audience: "both",
  tint: "#1A7CFF",
  Icon: Landmark,
  headline: "Finance That Drives Decisions, Not Just Reports Them",
  subhead:
    "Weak visibility, fragmented budgeting, inconsistent forecasting and poor cost discipline break the link between KPIs and financial reality. LAMID FINANCE closes it — budgets, forecasts, cost structure and enterprise value computed from your figures, with the arithmetic shown, not generated.",
  rollsUp: ["f", "finance"],
  engineCount: 9,
  useCases: [
    {
      eyebrow: "Budgeting and forecasting",
      title: "Build a costed budget in minutes and watch it recalculate.",
      body:
        "Enter your figures; the engine does the arithmetic in front of you. Overhead, contingency and tax recalculate as you edit — nothing here is estimated by a model.",
      bullets: [
        "Build a costed budget for any project in minutes",
        "Watch overhead, contingency and tax recalculate live",
        "Track every line against actual spend",
        "Export the working, not just the answer",
      ],
      stats: [
        { value: "0", label: "figures generated by a model — all arithmetic is shown", verified: true },
        { value: "—", label: "faster to a board-ready budget", verified: false },
      ],
      mechanism: "A board pack is usually slow because someone is re-deriving numbers that already exist elsewhere. Recalculating live from figures you enter once, instead of rebuilding a deck from several sources, is what removes that step.",
      learnMore: { label: "Learn more about budgeting and forecasting", href: "/suites/finance#budget" },
    },
    {
      eyebrow: "Cost and margin",
      title: "Find the cost line growing faster than your revenue.",
      body:
        "Cost optimisation surfaces waste, leakage and productivity gaps period by period on your own figures — so margin improves without cutting capability.",
      bullets: [
        "See margin move period by period on your own numbers",
        "Find the cost line outrunning revenue",
        "Get told when operating cost passes what revenue carries",
      ],
      stats: [{ value: "—", label: "margin recovered in the first two quarters", verified: false }],
    },
    {
      eyebrow: "Value and governance",
      title: "Know what the business is worth, continuously.",
      body:
        "Enterprise value, financial KPIs and financial governance held live rather than assembled for a raise or a board pack.",
      bullets: [
        "Track enterprise value as the numbers move",
        "Hold financial KPIs against target continuously",
        "Prove financial governance on demand",
        "Link CORE's decisions, GROW's growth signals and TALENT's workforce metrics to one financial outcome — not four decks that disagree",
      ],
      stats: [{ value: "9", label: "finance engines from visibility to CFO transformation", verified: true }],
    },
  ],
  features: [
    { name: "Financial visibility", description: "One live read on the financial position.", routePrefix: "f01" },
    { name: "Budgeting and forecasting", description: "Costed budgets and forecasts with the arithmetic shown.", routePrefix: "f02" },
    { name: "Financial KPIs", description: "Hold operational, growth and workforce metrics against financial target, in one place.", routePrefix: "f03" },
    { name: "Cost optimisation", description: "Find waste and leakage without cutting capability.", routePrefix: "f04" },
    { name: "Enterprise value", description: "Track what the business is worth as it changes.", routePrefix: "f05" },
    { name: "Financial governance", description: "Controls and evidence held live.", routePrefix: "f06" },
    { name: "CFO transformation", description: "Run the finance function's own change programme.", routePrefix: "f07" },
    { name: "Finance dashboard", description: "The finance team's working view.", routePrefix: "finance-dashboard" },
  ],
  comparison: {
    headline: "A spreadsheet computes. It does not remember why.",
    blurb:
      "Spreadsheets do arithmetic well and everything else badly — no audit trail, no version anyone trusts, no link to the decision the number was for.",
    columns: ["LAMID FINANCE", "Spreadsheets", "Accounting software"],
    rows: [
      { capability: "Arithmetic shown and exportable", values: [true, true, "partial"] },
      { capability: "Forward-looking, not just historical", values: [true, "partial", false] },
      { capability: "Single version everyone works from", values: [true, false, true] },
      { capability: "Linked to the decision it supports", values: [true, false, false] },
      { capability: "Recalculates as the business moves", values: [true, "partial", false] },
    ],
  },
  tiers: ["free", "starter", "growth", "enterprise", "concierge"],
  closing: { title: "See where the money is actually working.", body: "Build one costed budget and compare it to last quarter." },
};

/* ───────────────────────────────────────────────────────────────
   ADDED IN THIS REBUILD — the small-business gap
   ─────────────────────────────────────────────────────────────── */

export const DESK: Suite = {
  id: "desk",
  dashboardScreenshot: "/screenshots/desk-dashboard.svg",
  name: "LAMID DESK",
  kind: "Client and revenue operations software",
  audience: "smb",
  tint: "#1A7CFF",
  Icon: Inbox,
  headline: "Run the client, the contract, and the cash in one place.",
  subhead:
    "Your engagements already live in LAMID ONE. Now the pipeline, the quote, the milestone and the payment do too — so nothing falls between the platform and a spreadsheet.",
  rollsUp: ["client", "projects", "escrow", "docushare", "portfolio"],
  engineCount: 12,
  useCases: [
    {
      eyebrow: "Pipeline",
      title: "See every engagement without opening four tools.",
      body:
        "Contacts, organisations, opportunities and live engagements in one pipeline — with the diagnostic that started the conversation attached to the record.",
      bullets: [
        "One pipeline from first contact to signed engagement",
        "Diagnostics and proposals attached to the record",
        "Know which engagements are stalling and why",
      ],
      stats: [{ value: "—", label: "less time spent on engagement admin", verified: false }],
      mechanism: "Admin time usually goes into re-entering the same fact into four separate systems. Keeping one pipeline record removes the re-entry — it doesn't make the underlying work faster, just singular.",
    },
    {
      eyebrow: "Quote to cash",
      title: "Quote, sign, and get paid without leaving the platform.",
      body:
        /* "run the milestones through escrow, and release payment on
           approval" claimed client funds are held pending approval —
           they are not (see the ⚠️ note in lib/milestones.ts). Approval
           releases the amount to the expert's withdrawable balance;
           nothing is captured up front. Rewritten to say what actually
           happens. */
        "Build the scope from the diagnostic, send it for signature, and track milestones through to invoice. The contract record and the delivery record are the same record.",
      bullets: [
        "Generate scoped proposals from diagnostic output",
        "Milestones you approve, one at a time, before payment releases",
        "Invoices and payment status current in one view",
        "Full contract history for renewal and dispute",
      ],
      stats: [{ value: "—", label: "faster from proposal to first payment", verified: false }],
    },
    {
      eyebrow: "Service",
      title: "Answer the client before they have to chase.",
      body:
        "Shared inbox, ticketing and a client portal so questions about scope, milestone status and invoices resolve without a meeting.",
      bullets: [
        "Shared inbox across the delivery team",
        "Client portal for status, documents and invoices",
        "Ticketing with the engagement context attached",
      ],
      stats: [{ value: "—", label: "of client questions resolved without a call", verified: false }],
    },
  ],
  features: [
    { name: "Contacts and organisations", description: "One record per client, shared across the team." },
    { name: "Engagement pipeline", description: "Track opportunities from first contact to signature." },
    { name: "Proposal builder", description: "Scoped proposals generated from diagnostic output.", routePrefix: "premium/proposal-drafter" },
    { name: "Quotes and e-signature", description: "Send, track and countersign without a third tool." },
    { name: "Milestone tracking", description: "Released to the collaborator the moment you approve each deliverable.", routePrefix: "escrow" },
    { name: "Invoicing", description: "Invoices that reflect the real contract and its changes." },
    { name: "Payments", description: "Card, transfer and local rails with live status." },
    { name: "Shared inbox", description: "Team-wide client communication in one thread." },
    { name: "Ticketing", description: "Client issues logged, assigned and tracked." },
    { name: "Client portal", description: "Status, documents and invoices, self-serve.", routePrefix: "client" },
    { name: "Document share", description: "Controlled document exchange per engagement.", routePrefix: "docushare" },
    { name: "Portfolio view", description: "Every engagement across the account in one read.", routePrefix: "portfolio" },
  ],
  comparison: {
    headline: "Point tools bolt on. LAMID DESK is built in.",
    blurb:
      "Most firms run the client in a CRM, the contract in a document tool, and the money in a spreadsheet — three systems that never agree. DESK holds all three against the engagement they belong to.",
    columns: ["LAMID DESK", "Point solutions", "Spreadsheets"],
    rows: [
      { capability: "Connected engagement to contract to payment", values: [true, false, false] },
      { capability: "Diagnostic context available on the client record", values: [true, false, false] },
      { capability: "Milestones with approval-gated release", values: [true, "partial", false] },
      { capability: "One record for delivery and commercials", values: [true, false, "partial"] },
      { capability: "Works without a systems integrator", values: [true, "partial", true] },
    ],
  },
  tiers: ["free", "starter", "growth", "enterprise", "concierge"],
  closing: { title: "Stop reconciling three systems.", body: "Bring the client, the contract and the cash together." },
};

export const SIGNAL: Suite = {
  id: "signal",
  dashboardScreenshot: "/screenshots/signal-dashboard.svg",
  name: "LAMID SIGNAL",
  kind: "Market visibility and content software",
  audience: "smb",
  tint: "#1A7CFF",
  Icon: Radar,
  headline: "Be findable when buyers ask an AI instead of a search engine.",
  subhead:
    "Buyers now ask an assistant before they visit your site. SIGNAL tracks how your firm appears in generated answers, and tells you what to publish to close the gap.",
  rollsUp: ["biz", "bizphere", "events", "event"],
  engineCount: 10,
  useCases: [
    {
      eyebrow: "Answer visibility",
      title: "Track how you show up in AI answers.",
      body:
        "See whether your firm appears when buyers ask an assistant about your sector — and which sources the answer is drawn from.",
      bullets: [
        "Track visibility across major AI assistants",
        "See which sources answers cite about your sector",
        "Find the questions you should be the answer to",
      ],
      stats: [{ value: "—", label: "more enquiries originating from AI referral", verified: false }],
      mechanism: "You can't act on a visibility gap you can't see. Naming which sources an assistant actually cites is what turns 'we should probably publish more' into a specific page to write.",
    },
    {
      eyebrow: "Publishing",
      title: "Publish the thing that closes the gap.",
      body:
        "Turn diagnostic findings and engagement outcomes into publishable material — case notes, sector briefings, capability pages — without starting from a blank page.",
      bullets: [
        "Draft from real engagement output, not a blank page",
        "Keep a consistent voice across everyone who publishes",
        "Track which pieces actually generate enquiries",
      ],
      stats: [{ value: "—", label: "of published pieces traced to an enquiry", verified: false }],
    },
  ],
  features: [
    { name: "Answer-engine visibility", description: "Track how your firm appears in AI-generated answers." },
    { name: "Citation analysis", description: "See which sources shape answers about your sector." },
    { name: "Content drafting", description: "Draft from engagement output rather than a blank page." },
    { name: "Brand voice", description: "Keep one voice across everyone who publishes." },
    { name: "Sector briefings", description: "Publish recurring briefings from live market data." },
    { name: "Campaign builder", description: "Plan and run campaigns against a named audience." },
    { name: "Event management", description: "Run events and track what they generate.", routePrefix: "events" },
    { name: "Landing pages", description: "Publish capability and campaign pages without a developer." },
    { name: "Enquiry forms", description: "Capture enquiries straight onto the DESK pipeline." },
    { name: "Performance reporting", description: "Which content produced enquiries, and which did not." },
  ],
  comparison: {
    headline: "SEO tools optimise for a search box that is losing traffic.",
    blurb:
      "Buyers increasingly get an answer without a click. Ranking first matters less than being the source the answer is built from.",
    columns: ["LAMID SIGNAL", "Traditional SEO tools", "Agency retainer"],
    rows: [
      { capability: "Tracks visibility inside AI-generated answers", values: [true, "partial", false] },
      { capability: "Drafts from your own engagement data", values: [true, false, "partial"] },
      { capability: "Enquiries land directly on your pipeline", values: [true, false, false] },
      { capability: "Runs without a monthly retainer", values: [true, true, false] },
    ],
  },
  tiers: ["free", "starter", "growth", "enterprise"],
  closing: { title: "Find out what the assistants say about you.", body: "Run a free visibility check — no account needed." },
};

export const LEARN: Suite = {
  id: "learn",
  dashboardScreenshot: "/screenshots/learn-dashboard.svg",
  name: "LAMID LEARN",
  kind: "Learning management and certification platform",
  audience: "smb",
  tint: "#1A7CFF",
  Icon: BookOpen,
  treatment: "studio",
  external: {
    url: "https://learn-by-lamid.vercel.app/",
    appName: "LAMID Learning",
    label: "Open LAMID Learning",
  },
  headline: "Learn. Grow. Certify.",
  subhead:
    "A multi-tenant learning platform with structured programmes, live events, AI tutoring and certified outcomes — built on the same disciplines your organisation runs on, so the capability stays after the engagement ends.",
  rollsUp: ["jobs", "hcd", "core-blueprint", "talent-capability"],
  engineCount: 8,
  useCases: [
    {
      eyebrow: "Learning paths",
      title: "Teach the method, not just the tool.",
      body:
        "Paths built around the disciplines the platform runs on — decision structuring, cadence design, cost modelling, workforce planning — assessed against real work rather than a quiz.",
      bullets: [
        "Role-based paths for executives, managers and analysts",
        "Assessed against work in the platform, not a multiple choice",
        "Track capability uplift against the TALENT baseline",
      ],
      stats: [{ value: "—", label: "of learners assessed as competent within one quarter", verified: false }],
      mechanism: "A quiz can be passed without the underlying skill transferring. Assessing against real work inside the platform is what keeps 'competent' checkable rather than self-reported.",
    },
    {
      eyebrow: "Certification",
      title: "Certify the people who will run this without you.",
      body:
        "Certification for internal teams and for experts on the marketplace — so a badge on a profile means something checkable.",
      bullets: [
        "Certify internal teams on the engines they use",
        "Expert certification visible on marketplace profiles",
        "Re-certification when the method changes",
      ],
      stats: [{ value: "—", label: "certified practitioners across the network", verified: false }],
    },
  ],
  features: [
    { name: "Course catalogue", description: "Browse and enrol across the full programme library." },
    { name: "Structured programmes", description: "Sequenced paths with prerequisites and milestones." },
    { name: "Live events", description: "Cohort sessions, workshops, seminars and reskilling clinics — career and business topics both." },
    { name: "AI tutor", description: "Answers questions in context as the learner works." },
    { name: "Certified outcomes", description: "Assessed certification, not attendance badges." },
    { name: "Multi-tenant workspaces", description: "Separate learning environments per organisation." },
    { name: "Instructor and author tools", description: "Build, publish and version your own programmes." },
    { name: "Assessment against real work", description: "Marked on platform work, not a multiple choice." },
    { name: "Learner dashboard", description: "Progress, upcoming sessions and credentials in one view." },
    { name: "Cohort management", description: "Run a group through a programme together." },
    { name: "Expert credentials", description: "Certification surfaces on marketplace profiles.", routePrefix: "for-experts" },
    { name: "Completion reporting", description: "Report capability uplift at team and organisation level.", routePrefix: "api/learning/sync" },
  ],
  comparison: {
    headline: "A course teaches a topic. LAMID LEARN teaches your operating method.",
    blurb: "Generic training does not transfer. Learning built on the system you actually run does.",
    columns: ["LAMID LEARN", "Generic online courses", "Consultant knowledge transfer"],
    rows: [
      { capability: "Taught on the system you actually use", values: [true, false, "partial"] },
      { capability: "Assessed against real work", values: [true, false, "partial"] },
      { capability: "Capability retained after the engagement", values: [true, true, false] },
      { capability: "Credential visible and checkable", values: [true, "partial", false] },
    ],
  },
  tiers: ["free", "starter", "growth", "enterprise"],
  closing: { title: "Keep the capability in the building.", body: "Start a path free — the first one costs nothing." },
};

/* DOCUSHARE used to live here as a `Suite`. It doesn't anymore — see
   the header comment on content/docushare.ts for why, and
   content/docushare.ts / app/docushare/page.tsx for where its content
   and page actually live now. "docushare" stays a valid `SuiteId`
   (other content still tags things with it — platform.ts's feature
   list, aios.ts's OS_LAYER), it just no longer resolves through
   SUITES / SUITES_BY_ID / getSuite. */

export const MARKET: Suite = {
  id: "market",
  dashboardScreenshot: "/screenshots/market-dashboard.svg",
  name: "LAMID MARKET",
  kind: "Expert marketplace and sourcing software",
  audience: "both",
  tint: "#1A7CFF",
  Icon: Store,
  headline: "Source the expert, run the engagement, release the payment.",
  subhead:
    "A vetted expert network with matching, milestone-gated delivery and payout tracking — so sourcing specialist capability does not mean starting a procurement process.",
  rollsUp: ["consultant", "for-experts", "postjobs", "escrow", "concierge", "editConsultant"],
  engineCount: 14,
  useCases: [
    {
      eyebrow: "Sourcing",
      title: "Find the right expert on evidence, not a CV.",
      body:
        "Matching runs on industry, challenge type, budget, timeline and working style, and returns a shortlist you can act on rather than a directory you have to read.",
      bullets: [
        "Matched shortlists, not a search results page",
        "Verified credentials and engagement history on every profile",
        "Engagement counts published even when they are low",
      ],
      stats: [
        { value: "—", label: "experts across the network", verified: false },
        { value: "—", label: "median time to a matched shortlist", verified: false },
      ],
      mechanism: "A directory ranks on keywords typed into a search box. Matching on industry, challenge type, budget, timeline and working style together is what a shortlist needs to be usable rather than just long.",
    },
    {
      eyebrow: "Delivery and payment",
      /* Title, body and stat label all claimed client funds are HELD
         pending approval — they are not. See the ⚠️ note in
         lib/milestones.ts: approval credits the expert's withdrawable
         balance and pays out through Paystack; nothing is captured
         from the client up front. Rewritten to claim exactly what the
         product does — milestones gate the release, not a fund hold. */
      title: "Pay only for milestones you've approved.",
      body:
        "Every engagement runs on milestones you approve one at a time, released to the expert the moment you sign off — with a dispute path that does not require a lawyer.",
      bullets: [
        "Milestone-based delivery on every engagement",
        "Released only on approved deliverables",
        "Structured dispute resolution with evidence attached",
      ],
      stats: [{ value: "—", label: "value delivered through milestone-tracked engagements", verified: false }],
    },
  ],
  features: [
    { name: "Expert matching", description: "Matched shortlists on 40+ signals.", routePrefix: "api/ai/match" },
    { name: "Expert directory", description: "Browse and filter the vetted network.", routePrefix: "consultant" },
    { name: "Verified credentials", description: "Checkable credentials, selectively awarded." },
    { name: "Project posting", description: "Post a brief and receive matched bids.", routePrefix: "postjobs" },
    { name: "Bidding and boost", description: "Experts bid; boosted bids get double visibility." },
    { name: "Milestone payouts", description: "Released to the expert on approval.", routePrefix: "escrow" },
    { name: "Dispute resolution", description: "Structured path with evidence attached.", routePrefix: "api/ai/dispute-check" },
    { name: "Deliverable review", description: "Automated completeness check before approval.", routePrefix: "api/ai/deliverable-check" },
    { name: "Engagement workspace", description: "Messaging, files and milestones per engagement.", routePrefix: "workspace" },
    { name: "Expert programme", description: "Tiered programme with revenue share.", routePrefix: "for-experts" },
    { name: "Concierge sourcing", description: "Human-curated sourcing for complex briefs.", routePrefix: "concierge" },
    { name: "Curated collections", description: "Hand-picked expert collections by discipline." },
  ],
  comparison: {
    headline: "A directory lists people. LAMID MARKET runs the engagement.",
    blurb:
      "Freelance marketplaces stop at introduction and generic consultancies start at a six-figure scope. MARKET covers sourcing, delivery and payment on one record.",
    columns: ["LAMID MARKET", "Freelance marketplaces", "Consulting firms"],
    rows: [
      { capability: "Matched on discipline, not keyword search", values: [true, "partial", true] },
      { capability: "Milestone-gated release, paid out to the expert", values: [true, "partial", false] },
      { capability: "Engagement context from your own diagnostics", values: [true, false, "partial"] },
      { capability: "Engagement counts published even when low", values: [true, false, false] },
      { capability: "Priced per engagement, not per partner day", values: [true, true, false] },
    ],
  },
  tiers: ["free", "starter", "growth", "enterprise", "concierge"],
  closing: { title: "Get a matched shortlist this week.", body: "Post a brief free and see who comes back." },
};

/* ─────────────────────────────────────────────────────────── */

export const SUITES: Suite[] = [CORE, GROW, TALENT, FINANCE, DESK, SIGNAL, LEARN, MARKET];

/** Externally hosted products. Their CTAs open in a new tab. */
export const EXTERNAL_SUITES = SUITES.filter((s) => s.external);

export const SUITES_BY_ID: Record<SuiteId, Suite> = Object.fromEntries(
  SUITES.map((s) => [s.id, s]),
) as Record<SuiteId, Suite>;

export const getSuite = (id: string): Suite | undefined =>
  SUITES.find((s) => s.id === id);

/**
 * WHAT WAS MISSING FOR SMALL BUSINESS — and why each was added.
 *
 * The original four suites (CORE, GROW, TALENT, FINANCE) are all
 * enterprise-facing: they assume an organisation large enough to have a
 * strategy function, a workforce to model and a finance team. A founder
 * or a ten-person firm has none of those, so there was no entry point at
 * all below Enterprise. Four suites close that:
 *
 *  DESK   — the largest gap by far. There was NO customer or revenue
 *           operations layer anywhere in the platform: no contacts, no
 *           pipeline, no quotes, no invoicing. Escrow existed but sat
 *           unattached to any client record. Every business needs this
 *           and it is in no way specific to any one vendor.
 *  SIGNAL — no demand-generation surface existed. Visibility, content
 *           and campaigns are generic capabilities, and answer-engine
 *           visibility is now the version of it that matters.
 *  LEARN  — "learning paths" were sold in the pricing tiers but no
 *           product backed them. Capability building is also what stops
 *           an advisory platform being a permanent dependency.
 *  MARKET — the marketplace already existed in code (consultant,
 *           postjobs, escrow, concierge) but was never named as a suite,
 *           so it could not be sold, priced or navigated as one.
 */
export const ADDED_FOR_SMB: SuiteId[] = ["desk", "signal", "learn", "market"];
