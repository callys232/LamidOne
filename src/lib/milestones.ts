import { collection, persistenceEnabled, ensureIndexes } from "./store";
import { getProject, listProjects } from "./marketplace";
import { scoreDeliverable, autoReleaseDeadline, autoReleaseWindowLabel, CERTIFY_THRESHOLD, BLOCKS_AUTO_RELEASE } from "./autoRelease";
import { notify } from "./notifications";
import { record } from "./audit";

/**
 * MILESTONES — what "Engagements" actually tracks.
 *
 * A project moves from the marketplace (LAMID MARKET) into delivery
 * (LAMID DESK) at the moment it has milestones. This is the DESK side:
 * the deliverable-by-deliverable record that approval pays out against.
 *
 * ⚠️  WORDING — WHAT APPROVAL NOW DOES, AND WHAT IT STILL DOES NOT.
 *
 * IT DOES release money. `approvedEarnings()` below is the balance that
 * /api/withdrawals pays against, so approving a milestone makes that
 * amount withdrawable that instant, and the expert can move it to their
 * bank through Paystack (lib/payouts.ts → createTransfer). That is real
 * money leaving a real account, so the notification saying so is now a
 * true statement rather than the overclaim it was.
 *
 * IT DOES NOT hold client funds. Nothing is captured from the client
 * when a milestone is created, so there is no ring-fenced pot that
 * approval opens — the platform pays out against approved work, which
 * is a payout rail, not custody. Do NOT reintroduce the words "escrow",
 * "held" or "in escrow" into any client-facing string here until
 * capture-on-fund is wired, and do not describe approval as protecting
 * the client's money: the money was never taken.
 *
 * The distinction matters because it points in the direction that hurts
 * the CLIENT. Telling a client their funds are protected when they are
 * not is the one claim here nobody can verify until it fails.
 *
 * AUTO-FUNCTIONS, ported from ProdLamid's deliverable-check pipeline:
 *   submit → Sentry auto-certifies the deliverable and starts the
 *            silence-fallback clock if certified (see lib/autoRelease.ts)
 *   sweep  → `processAutoReleases()` finds certified, unapproved,
 *            undisputed milestones past their deadline and releases them
 *   both routes notify client and expert at every transition, not just
 *   on request — matching ProdLamid's behaviour of pushing a
 *   notification alongside every state change rather than requiring a
 *   poll.
 */

export type MilestoneStatus = "pending" | "in_progress" | "submitted" | "approved" | "disputed";

export type Milestone = {
  id: string;
  projectId: string;
  title: string;
  amount: number;
  currency: string;
  status: MilestoneStatus;
  dueDate?: string;
  submittedAt?: number;
  approvedAt?: number;
  submissionNote?: string;
  /** Set by the auto-certification check that runs on submission. */
  aiCertified?: boolean;
  aiScore?: number;
  /** When silence-fallback release becomes eligible, if certified. */
  autoReleaseAt?: number;
  /** True when release happened on the timer rather than a client click. */
  autoReleased?: boolean;
};

