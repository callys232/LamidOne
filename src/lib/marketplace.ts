import { collection, persistenceEnabled, ensureIndexes } from "./store";
import { ACTION_COSTS } from "@/content/agents";
import { listMilestones } from "./milestones";

/**
 * MARKETPLACE — projects, bids and experts.
 *
 * The demand and supply sides of LAMID MARKET. ProdLamid holds the
 * canonical models (`lib/models/Project.ts`, `Bid.ts`, `Profile.ts`)
 * and this reads and writes the same collections, so a project posted
 * in either app is one project rather than two.
 *
 * Point costs come from `content/agents.ts` — posting is 50, a bid is
 * 20, a boost 60 — so the marketing page and the charge cannot drift.
 */

export type ProjectStatus = "draft" | "open" | "awarded" | "in_delivery" | "complete" | "cancelled";

export type Project = {
  id: string;
  clientId: string;
  title: string;
  brief: string;
  /** Disciplines needed. Drives matching. */
  skills: string[];
  industry?: string;
  budget: { min: number; max: number; currency: string };
  /** ISO date the client needs it delivered by. */
  deadline?: string;
  status: ProjectStatus;
  bidCount: number;
  /** Set by awardBid(). The one expert authorised to deliver this
   *  project — completeProject() validates against this rather than
   *  trusting a client-supplied expertId. */
  awardedExpertId?: string;
  awardedAt?: number;
  createdAt: number;
  updatedAt: number;
};

export type Bid = {
  id: string;
  projectId: string;
  expertId: string;
  amount: number;
  currency: string;
  /** Working days. */
  duration: number;
  pitch: string;
  /** Boosted bids get double visibility. Costs 60 points. */
  boosted: boolean;
  status: "submitted" | "shortlisted" | "accepted" | "declined" | "withdrawn";
  createdAt: number;
};

export type Expert = {
  id: string;
  name: string;
  headline: string;
  disciplines: string[];
  industries: string[];
  /** Published even when low — that is what makes the high ones
   *  believable (teardown §7.12). */
  engagementsCompleted: number;
  rating: number | null;
  verified: boolean;
  certified: boolean;
  availableFrom?: string;
  dayRate?: { amount: number; currency: string };
};

export const POST_PROJECT_COST = ACTION_COSTS.find((a) => a.action === "Post a project")!.points;
export const PLACE_BID_COST = ACTION_COSTS.find((a) => a.action === "Place a bid")!.points;
export const BOOST_BID_COST = ACTION_COSTS.find((a) => a.action === "Boost a bid")!.points;

