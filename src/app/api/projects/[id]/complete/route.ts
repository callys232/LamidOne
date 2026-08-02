import { handler, ok, fail, badRequest, tooLarge, rateLimited, bodyTooLarge } from "@/lib/http";
import { limit } from "@/lib/ratelimit";
import { resolveIdentity } from "@/lib/entitlements";
import { completeProject, MarketplaceError } from "@/lib/marketplace";
import { requirePersistenceInProd } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Close a delivered project.
 *
 * Free — closing work you have already paid for should never cost
 * points. Charging to finish something is the kind of meter that makes
 * people distrust every other meter you have.
 */
export const POST = handler(async (req) => {
  requirePersistenceInProd();
  if (bodyTooLarge(req, 32 * 1024)) return tooLarge();

  const projectId = new URL(req.url).pathname.split("/").at(-2) ?? "";

  const identity = await resolveIdentity(req);
  if (!identity.userId) return fail(401, "unauthorised", "Sign in to close a project.");

  const rl = await limit("agent", identity.userId);
  if (!rl.ok) return rateLimited(rl.retryAfter);

  const body = await req.json().catch(() => null) as {
    finalValue?: number; milestonesApproved?: number;
    outcome?: { summary?: string; verifiedByClient?: boolean; publishConsent?: boolean };
    rating?: number;
  } | null;
  if (!body) return badRequest("Body must be JSON.");

  try {
    /* Which expert gets credited comes from the project's own award
       record (set by POST /api/projects/[id]/award), never from this
       body — see completeProject()'s own guard. */
    const record = await completeProject(projectId, identity.userId, {
      finalValue: Number(body.finalValue ?? 0),
      milestonesApproved: Number(body.milestonesApproved ?? 0),
      outcome: body.outcome?.summary
        ? {
            summary: body.outcome.summary,
            verifiedByClient: body.outcome.verifiedByClient,
            publishConsent: body.outcome.publishConsent,
          }
        : undefined,
      rating: body.rating,
    });

    return ok({
      project: record,
      publishable: Boolean(record.outcome?.verifiedByClient && record.outcome?.publishConsent),
      note: record.outcome && !record.outcome.publishConsent
        ? "Recorded, but not publishable — the client has not consented to it appearing publicly."
        : undefined,
    });
  } catch (e) {
    if (e instanceof MarketplaceError) return badRequest(e.message);
    throw e;
  }
});