const store = new Map<string, Milestone>();
const id = () => `ms_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

export class MilestoneError extends Error {
  constructor(msg: string) { super(msg); this.name = "MilestoneError"; }
}

export async function listMilestones(projectId: string): Promise<Milestone[]> {
  if (persistenceEnabled()) {
    const col = await collection<Milestone>("milestones");
    if (col) return col.find({ projectId }).sort({ id: 1 }).toArray();
  }
  return [...store.values()].filter((m) => m.projectId === projectId);
}

export async function createMilestone(
  clientId: string,
  projectId: string,
  input: { title: string; amount: number; currency?: string; dueDate?: string },
): Promise<Milestone> {
  const project = await getProject(projectId);
  if (!project) throw new MilestoneError("No such project.");
  if (project.clientId !== clientId) throw new MilestoneError("Only the client can define milestones.");

  const title = input.title.trim().slice(0, 160);
  const amount = Number(input.amount);
  if (title.length < 4) throw new MilestoneError("Milestone title is too short.");
  if (!Number.isFinite(amount) || amount <= 0) throw new MilestoneError("Milestone amount must be a positive number.");

  const milestone: Milestone = {
    id: id(), projectId, title, amount,
    currency: (input.currency ?? project.budget.currency).slice(0, 3).toUpperCase(),
    status: "pending",
    dueDate: input.dueDate,
  };

  let persisted = false;
  if (persistenceEnabled()) {
    await ensureIndexes();
    const col = await collection<Milestone>("milestones");
    if (col) { await col.insertOne(milestone); persisted = true; }
  }
  if (!persisted) store.set(milestone.id, milestone);

  if (project.awardedExpertId) {
    await notify(project.awardedExpertId, "New milestone added", `"${milestone.title}" — ${milestone.currency} ${milestone.amount.toLocaleString()}, ready to submit against. It is released to you on approval.`);
  }

  return milestone;
}

/**
 * Expert marks work submitted.
 *
 * Automatically runs Sentry's completeness check and, if certified,
 * starts the silence-fallback clock — mirroring ProdLamid's route,
 * which does this inline rather than waiting for a separate request.
 * Free: this is the safety check standing between a deliverable and a
 * payout, not a value-creating agent run, so it is not metered the way
 * an on-demand Sentry invocation from the agent directory is. Charging
 * for it would put a price on the step that protects both parties.
 */
export async function submitMilestone(expertId: string, milestoneId: string, note?: string): Promise<Milestone> {
  const m = await findOne(milestoneId);
  if (!m) throw new MilestoneError("No such milestone.");
  if (m.status !== "pending" && m.status !== "in_progress") throw new MilestoneError("This milestone is not open for submission.");

  const { score, reasons } = scoreDeliverable(note);
  const certified = score >= CERTIFY_THRESHOLD;

  const updated = await update(milestoneId, {
    status: "submitted",
    submittedAt: Date.now(),
    submissionNote: note?.slice(0, 2000),
    aiCertified: certified,
    aiScore: score,
    ...(certified ? { autoReleaseAt: autoReleaseDeadline() } : {}),
  }, m.status);
  if (!updated) throw new MilestoneError("This milestone changed status while submitting — refresh and try again.");

  const project = await getProject(m.projectId);
  if (project) {
    const window = autoReleaseWindowLabel();
    const clientMsg = certified
      ? `Sentry certified the deliverable for "${m.title}" at ${score}/100. Approve it now, or it is approved automatically in ${window} if you do neither.`
      : `A deliverable was submitted for "${m.title}" but did not pass automatic certification (${score}/100${reasons[0] ? `: ${reasons[0]}` : ""}). Review it directly — this one will not auto-release.`;
    await notify(project.clientId, "Deliverable submitted", clientMsg);
    await notify(expertId, "Submission recorded", certified
      ? `Your deliverable for "${m.title}" was certified at ${score}/100. It is approved automatically in ${window} unless the client approves sooner or raises a dispute.`
      : `Your deliverable for "${m.title}" was recorded but did not pass automatic certification (${score}/100). The client will review it directly.`);
  }

  return updated;
}

/** Client approves — this is what makes the amount withdrawable. */
export async function approveMilestone(clientId: string, milestoneId: string): Promise<Milestone> {
  const m = await findOne(milestoneId);
  if (!m) throw new MilestoneError("No such milestone.");
  const project = await getProject(m.projectId);
  if (!project || project.clientId !== clientId) throw new MilestoneError("Only the client can approve this milestone.");
  if (m.status !== "submitted") throw new MilestoneError("Only a submitted milestone can be approved.");

  const updated = await update(milestoneId, { status: "approved", approvedAt: Date.now() }, "submitted");
  if (!updated) throw new MilestoneError("This milestone was just handled by another request — refresh to see its current status.");

  await record({ orgId: null, actorId: clientId, actorRole: "client", action: "milestone_approved", target: m.id, detail: `${m.currency} ${m.amount}` });
  await notify(clientId, "Milestone approved", `You approved "${m.title}" — ${m.currency} ${m.amount.toLocaleString()} has been released to the expert.`);
  if (project.awardedExpertId) {
    await notify(project.awardedExpertId, "Milestone approved", `"${m.title}" was approved — ${m.currency} ${m.amount.toLocaleString()} is now available to withdraw.`);
  }

  return updated;
}

/**
 * An expert's RELEASED earnings — what approval has actually freed up.
 *
 * This is the number the withdrawal route pays against, and it is the
 * whole of what "approval releases funds" means here: the moment a
 * client approves a milestone, that amount becomes withdrawable, and
 * `/api/withdrawals` transfers it out through Paystack.
 *
 * WHAT IT REPLACED, and why the change matters. The balance used to be
 * `trackRecord().totalValueDelivered` — the sum of `finalValue` across
 * COMPLETED engagements. An expert with four approved milestones on a
 * live project could withdraw nothing until the whole engagement
 * closed, which is the opposite of what milestone approval is for.
 *
 * CURRENCY IS A FILTER, NOT A DETAIL. Milestones carry their own
 * currency; payouts are NGN (see payouts.ts). Summing across currencies
 * would turn 100 USD into 100 NGN of withdrawable balance, so anything
 * not in the payout currency is excluded rather than converted — this
 * module has no business holding an exchange rate.
 *
 * Disputed and auto-released milestones: a dispute moves the row OUT of
 * `approved`, so a disputed milestone stops counting the moment it is
 * raised. An auto-released one IS approved (the silence fallback sets
 * the same status) and counts, which is correct — the client had the
 * window and did not use it.
 */
export async function approvedEarnings(expertId: string, currency: string): Promise<number> {
  const projects = await listProjects({ awardedExpertId: expertId, take: 500 });
  if (projects.length === 0) return 0;

  const perProject = await Promise.all(projects.map((p) => listMilestones(p.id)));
  const want = currency.toUpperCase();

  return perProject
    .flat()
    .filter((m) => m.status === "approved" && m.currency.toUpperCase() === want)
    .reduce((sum, m) => sum + m.amount, 0);
}

export async function disputeMilestone(milestoneId: string, raisedBy: string): Promise<Milestone> {
  const m = await findOne(milestoneId);
  if (!m) throw new MilestoneError("No such milestone.");
  if (m.status !== "submitted") throw new MilestoneError("Only a submitted milestone can be disputed.");

  const updated = await update(milestoneId, { status: "disputed" }, "submitted");
  if (!updated) throw new MilestoneError("This milestone was just handled by another request — refresh to see its current status.");

  const project = await getProject(m.projectId);
  if (project) {
    const msg = `A dispute was raised on "${m.title}". Arbiter will assemble the evidence from both sides before anything moves. Auto-release is cancelled.`;
    /* Notify whichever party did NOT raise it — the one who needs to
       hear about this from someone other than themselves. Previously
       this always notified the client even when the client was the one
       who raised it, and never reached the expert whose payment just
       froze if the client raised it. */
    const other = raisedBy === project.clientId ? project.awardedExpertId : project.clientId;
    if (other) await notify(other, "Milestone disputed", msg);
  }
  await record({ orgId: null, actorId: raisedBy, actorRole: "unknown", action: "milestone_disputed", target: m.id });

  return updated;
}

async function findOne(milestoneId: string): Promise<Milestone | null> {
  if (persistenceEnabled()) {
    const col = await collection<Milestone>("milestones");
    if (col) return col.findOne({ id: milestoneId });
  }
  return store.get(milestoneId) ?? null;
}

/**
 * `expectedStatus`, when given, makes this an optimistic-concurrency
 * write: it only applies if the milestone's status is still what the
 * caller last read it as. Without this, `disputeMilestone` and
 * `processAutoReleases` (or two overlapping auto-release sweeps) could
 * both read the same `submitted` milestone and both write — whichever
 * write landed second would silently overwrite the first (e.g. an
 * auto-release firing right after a client disputed the same
 * milestone, releasing funds the client had just frozen). Returns
 * `null` when the guard fails, meaning another request already moved
 * this milestone — callers must treat that as "did not happen", not
 * as success.
 */
async function update(
  milestoneId: string,
  patch: Partial<Milestone>,
  expectedStatus?: MilestoneStatus,
): Promise<Milestone | null> {
  if (persistenceEnabled()) {
    const col = await collection<Milestone>("milestones");
    if (col) {
      const filter = expectedStatus ? { id: milestoneId, status: expectedStatus } : { id: milestoneId };
      return col.findOneAndUpdate(filter, { $set: patch }, { returnDocument: "after" });
    }
  }
  const m = store.get(milestoneId);
  if (!m) return null;
  if (expectedStatus && m.status !== expectedStatus) return null;
  Object.assign(m, patch);
  return m;
}

/**
 * THE SWEEP.
 *
 * Finds certified, still-`submitted` milestones whose silence window
 * has passed and releases them on the timer — the second of the two
 * routes to release described in lib/autoRelease.ts.
 *
 * There is no background job scheduler in this environment, so this is
 * called opportunistically: from `POST /api/cron/auto-release` (for a
 * real scheduler — Vercel Cron or an external ping — to hit on an
 * interval) AND from the engagements read path, so the system remains
 * self-correcting even if nothing external is configured. Either
 * caller converges on the same result because the check itself
 * (`autoReleaseAt <= now`) is idempotent.
 */
export async function processAutoReleases(): Promise<{ released: string[] }> {
  const released: string[] = [];
  const now = Date.now();
  const candidates = await allSubmittedWithDeadline();

  for (const m of candidates) {
    if ((BLOCKS_AUTO_RELEASE as readonly string[]).includes(m.status)) continue;
    if (!m.aiCertified || !m.autoReleaseAt || m.autoReleaseAt > now) continue;

    /* Guarded on "submitted" — if a client disputed or approved this
       milestone in the window between the query above and this write,
       the guard fails and this iteration is correctly a no-op instead
       of overwriting their decision. */
    const updated = await update(m.id, { status: "approved", approvedAt: now, autoReleased: true }, "submitted");
    if (!updated) continue;
    released.push(m.id);

    const project = await getProject(m.projectId);
    if (project) {
      const msg = `"${m.title}" was approved automatically — ${m.currency} ${m.amount.toLocaleString()} has been released, no response within ${autoReleaseWindowLabel()}.`;
      await notify(project.clientId, "Milestone auto-released", msg);
      if (project.awardedExpertId) {
        await notify(project.awardedExpertId, "Milestone approved", `"${m.title}" was approved automatically — ${m.currency} ${m.amount.toLocaleString()} is now available to withdraw (no response within ${autoReleaseWindowLabel()}).`);
      }
    }
    await record({ orgId: null, actorId: "system", actorRole: "auto-release", action: "milestone_auto_released", target: m.id, detail: `${m.currency} ${m.amount}` });
  }

  return { released };
}

async function allSubmittedWithDeadline(): Promise<Milestone[]> {
  if (persistenceEnabled()) {
    const col = await collection<Milestone>("milestones");
    if (col) return col.find({ status: "submitted", autoReleaseAt: { $exists: true } }).toArray();
  }
  return [...store.values()].filter((m) => m.status === "submitted" && m.autoReleaseAt);
}

/** Engagements = projects that have moved past posting into delivery. */
export async function engagementSummary(projectIds: string[]) {
  const all = await Promise.all(projectIds.map((id) => listMilestones(id)));
  const flat = all.flat();
  return {
    total: flat.length,
    approved: flat.filter((m) => m.status === "approved").length,
    submitted: flat.filter((m) => m.status === "submitted").length,
    disputed: flat.filter((m) => m.status === "disputed").length,
  };
}
