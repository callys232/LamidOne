import { handler, ok, fail, rateLimited } from "@/lib/http";
import { limit } from "@/lib/ratelimit";
import { resolveIdentity } from "@/lib/entitlements";
import { findUserById, publicUser } from "@/lib/users";
import { getBalanceAsync, historyAsync } from "@/lib/points";
import { listProjects, listBidsByExpert, listCompleted } from "@/lib/marketplace";
import { listMilestones } from "@/lib/milestones";
import { listEvents } from "@/lib/events";
import { listTickets } from "@/lib/tickets";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Self-service data export — what the trust centre and the settings
 * page both promise ("full self-service export of everything held
 * about you"). Before this route existed, the "Export data" button on
 * /dashboard/settings had no handler at all: a claim the UI made with
 * nothing behind it.
 *
 * Every collection this app actually writes to a user's own data into
 * (see DATA_ENTITIES in content/platform.ts) is represented here,
 * scoped to records this identity owns — never another user's.
 */
export const GET = handler(async (req) => {
  const identity = await resolveIdentity(req);
  if (!identity.userId) return fail(401, "unauthorised", "Sign in to export your data.");

  const rl = await limit("read", identity.userId);
  if (!rl.ok) return rateLimited(rl.retryAfter);

  const userId = identity.userId;
  const user = await findUserById(userId);
  if (!user) return fail(404, "not_found", "No profile on record for this account.");

  const [balance, ledger, projectsAsClient, bidsAsExpert, completedAsClient, completedAsExpert, eventsHosted, tickets] =
    await Promise.all([
      getBalanceAsync(userId),
      historyAsync(userId, 500),
      listProjects({ clientId: userId, take: 100 }),
      listBidsByExpert(userId, 100),
      listCompleted({ clientId: userId, take: 100 }),
      listCompleted({ expertId: userId, take: 100 }),
      listEvents({ hostId: userId, take: 100 }),
      listTickets(userId, 200),
    ]);

  const milestonesByProject = await Promise.all(
    projectsAsClient.map(async (p) => ({ projectId: p.id, milestones: await listMilestones(p.id) })),
  );

  return ok({
    exportedAt: new Date().toISOString(),
    profile: publicUser(user),
    points: { balance, ledger },
    marketplace: {
      projectsPosted: projectsAsClient,
      bidsPlaced: bidsAsExpert,
      completedAsClient,
      completedAsExpert,
      milestonesByProject,
    },
    events: { hosted: eventsHosted },
    supportTickets: tickets,
  }, {
    headers: {
      "Content-Disposition": `attachment; filename="lamid-one-export-${userId}.json"`,
    },
  });
});
