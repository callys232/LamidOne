import type { Identity } from "./entitlements";
import { entitlementSummary } from "./entitlements";
import { getBalanceAsync, historyAsync, available } from "./points";
import { listProjects, listCompleted, listBids, trackRecord } from "./marketplace";
import { listBundles } from "./bundles";
import { PLATFORM_AGENTS, outcomeCost } from "@/content/agents";
import { REGISTERED_CODES } from "./engines";
import { roleFor, sectionsFor, type DashboardRole } from "@/content/dashboard";
import { TIERS_BY_ID, type TierId } from "@/content/tiers";
import { findUserById } from "./users";
import { profileCompletion, type Completion } from "./profileCompletion";

/**
 * DASHBOARD AGGREGATION.
 *
 * One read builds the whole view. The alternative — a request per
 * panel — is what makes dashboards feel slow and what makes a partly
 * loaded dashboard show contradictory numbers while it settles.
 *
 * Everything here is derived from real records. There is no sample
 * data: a new account sees genuine zeroes, and each empty panel says
 * what would put something in it. A dashboard seeded with fake rows
 * teaches people to distrust the real ones.
 */

export type Stat = { label: string; value: string; hint?: string; tone?: "good" | "warn" | "bad" };

export type DashboardView = {
  role: DashboardRole;
  tier: TierId;
  tierName: string;
  profile: { name: string; email: string; organisation?: string };
  completion: Completion;
  sections: { id: string; label: string; group: string; blurb: string; locked: boolean; unlocksAt?: string }[];
  headline: Stat[];
  points: {
    available: number; allowance: number; purchased: number; held: number;
    monthlyAllowance: number;
    /** What the current balance can still do — more useful than a number. */
    canRun: { name: string; role: string; points: number; runs: number; usd: number }[];
    recent: { reason: string; delta: number; at: number; agentId?: string }[];
  };
  work: {
    openProjects: number;
    liveEngagements: number;
    completed: number;
    projects: { id: string; title: string; status: string; bidCount: number; updatedAt: number }[];
  };
  escrow: { held: number; released: number; currency: string; note: string };
  intelligence: {
    enginesAvailable: number;
    runsMade: number;
    bundles: { id: string; name: string; runs: number; updatedAt: number }[];
  };
  expert?: {
    bidsPlaced: number;
    record: Awaited<ReturnType<typeof trackRecord>>;
  };
  /** What to do next. Ordered by what is actually blocking progress. */
  nextActions: { label: string; href: string; why: string }[];
};

const RANK: Record<string, number> = { free: 0, starter: 1, growth: 2, enterprise: 3, concierge: 4 };

