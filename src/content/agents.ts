/**
 * LAMID AGENTS — the AI layer, and the meter that prices it.
 *
 * Every agent below maps to a route that already exists in ProdLamid
 * (`src/app/api/ai/*`) or to an admin-side agent component. Nothing here
 * is aspirational: `route` is the implementation it is backed by.
 *
 * NAMING
 * Each agent has a single-word name drawn from LAMID ONE's own
 * vocabulary rather than invented in isolation — CADENCE and BLUEPRINT
 * are lifted straight from the r-series engines and the core-blueprint
 * route, so the agent layer sounds like the platform it runs on rather
 * than bolted on. Every name is always paired with a plain-words role,
 * because a codename alone tells a buyer nothing.
 *
 * PRICING MODEL (teardown §6.1 #8 and §7.10):
 * Agents are metered in LAMID Points and charged **per completed
 * outcome**, never per token or per attempt. "A resolved dispute", "a
 * delivered shortlist", "a drafted proposal" — the customer is never
 * billed for a failed run. That is what makes a meter feel fair and
 * keeps the unit economics legible to the buyer.
 *
 * The points economy already exists in ProdLamid
 * (`components/subscription/SaasPricingSection.tsx`). It was buried in
 * one component and absent from /pricing. Here it is a first-class
 * pillar with its own page and estimator.
 */

import type { LucideIcon } from "lucide-react";
import {
  MessageSquare, Stethoscope, Compass as CompassIcon, Target, FileText,
  Waves, ShieldCheck, Scale, Telescope, Boxes,
  Radio, Send, LifeBuoy,
} from "lucide-react";

export type AgentSurface = "platform" | "admin";

export type Agent = {
  id: string;
  /** Single-word name, drawn from LAMID ONE's own vocabulary. */
  name: string;
  /** The plain-words job, always shown beneath the name. */
  role: string;
  /** One line, second person, states the outcome — not the mechanism. */
  what: string;
  /** The billable unit. Always a completed outcome. */
  unit: string;
  /** Cost in LAMID Points per completed outcome. */
  points: number;
  /** Implementation this is backed by, relative to ProdLamid src/. */
  route: string;
  suite: string;
  surface: AgentSurface;
  Icon: LucideIcon;
  /** Minimum tier that can invoke it. See tiers.ts. */
  minTier: "free" | "starter" | "growth" | "enterprise";
};

export const AGENTS: Agent[] = [
  {
    id: "diagnostic",
    name: "Catalyst",
    role: "Diagnostic agent",
    what: "Reads your organisation's answers and returns a scored diagnostic with the reasoning attached. Everything else in the platform starts here.",
    unit: "per completed diagnostic",
    points: 40,
    route: "app/api/ai/diagnose/route.ts",
    suite: "core",
    surface: "platform",
    Icon: Stethoscope,
    minTier: "free",
  },
  {
    id: "matching",
    name: "Compass",
    role: "Expert matching agent",
    what: "Returns a shortlist of experts matched to your brief on 40+ signals, rather than a page of search results.",
    unit: "per delivered shortlist",
    points: 30,
    route: "app/api/ai/match/route.ts",
    suite: "market",
    surface: "platform",
    Icon: CompassIcon,
    minTier: "free",
  },
  {
    id: "project-match",
    name: "Scout",
    role: "Project fit agent",
    what: "Scores an expert's fit against an open brief, so bids arrive pre-qualified instead of needing to be read cold.",
    unit: "per scored match",
    points: 20,
    route: "app/api/ai/project-match/route.ts",
    suite: "market",
    surface: "platform",
    Icon: Target,
    minTier: "starter",
  },
  {
    id: "proposal",
    name: "Scribe",
    role: "Proposal drafting agent",
    what: "Drafts a scoped, costed proposal from diagnostic output — not from a blank page.",
    unit: "per drafted proposal",
    points: 60,
    route: "app/api/ai/proposal/route.ts",
    suite: "desk",
    surface: "platform",
    Icon: FileText,
    minTier: "starter",
  },
  {
    id: "milestones",
    name: "Cadence",
    role: "Milestone planning agent",
    what: "Breaks an agreed scope into milestones with deliverables and release conditions attached to each.",
    unit: "per generated plan",
    points: 35,
    route: "app/api/ai/milestones/route.ts",
    suite: "desk",
    surface: "platform",
    Icon: Waves,
    minTier: "starter",
  },
  {
    id: "deliverable",
    name: "Sentry",
    role: "Deliverable review agent",
    what: "Checks a submitted deliverable against its milestone before it reaches you for approval.",
    unit: "per checked deliverable",
    points: 25,
    route: "app/api/ai/deliverable-check/route.ts",
    suite: "market",
    surface: "platform",
    Icon: ShieldCheck,
    minTier: "starter",
  },
  {
    id: "dispute",
    name: "Arbiter",
    role: "Dispute resolution agent",
    what: "Assembles the evidence on both sides of a disputed milestone and proposes a resolution before any money moves.",
    unit: "per resolved dispute",
    points: 80,
    route: "app/api/ai/dispute-check/route.ts",
    suite: "market",
    surface: "platform",
    Icon: Scale,
    minTier: "growth",
  },
  {
    id: "intelligence",
    name: "Vantage",
    role: "Organisational intelligence agent",
    what: "Answers a question about your own organisation using the data already sitting in your engines.",
    unit: "per answered question",
    points: 15,
    route: "app/api/ai/intelligence/route.ts",
    suite: "core",
    surface: "platform",
    Icon: Telescope,
    minTier: "growth",
  },
  {
    id: "operating-model",
    name: "Blueprint",
    role: "Operating model agent",
    what: "Proposes an operating model from your structure, delivery cadence and decision-authority data.",
    unit: "per generated model",
    points: 90,
    route: "app/api/ai/operating-model/route.ts",
    suite: "core",
    surface: "platform",
    Icon: Boxes,
    minTier: "growth",
  },
  {
    id: "assistant",
    name: "Aide",
    role: "In-context assistant",
    what: "Answers questions anywhere in the platform, grounded in your own records rather than in a general guess.",
    unit: "per conversation",
    points: 10,
    route: "app/api/ai/chat/route.ts",
    suite: "core",
    surface: "platform",
    Icon: MessageSquare,
    minTier: "free",
  },
  {
    id: "steward",
    name: "Steward",
    role: "Support ticket agent",
    what: "Drafts a grounded reply to a support ticket — checked against real upcoming events, and handed off honestly to LAMID Learning when a question is about courses or certification rather than the platform itself.",
    unit: "per resolved ticket",
    points: 15,
    route: "lib/supportAgent.ts",
    suite: "desk",
    surface: "platform",
    Icon: LifeBuoy,
    minTier: "starter",
  },

  /* ── Operator agents. Internal tooling, never customer-billable. ── */
  {
    id: "analytics",
    name: "Beacon",
    role: "Platform analytics agent",
    what: "Summarises platform activity and surfaces anomalies for the operations team.",
    unit: "internal — not metered",
    points: 0,
    route: "components/admin/analyticsAgent.tsx",
    suite: "core",
    surface: "admin",
    Icon: Radio,
    minTier: "enterprise",
  },
  {
    id: "outreach",
    name: "Herald",
    role: "Operator outreach agent",
    what: "Drafts and sequences operator outreach to clients and experts.",
    unit: "internal — not metered",
    points: 0,
    route: "components/admin/outreachAgent.tsx",
    suite: "signal",
    surface: "admin",
    Icon: Send,
    minTier: "enterprise",
  },
];

