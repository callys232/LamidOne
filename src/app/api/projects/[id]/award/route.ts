import { handler, ok, fail, badRequest, tooLarge, rateLimited, bodyTooLarge } from "@/lib/http";
import { limit } from "@/lib/ratelimit";
import { resolveIdentity } from "@/lib/entitlements";
import { awardBid, MarketplaceError } from "@/lib/marketplace";
import { record as auditRecord } from "@/lib/audit";
import { requirePersistenceInProd } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Award a bid — the missing handoff this project's data layer never
 * had: a client could post a project and receive bids but never hire
 * anyone through the system. Free — awarding is a decision, not a
 * billable action.
 */
export const POST = handler(async (req) => {
  requirePersistenceInProd();
  if (bodyTooLarge(req, 4 * 1024)) return tooLarge();

  const projectId = new URL(req.url).pathname.split("/").at(-2) ?? "";

  const identity = await resolveIdentity(req);
  if (!identity.userId) return fail(401, "unauthorised", "Sign in to award a bid.");

  const rl = await limit("agent", identity.userId);
  if (!rl.ok) return rateLimited(rl.retryAfter);

  const body = await req.json().catch(() => null) as { bidId?: string } | null;
  if (!body?.bidId) return badRequest("`bidId` is required.");

  try {
    const { project, bid } = await awardBid(identity.userId, projectId, body.bidId);

    await auditRecord({
      orgId: identity.orgId, actorId: identity.userId, actorRole: identity.role ?? "client",
      action: "project_awarded", target: project.id, detail: `Awarded to expert ${bid.expertId}`,
    });

    return ok({ project, bid });
  } catch (e) {
    if (e instanceof MarketplaceError) return badRequest(e.message);
    throw e;
  }
});