export async function buildDashboard(identity: Identity, roleOverride?: DashboardRole): Promise<DashboardView> {
  /* Real accounts carry an authoritative role from the user record
     (see entitlements.ts). `roleFor` is the fallback for identities
     that never went through real signup — the dev mocks now also set
     it explicitly, so this only truly falls back for a token minted
     elsewhere with no matching local user row. */
  const role = roleOverride ?? identity.role ?? roleFor(identity);
  const userId = identity.userId!;
  const tier = TIERS_BY_ID[identity.tier];

  const user = await findUserById(userId);
  const profile = {
    name: identity.name ?? user?.name ?? "Preview account",
    email: identity.email ?? user?.email ?? "",
    organisation: identity.organisation ?? user?.organisation,
  };
  const completion = user
    ? await profileCompletion(user, role)
    : await profileCompletion({ id: userId, name: profile.name, email: profile.email, organisation: profile.organisation, orgId: identity.orgId }, role);

  const [balance, ledger, projects, completed, bundles] = await Promise.all([
    getBalanceAsync(userId),
    historyAsync(userId, 12),
    listProjects({ clientId: role === "expert" ? undefined : userId, take: 8 }),
    listCompleted({ [role === "expert" ? "expertId" : "clientId"]: userId, take: 50 } as never),
    Promise.resolve(listBundles(userId)),
  ]);

  const free = available(balance);

  /* "You have 40 points" is a number. "You can run one diagnostic" is
     an answer. Both are shown, with the second first. */
  const canRun = PLATFORM_AGENTS
    .filter((a) => a.points > 0)
    .map((a) => ({
      name: a.name, role: a.role, points: a.points,
      runs: Math.floor(free / a.points),
      usd: Math.round(outcomeCost(a.points) * 100) / 100,
    }))
    .filter((a) => a.runs > 0)
    .slice(0, 5);

  const runsMade = bundles.reduce((n, b) => n + b.runs.length, 0);
  const openProjects = projects.filter((p) => p.status === "open").length;
  const liveEngagements = projects.filter((p) => p.status === "in_delivery" || p.status === "awarded").length;

  const headline: Stat[] = [
    { label: "Points available", value: free.toLocaleString(),
      hint: free === 0 ? "Top up to run an agent" : `${canRun[0]?.runs ?? 0}× ${canRun[0]?.name ?? "runs"}`,
      tone: free === 0 ? "warn" : undefined },
    { label: "Open briefs", value: String(openProjects) },
    { label: "Live engagements", value: String(liveEngagements) },
    { label: "Engine runs", value: String(runsMade), hint: `${REGISTERED_CODES.length} available` },
  ];

  const sections = sectionsFor(role).map((s) => {
    const locked = Boolean(s.minTier && RANK[identity.tier] < RANK[s.minTier]);
    return {
      id: s.id, label: s.label, group: s.group, blurb: s.blurb,
      locked,
      unlocksAt: locked ? TIERS_BY_ID[s.minTier as TierId].name : undefined,
    };
  });

  const view: DashboardView = {
    role,
    tier: identity.tier,
    tierName: tier.name,
    profile,
    completion,
    sections,
    headline,
    points: {
      available: free,
      allowance: balance.allowance,
      purchased: balance.purchased,
      held: balance.held,
      monthlyAllowance: tier.pointsMonthly,
      canRun,
      recent: ledger.map((l) => ({ reason: l.reason, delta: l.delta, at: l.at, agentId: l.agentId })),
    },
    work: {
      openProjects,
      liveEngagements,
      completed: completed.length,
      projects: projects.map((p) => ({
        id: p.id, title: p.title, status: p.status, bidCount: p.bidCount, updatedAt: p.updatedAt,
      })),
    },
    escrow: {
      /* Escrow figures come from the engagement records once the
         escrow service is wired. Reported as zero rather than
         estimated — a wrong number about held money is worse than no
         number. */
      held: 0,
      released: completed.reduce((s, c) => s + c.finalValue, 0),
      currency: "USD",
      /* "approved", not "released" — nothing is transferred when a
         milestone is approved. See the wording note in lib/milestones.ts. */
      note: completed.length === 0
        ? "Nothing approved yet."
        : `${completed.length} engagement${completed.length === 1 ? "" : "s"} completed.`,
    },
    intelligence: {
      enginesAvailable: REGISTERED_CODES.length,
      runsMade,
      bundles: bundles.slice(0, 6).map((b) => ({
        id: b.id, name: b.name, runs: b.runs.length, updatedAt: b.updatedAt,
      })),
    },
    nextActions: [],
  };

  if (role === "expert") {
    const [record, bids] = await Promise.all([
      trackRecord(userId),
      Promise.resolve([] as Awaited<ReturnType<typeof listBids>>),
    ]);
    view.expert = { bidsPlaced: bids.length, record };
  }

  view.nextActions = nextActions(view, identity);
  return view;
}

/**
 * What to do next, ordered by what is actually blocking progress
 * rather than by what we would like them to buy. An empty balance
 * blocks everything, so it outranks an upsell.
 */
function nextActions(v: DashboardView, identity: Identity) {
  const out: { label: string; href: string; why: string }[] = [];

  if (v.points.available === 0) {
    out.push({ label: "Top up points", href: "/pricing#points",
      why: "Your balance is empty, so agent runs and marketplace actions are paused." });
  }

  if (v.intelligence.runsMade === 0) {
    out.push({ label: "Run your first diagnostic", href: "/dashboard/engines",
      why: identity.tier === "free"
        ? "Your free account includes exactly one, at no cost."
        : "It establishes the baseline every other engine compares against." });
  }

  if (v.intelligence.bundles.length === 0 && v.intelligence.runsMade > 0) {
    out.push({ label: "Create a bundle", href: "/dashboard/bundles",
      why: "Bundles carry your inputs between engines, so you stop re-entering them." });
  }

  if (v.role !== "expert" && v.work.openProjects === 0 && v.work.liveEngagements === 0) {
    out.push({ label: "Post a brief", href: "/dashboard/projects",
      why: "Get a matched shortlist of vetted experts rather than a directory." });
  }

  if (v.role === "expert" && (v.expert?.record.engagementsCompleted ?? 0) === 0) {
    out.push({ label: "Complete your verification", href: "/dashboard/verification",
      why: "Verified profiles appear in matched shortlists; unverified ones do not." });
  }

  return out.slice(0, 4);
}

export { entitlementSummary };