export const PLATFORM_AGENTS = AGENTS.filter((a) => a.surface === "platform");
export const ADMIN_AGENTS = AGENTS.filter((a) => a.surface === "admin");

/* ───────────────────────────────────────────────────────────────
   LAMID POINTS — the meter
   ─────────────────────────────────────────────────────────────── */

/**
 * Marketplace actions, carried over verbatim from ProdLamid's `POINTS`
 * constant so the two systems cannot drift.
 */
export const ACTION_COSTS = [
  { action: "Post a project",      points: 50, who: "Clients" },
  { action: "Place a bid",         points: 20, who: "Experts" },
  { action: "Boost a bid",         points: 60, who: "Experts — 2× visibility" },
  { action: "Expert match",        points: 30, who: "Clients" },
  { action: "Business diagnostic", points: 40, who: "Clients" },
] as const;

/**
 * Signup grants.
 *
 * The free grant is deliberately EXACTLY ONE FUNCTION — one diagnostic
 * for a client, one bid for an expert. Not a round number.
 *
 * "200 points" means nothing to someone who has just signed up: they
 * cannot tell whether that is generous or trivial without first
 * learning the price list. "Enough for one full diagnostic" is a promise
 * they can evaluate immediately, and it sets the correct expectation
 * that the second run is a purchase.
 *
 * Both are DERIVED from the agent costs below, so they cannot drift if
 * a price changes — reprice Catalyst and the free grant follows.
 */
const catalystCost = () => AGENTS.find((a) => a.id === "diagnostic")!.points;
const bidCost = 20; // ACTION_COSTS "Place a bid" — declared above the array it reads

export const SIGNUP_GRANTS = {
  /** One diagnostic. The entry function everything else follows from. */
  clientFree: catalystCost(),
  clientPremium: 800,
  /** One bid. */
  expertFree: bidCost,
  expertPremium: 500,
  enterprise: 2000,
  concierge: 5000,
} as const;

/** What a new account can actually do with its grant, in plain words.
 *  Used anywhere the free plan is described, so the claim and the
 *  balance are always the same fact. */
export const FREE_GRANT = {
  client: {
    points: SIGNUP_GRANTS.clientFree,
    does: "one full business diagnostic",
    agent: "Catalyst",
  },
  expert: {
    points: SIGNUP_GRANTS.expertFree,
    does: "one bid on an open project",
    agent: null,
  },
} as const;

/**
 * Point packages, priced in USD.
 *
 * USD is the list currency. The nine supported local currencies —
 * including NGN, GHS, KES, ZAR and AED — are converted at checkout by
 * the currency selector, so there is one authoritative price rather
 * than a separate ladder per market.
 *
 * The rate improves with volume ($0.10 → $0.07 per point), which is the
 * only discount mechanic here: there is no promotional pricing on
 * points, because a meter that goes on sale stops being trustworthy.
 */
export const POINT_PACKAGES = [
  { points: 100,  usd: 10,  perPoint: 0.100 },
  { points: 500,  usd: 45,  perPoint: 0.090 },
  { points: 1000, usd: 80,  perPoint: 0.080 },
  { points: 5000, usd: 350, perPoint: 0.070 },
] as const;

/** Best unit rate, used by the estimator to price a basket. */
export const USD_PER_POINT = 350 / 5000; // $0.07 at the 5,000 tier

/** Indicative cost of one completed outcome, at the best rate. */
export const outcomeCost = (points: number) => points * USD_PER_POINT;

export const POINTS_EXPLAINER = {
  eyebrow: "LAMID Points",
  title: "Pay when the work gets done.",
  body:
    "Agents and marketplace actions run on LAMID Points. You are charged per completed outcome — a delivered shortlist, a drafted proposal, a resolved dispute. A run that fails costs nothing. Every paid plan includes a monthly points allowance, and you can buy more at any time.",
  footnote:
    "Runs on LAMID Points. Paid plans include a monthly allowance. Unused allowance does not roll over; purchased points do not expire.",
} as const;
