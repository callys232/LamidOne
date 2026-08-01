import type { DashboardRole, SectionId } from "./dashboard";

/**
 * THE USER GUIDE — a first-login spotlight tour.
 *
 * Ported from ProdLamid's `lib/UserGuide/*.ts` files (profileSidebarGuide
 * and siblings): an ordered list of {title, description} tied to a
 * sidebar target. Kept as a single role-aware list here rather than one
 * file per role, since the underlying sidebar is also now one component
 * for every role (content/dashboard.ts) — five separate guide files
 * would just be five more places for the copy to drift from what the
 * sidebar actually shows.
 *
 * Each step's `target` is a SectionId that must exist in that role's
 * `sectionsFor(role)` — the tour walks real sidebar entries, never an
 * invented one.
 */

export type GuideStep = { target: SectionId; title: string; description: string };

const COMMON: GuideStep[] = [
  { target: "overview", title: "Overview", description: "Everything in flight, and what needs you next — the one screen every login starts on." },
];

const BY_ROLE: Record<DashboardRole, GuideStep[]> = {
  client: [
    ...COMMON,
    { target: "projects", title: "Projects", description: "Post a brief and track the bids that come back." },
    { target: "engines", title: "Engines", description: "Run a diagnostic or any other engine — your first one is free." },
    { target: "escrow", title: "Escrow", description: "See what is held against a milestone, and what has released." },
    { target: "wallet", title: "Wallet and points", description: "Your balance, and exactly what it currently covers." },
  ],
  expert: [
    ...COMMON,
    { target: "bids", title: "My bids", description: "Every brief you have bid on, and where it stands." },
    { target: "verification", title: "Verification", description: "Submit your credentials — verified profiles appear in matched shortlists." },
    { target: "earnings", title: "Earnings", description: "Your track record, and where to add a payout account." },
    { target: "engagements", title: "Engagements", description: "Submit deliverables here — Sentry certifies them automatically." },
  ],
  enterprise: [
    ...COMMON,
    { target: "members", title: "Members", description: "Invite your team. Seat price follows your tier, not the headcount you invite." },
    { target: "projects", title: "Projects", description: "Post briefs on behalf of your organisation." },
    { target: "billing", title: "Billing", description: "Your plan, seats and what the next tier adds." },
    { target: "audit", title: "Audit log", description: "Every consequential action, immutably recorded." },
  ],
  concierge: [
    ...COMMON,
    { target: "sla", title: "SLA tracker", description: "Your response-time commitment, and how it is tracked." },
    { target: "approvals", title: "Approvals", description: "Milestones waiting on your sign-off, in one place." },
    { target: "members", title: "Members", description: "Manage who on your team has access." },
  ],
  operator: [
    ...COMMON,
    { target: "agents", title: "Agents", description: "Beacon and Herald — the two operator-only agents." },
    { target: "audit", title: "Audit log", description: "The platform-wide record, not just one organisation's." },
  ],
};

export const guideFor = (role: DashboardRole): GuideStep[] => BY_ROLE[role];
