import { handler, ok, fail, rateLimited } from "@/lib/http";
import { limit } from "@/lib/ratelimit";
import { resolveIdentity } from "@/lib/entitlements";
import { listProjects, listBidsByExpert, getProject } from "@/lib/marketplace";
import { listMilestones, processAutoReleases } from "@/lib/milestones";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Live engagements — projects that have moved past posting into
 * delivery, with their milestones attached. This is what "Engagements"
 * shows: not the brief, the work happening against it.
 */
export const GET = handler(async (req) => {
  const identity = await resolveIdentity(req);
  if (!identity.userId) return fail(401, "unauthorised", "Sign in to view engagements.");

  const rl = await limit("read", identity.userId);
  if (!rl.ok) return rateLimited(rl.retryAfter);

  /* Opportunistic sweep: with no background scheduler in this
     environment, checking on every read is what keeps auto-release
     self-correcting rather than depending entirely on an external cron
     hitting /api/cron/auto-release. The check is idempotent, so running
     it here and from the cron route never double-releases anything. */
  await processAutoReleases();

  const isExpert = new URL(req.url).searchParams.get("as") === "expert";

  let projectIds: string[];
  if (isExpert) {
    const bids = await listBidsByExpert(identity.userId, 100);
    const accepted = bids.filter((b) => b.status === "accepted");
    projectIds = accepted.map((b) => b.projectId);
  } else {
    const projects = await listProjects({ clientId: identity.userId, take: 100 });
    projectIds = projects.filter((p) => p.status === "awarded" || p.status === "in_delivery").map((p) => p.id);
  }

  const engagements = await Promise.all(
    projectIds.map(async (id) => {
      const [project, milestones] = await Promise.all([getProject(id), listMilestones(id)]);
      return project ? { project, milestones } : null;
    }),
  );

  return ok({ engagements: engagements.filter(Boolean) });
});