const id = (p: string) => `${p}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

/* ── In-memory fallback ───────────────────────────────────── */
const projects = new Map<string, Project>();
const bids = new Map<string, Bid>();
const experts = new Map<string, Expert>();

/* ── Validation ───────────────────────────────────────────── */

export class MarketplaceError extends Error {
  constructor(msg: string) { super(msg); this.name = "MarketplaceError"; }
}

export function validateProject(input: Record<string, unknown>) {
  const title = String(input.title ?? "").trim().slice(0, 160);
  const brief = String(input.brief ?? "").trim().slice(0, 8000);
  const skills = (Array.isArray(input.skills) ? input.skills : [])
    .map((s) => String(s).trim().slice(0, 60))
    .filter(Boolean)
    .slice(0, 12);

  const budget = (input.budget ?? {}) as { min?: unknown; max?: unknown; currency?: unknown };
  const min = Number(budget.min);
  const max = Number(budget.max);

  if (title.length < 8) throw new MarketplaceError("Give the project a title of at least 8 characters.");
  if (brief.length < 40) throw new MarketplaceError("The brief needs at least 40 characters — enough for an expert to judge fit.");
  if (skills.length === 0) throw new MarketplaceError("List at least one discipline so the brief can be matched.");
  if (!Number.isFinite(min) || !Number.isFinite(max) || min < 0 || max < min) {
    throw new MarketplaceError("Budget needs a valid `min` and `max`, with max no lower than min.");
  }

  return {
    title, brief, skills,
    industry: input.industry ? String(input.industry).slice(0, 80) : undefined,
    budget: { min, max, currency: String(budget.currency ?? "USD").slice(0, 3).toUpperCase() },
    deadline: input.deadline ? String(input.deadline).slice(0, 40) : undefined,
  };
}

/* ── Projects ─────────────────────────────────────────────── */

export async function createProject(clientId: string, input: Record<string, unknown>): Promise<Project> {
  const clean = validateProject(input);
  const project: Project = {
    id: id("prj"),
    clientId,
    ...clean,
    status: "open",
    bidCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  if (persistenceEnabled()) {
    await ensureIndexes();
    const col = await collection<Project>("projects");
    if (col) { await col.insertOne(project); return project; }
  }

  projects.set(project.id, project);
  return project;
}

export async function listProjects(filter: {
  clientId?: string; status?: ProjectStatus; skill?: string; take?: number;
} = {}): Promise<Project[]> {
  const take = Math.min(filter.take ?? 25, 100);

  if (persistenceEnabled()) {
    const col = await collection<Project>("projects");
    if (col) {
      const q: Record<string, unknown> = {};
      if (filter.clientId) q.clientId = filter.clientId;
      if (filter.status) q.status = filter.status;
      if (filter.skill) q.skills = filter.skill;
      return col.find(q).sort({ createdAt: -1 }).limit(take).toArray();
    }
  }

  return [...projects.values()]
    .filter((p) => (!filter.clientId || p.clientId === filter.clientId)
      && (!filter.status || p.status === filter.status)
      && (!filter.skill || p.skills.includes(filter.skill)))
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, take);
}

export async function getProject(projectId: string): Promise<Project | null> {
  if (persistenceEnabled()) {
    const col = await collection<Project>("projects");
    if (col) return col.findOne({ id: projectId });
  }
  return projects.get(projectId) ?? null;
}

/* ── Bids ─────────────────────────────────────────────────── */

export async function placeBid(expertId: string, input: Record<string, unknown>): Promise<Bid> {
  const projectId = String(input.projectId ?? "");
  const project = await getProject(projectId);

  if (!project) throw new MarketplaceError("No such project.");
  if (project.status !== "open") throw new MarketplaceError("This project is no longer accepting bids.");
  if (project.clientId === expertId) throw new MarketplaceError("You cannot bid on your own project.");

  const amount = Number(input.amount);
  const duration = Number(input.duration);
  const pitch = String(input.pitch ?? "").trim().slice(0, 4000);

  if (!Number.isFinite(amount) || amount <= 0) throw new MarketplaceError("Bid `amount` must be a positive number.");
  if (!Number.isFinite(duration) || duration <= 0) throw new MarketplaceError("Bid `duration` in working days is required.");
  if (pitch.length < 40) throw new MarketplaceError("The pitch needs at least 40 characters.");

  const existing = await findBid(projectId, expertId);
  if (existing) throw new MarketplaceError("You have already bid on this project. Withdraw it first.");

  const bid: Bid = {
    id: id("bid"),
    projectId, expertId, amount,
    currency: String(input.currency ?? project.budget.currency).slice(0, 3).toUpperCase(),
    duration, pitch,
    boosted: input.boosted === true,
    status: "submitted",
    createdAt: Date.now(),
  };

  if (persistenceEnabled()) {
    const bidCol = await collection<Bid>("bids");
    const prjCol = await collection<Project>("projects");
    if (bidCol && prjCol) {
      await bidCol.insertOne(bid);
      await prjCol.updateOne({ id: projectId }, { $inc: { bidCount: 1 }, $set: { updatedAt: Date.now() } });
      return bid;
    }
  }

  bids.set(bid.id, bid);
  const p = projects.get(projectId);
  if (p) { p.bidCount += 1; p.updatedAt = Date.now(); }
  return bid;
}

async function findBid(projectId: string, expertId: string): Promise<Bid | null> {
  if (persistenceEnabled()) {
    const col = await collection<Bid>("bids");
    if (col) return col.findOne({ projectId, expertId, status: { $ne: "withdrawn" } });
  }
  return [...bids.values()].find((b) => b.projectId === projectId && b.expertId === expertId && b.status !== "withdrawn") ?? null;
}

/**
 * Bids for a project.
 * Boosted bids sort first — that is what the 60 points buy, and it is
 * stated on the pricing page rather than being a hidden ranking tweak.
 */
export async function listBids(projectId: string, take = 50): Promise<Bid[]> {
  if (persistenceEnabled()) {
    const col = await collection<Bid>("bids");
    if (col) {
      return col.find({ projectId }).sort({ boosted: -1, createdAt: 1 }).limit(take).toArray();
    }
  }
  return [...bids.values()]
    .filter((b) => b.projectId === projectId)
    .sort((a, b) => Number(b.boosted) - Number(a.boosted) || a.createdAt - b.createdAt)
    .slice(0, take);
}

async function getBid(bidId: string): Promise<Bid | null> {
  if (persistenceEnabled()) {
    const col = await collection<Bid>("bids");
    if (col) return col.findOne({ id: bidId });
  }
  return bids.get(bidId) ?? null;
}

/**
 * Award a bid — the missing handoff between "receive bids" and "the
 * engagement actually starts." Only the project's own client can
 * award, only while the project is still open, and only a bid that is
 * still live. Every other live bid on the project is declined in the
 * same call, so a project can never end up with two accepted bids.
 */
export async function awardBid(clientId: string, projectId: string, bidId: string): Promise<{ project: Project; bid: Bid }> {
  const project = await getProject(projectId);
  if (!project) throw new MarketplaceError("No such project.");
  if (project.clientId !== clientId) throw new MarketplaceError("Only the client who posted this project can award a bid.");
  if (project.status !== "open") throw new MarketplaceError("This project is not open for award — it may already be awarded or closed.");

  const bid = await getBid(bidId);
  if (!bid || bid.projectId !== projectId) throw new MarketplaceError("No such bid on this project.");
  if (bid.status !== "submitted" && bid.status !== "shortlisted") {
    throw new MarketplaceError("This bid can no longer be awarded.");
  }

  const now = Date.now();

  if (persistenceEnabled()) {
    const prjCol = await collection<Project>("projects");
    const bidCol = await collection<Bid>("bids");
    if (prjCol && bidCol) {
      /* The `status: "open"` guard in the filter closes the race
         between two concurrent award attempts on the same project —
         only the first one finds a match. */
      const updatedProject = await prjCol.findOneAndUpdate(
        { id: projectId, status: "open" },
        { $set: { status: "awarded", awardedExpertId: bid.expertId, awardedAt: now, updatedAt: now } },
        { returnDocument: "after" },
      );
      if (!updatedProject) throw new MarketplaceError("This project was just awarded by another request.");

      await bidCol.updateOne({ id: bidId }, { $set: { status: "accepted" } });
      await bidCol.updateMany(
        { projectId, id: { $ne: bidId }, status: { $in: ["submitted", "shortlisted"] } },
        { $set: { status: "declined" } },
      );

      return { project: updatedProject, bid: { ...bid, status: "accepted" } };
    }
  }

  if (project.status !== "open") throw new MarketplaceError("This project was just awarded by another request.");
  project.status = "awarded";
  project.awardedExpertId = bid.expertId;
  project.awardedAt = now;
  project.updatedAt = now;
  bid.status = "accepted";
  for (const b of bids.values()) {
    if (b.projectId === projectId && b.id !== bidId && (b.status === "submitted" || b.status === "shortlisted")) {
      b.status = "declined";
    }
  }
  return { project, bid };
}

/** Withdraw your own bid — only while it is still live. You cannot
 *  withdraw a bid that has already been accepted or declined. */
export async function withdrawBid(expertId: string, bidId: string): Promise<Bid> {
  const bid = await getBid(bidId);
  if (!bid) throw new MarketplaceError("No such bid.");
  if (bid.expertId !== expertId) throw new MarketplaceError("You can only withdraw your own bid.");
  if (bid.status !== "submitted" && bid.status !== "shortlisted") {
    throw new MarketplaceError("This bid can no longer be withdrawn.");
  }

  if (persistenceEnabled()) {
    const col = await collection<Bid>("bids");
    if (col) {
      const updated = await col.findOneAndUpdate(
        { id: bidId, status: bid.status },
        { $set: { status: "withdrawn" } },
        { returnDocument: "after" },
      );
      if (updated) return updated;
    }
  }
  bid.status = "withdrawn";
  return bid;
}

/* ── Completed work ───────────────────────────────────────── */

export type CompletedProject = Project & {
  expertId: string;
  completedAt: number;
  /** Agreed value actually delivered against. */
  finalValue: number;
  milestonesApproved: number;
  /** Client's own words. Only shown publicly with consent. */
  outcome?: { summary: string; verifiedByClient: boolean; publishConsent: boolean };
  rating?: number;
};

const completed = new Map<string, CompletedProject>();

/**
 * Close a project.
 *
 * `verifiedByClient` and `publishConsent` are separate on purpose. A
 * client confirming a figure is true is not the same as agreeing it can
 * appear on a marketing page, and conflating the two is how case
 * studies get published that the customer never approved. The
 * case-study surface reads ONLY records where both are true.
 */
export async function completeProject(
  projectId: string,
  clientId: string,
  input: { finalValue: number; milestonesApproved: number;
           outcome?: { summary: string; verifiedByClient?: boolean; publishConsent?: boolean };
           rating?: number },
): Promise<CompletedProject> {
  const project = await getProject(projectId);
  if (!project) throw new MarketplaceError("No such project.");
  if (project.clientId !== clientId) throw new MarketplaceError("Only the client can close a project.");
  if (project.status === "complete") throw new MarketplaceError("This project is already closed.");
  /* The expert is read from the project's own award record, never from
     the request body — a caller used to be able to name an arbitrary
     expertId here and credit them with an engagement they never did,
     which fed straight into their public track record. */
  if (project.status !== "awarded" || !project.awardedExpertId) {
    throw new MarketplaceError("This project has no awarded bid yet — award one before closing it.");
  }

  /* A project can only close once every milestone it defined is
     actually approved — otherwise a project could close while a
     milestone sits disputed or still-submitted, with escrow logic
     that has no idea the project it was protecting is now "done". A
     project with no milestones at all (never broken into escrow
     stages) has nothing to check here and closes as before. */
  const milestones = await listMilestones(projectId);
  const unresolved = milestones.filter((m) => m.status !== "approved");
  if (unresolved.length > 0) {
    throw new MarketplaceError(
      `${unresolved.length} milestone${unresolved.length === 1 ? "" : "s"} still need${unresolved.length === 1 ? "s" : ""} to be approved before this project can close.`,
    );
  }

  const record: CompletedProject = {
    ...project,
    status: "complete",
    expertId: project.awardedExpertId,
    completedAt: Date.now(),
    finalValue: Number(input.finalValue) || 0,
    milestonesApproved: Number(input.milestonesApproved) || 0,
    updatedAt: Date.now(),
    ...(input.outcome
      ? {
          outcome: {
            summary: String(input.outcome.summary).slice(0, 2000),
            verifiedByClient: input.outcome.verifiedByClient === true,
            publishConsent: input.outcome.publishConsent === true,
          },
        }
      : {}),
    ...(typeof input.rating === "number" ? { rating: Math.min(5, Math.max(1, input.rating)) } : {}),
  };

  if (persistenceEnabled()) {
    const prj = await collection<Project>("projects");
    const done = await collection<CompletedProject>("completedProjects");
    if (prj && done) {
      /* The `status: "awarded"` guard in the filter closes the same
         race awardBid() already closes for itself — without it, two
         concurrent completeProject() calls both pass the read-check
         above and both write, double-paying and double-counting the
         expert's stats. Only the first of two concurrent calls finds
         a match; the second gets null and must not proceed. */
      const updatedProject = await prj.findOneAndUpdate(
        { id: projectId, status: "awarded" },
        { $set: { status: "complete", updatedAt: Date.now() } },
        { returnDocument: "after" },
      );
      if (!updatedProject) throw new MarketplaceError("This project was just closed by another request.");

      await done.insertOne(record);
      await syncExpertStats(record.expertId);
      return record;
    }
  }

  const p = projects.get(projectId);
  if (!p || p.status !== "awarded") throw new MarketplaceError("This project was just closed by another request.");
  p.status = "complete"; p.updatedAt = Date.now();
  completed.set(projectId, record);
  await syncExpertStats(record.expertId);
  return record;
}

/** Delivered work. Scope to a client or an expert for their portfolio. */
export async function listCompleted(filter: {
  clientId?: string; expertId?: string; publishableOnly?: boolean; take?: number;
} = {}): Promise<CompletedProject[]> {
  const take = Math.min(filter.take ?? 25, 100);

  if (persistenceEnabled()) {
    const col = await collection<CompletedProject>("completedProjects");
    if (col) {
      const q: Record<string, unknown> = {};
      if (filter.clientId) q.clientId = filter.clientId;
      if (filter.expertId) q.expertId = filter.expertId;
      if (filter.publishableOnly) {
        q["outcome.verifiedByClient"] = true;
        q["outcome.publishConsent"] = true;
      }
      return col.find(q).sort({ completedAt: -1 }).limit(take).toArray();
    }
  }

  return [...completed.values()]
    .filter((c) => (!filter.clientId || c.clientId === filter.clientId)
      && (!filter.expertId || c.expertId === filter.expertId)
      && (!filter.publishableOnly || (c.outcome?.verifiedByClient && c.outcome?.publishConsent)))
    .sort((a, b) => b.completedAt - a.completedAt)
    .slice(0, take);
}

/** Track record for an expert profile. Counts are published even when
 *  low — see the note on `Expert.engagementsCompleted`. */
export async function trackRecord(expertId: string) {
  const done = await listCompleted({ expertId, take: 100 });
  const rated = done.filter((d) => typeof d.rating === "number");
  return {
    engagementsCompleted: done.length,
    totalValueDelivered: done.reduce((s, d) => s + d.finalValue, 0),
    milestonesApproved: done.reduce((s, d) => s + d.milestonesApproved, 0),
    averageRating: rated.length
      ? Math.round((rated.reduce((s, d) => s + (d.rating ?? 0), 0) / rated.length) * 10) / 10
      : null,
    ratedEngagements: rated.length,
  };
}

/** Keeps the Expert directory's denormalised stats current after a
 *  completion. `trackRecord()` computes the true figures live from
 *  `completedProjects`; this just writes them onto the Expert doc so
 *  `listExperts()`'s sort (`engagementsCompleted: -1`) reflects reality
 *  without recomputing it for every browse request. */
async function syncExpertStats(expertId: string): Promise<void> {
  const record = await trackRecord(expertId);
  const patch = { engagementsCompleted: record.engagementsCompleted, rating: record.averageRating };

  if (persistenceEnabled()) {
    const col = await collection<Expert>("experts");
    if (col) { await col.updateOne({ id: expertId }, { $set: patch }); return; }
  }
  const e = experts.get(expertId);
  if (e) Object.assign(e, patch);
}

/** An expert's own bids, across every project — the "Bids" section. */
export async function listBidsByExpert(expertId: string, take = 50): Promise<Bid[]> {
  if (persistenceEnabled()) {
    const col = await collection<Bid>("bids");
    if (col) return col.find({ expertId }).sort({ createdAt: -1 }).limit(take).toArray();
  }
  return [...bids.values()].filter((b) => b.expertId === expertId).sort((a, b) => b.createdAt - a.createdAt).slice(0, take);
}

export async function listExperts(filter: { discipline?: string; take?: number } = {}): Promise<Expert[]> {
  const take = Math.min(filter.take ?? 25, 100);
  if (persistenceEnabled()) {
    const col = await collection<Expert>("experts");
    if (col) {
      const q = filter.discipline ? { disciplines: filter.discipline } : {};
      return col.find(q).sort({ engagementsCompleted: -1 }).limit(take).toArray();
    }
  }
  /* Real profiles created this process (via ensureExpertProfile) — not
     fabricated sample data. An empty network is still an honest empty
     state; the difference is this now reflects what was actually
     created rather than always reading as empty regardless. */
  return [...experts.values()]
    .filter((e) => !filter.discipline || e.disciplines.includes(filter.discipline))
    .sort((a, b) => b.engagementsCompleted - a.engagementsCompleted)
    .slice(0, take);
}

/**
 * Create the Expert directory profile a signup never used to produce.
 * `listExperts()` reads only this collection — nothing else ever wrote
 * to it, so an expert account existed with no way to appear in "browse
 * the vetted expert network". Idempotent: safe to call on every
 * expert sign-in, not just once at signup.
 */
export async function ensureExpertProfile(userId: string, name: string): Promise<Expert> {
  const existing = await getExpertProfile(userId);
  if (existing) return existing;

  const expert: Expert = {
    id: userId,
    name,
    headline: "New on LAMID MARKET — profile not yet completed",
    disciplines: [],
    industries: [],
    engagementsCompleted: 0,
    rating: null,
    verified: false,
    certified: false,
  };

  if (persistenceEnabled()) {
    await ensureIndexes();
    const col = await collection<Expert>("experts");
    if (col) { await col.insertOne(expert); return expert; }
  }
  experts.set(expert.id, expert);
  return expert;
}

export async function getExpertProfile(id: string): Promise<Expert | null> {
  if (persistenceEnabled()) {
    const col = await collection<Expert>("experts");
    if (col) return col.findOne({ id });
  }
  return experts.get(id) ?? null;
}

export async function updateExpertProfile(
  id: string,
  patch: Partial<Pick<Expert, "headline" | "disciplines" | "industries" | "availableFrom" | "dayRate">>,
): Promise<Expert | null> {
  if (persistenceEnabled()) {
    const col = await collection<Expert>("experts");
    if (col) {
      const after = await col.findOneAndUpdate({ id }, { $set: patch }, { returnDocument: "after" });
      return after ?? null;
    }
  }
  const e = experts.get(id);
  if (!e) return null;
  Object.assign(e, patch);
  return e;
}
