import { handler, ok, fail, badRequest, tooLarge, rateLimited, bodyTooLarge } from "@/lib/http";
import { limit, clientId } from "@/lib/ratelimit";
import { resolveIdentity } from "@/lib/entitlements";
import { withMeterCost, available, getBalanceAsync } from "@/lib/points";
import { requirePersistenceInProd } from "@/lib/store";
import {
  createProject, listProjects, getExpertProfile, MarketplaceError, POST_PROJECT_COST,
  type ProjectStatus,
} from "@/lib/marketplace";
import { notify } from "@/lib/notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Browse open briefs, or your own if `mine=1`. */
export const GET = handler(async (req) => {
  const url = new URL(req.url);
  const identity = await resolveIdentity(req);

  const rl = await limit("read", identity.userId ?? clientId(req));
  if (!rl.ok) return rateLimited(rl.retryAfter);

  const mine = url.searchParams.get("mine") === "1";
  if (mine && !identity.userId) return fail(401, "unauthorised", "Sign in to see your own projects.");

  return ok({
    projects: await listProjects({
      clientId: mine ? identity.userId! : undefined,
      status: (url.searchParams.get("status") as ProjectStatus) ?? (mine ? undefined : "open"),
      skill: url.searchParams.get("skill") ?? undefined,
      take: Number(url.searchParams.get("take") ?? 25),
    }),
    postCost: POST_PROJECT_COST,
  });
});

/**
 * Post a project. Costs 50 points.
 *
 * Metered like an agent run, so a validation failure releases the hold
 * and the client is not charged for a brief that never posted.
 */
export const POST = handler(async (req) => {
  requirePersistenceInProd();
  if (bodyTooLarge(req, 64 * 1024)) return tooLarge();

  const identity = await resolveIdentity(req);
  if (!identity.userId) return fail(401, "unauthorised", "Sign in to post a project.");

  const rl = await limit("agent", identity.userId);
  if (!rl.ok) return rateLimited(rl.retryAfter);

  const body = await req.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return badRequest("Body must be JSON.");

  const balance = await getBalanceAsync(identity.userId);
  if (available(balance) < POST_PROJECT_COST) {
    return fail(402, "insufficient_points", `Posting a project costs ${POST_PROJECT_COST} points.`, {
      kind: "topup",
      points: POST_PROJECT_COST - available(balance),
    });
  }

  try {
    /* Charged at the published marketplace rate, which is the same
       number the gate above checked. */
    const { result, charged, balance: after } = await withMeterCost(
      identity, POST_PROJECT_COST, "project_posted", () => createProject(identity.userId!, body),
    );

    /* The brief posts fully open — anyone can still bid on it — this is
       a warm lead, not an exclusive lock. Best effort: an invite that
       fails to send must not undo a project that was already charged
       for and created. */
    const invitedExpertId = typeof body.invitedExpertId === "string" ? body.invitedExpertId : null;
    if (invitedExpertId) {
      try {
        const expert = await getExpertProfile(invitedExpertId);
        if (expert) {
          await notify(invitedExpertId, "You were invited to bid", `A client invited you directly to bid on "${result.title}".`);
        }
      } catch (e) {
        console.error("[projects] invite notify failed:", e);
      }
    }

    return ok({ project: result, charged, balance: { available: available(after) } }, { status: 201 });
  } catch (e) {
    if (e instanceof MarketplaceError) return badRequest(e.message);
    if ((e as Error).message === "insufficient_points") {
      return fail(402, "insufficient_points", "Not enough LAMID Points.", { kind: "topup" });
    }
    console.error("[projects] post failed, not charged:", e);
    return fail(500, "post_failed", "The project could not be posted. You have not been charged.");
  }
});
