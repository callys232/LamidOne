import { handler, ok, fail, rateLimited } from "@/lib/http";
import { limit, clientId } from "@/lib/ratelimit";
import { resolveIdentity } from "@/lib/entitlements";
import { listCompleted, trackRecord } from "@/lib/marketplace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Delivered work.
 *
 *   ?mine=1        — the caller's own closed projects (client side)
 *   ?expertId=…    — an expert's track record and portfolio
 *   (default)      — the public portfolio: ONLY records the client both
 *                    verified and consented to publish
 *
 * The public default is the important one. Anything without explicit
 * publish consent stays private no matter who asks, which is what makes
 * the case-study surface safe to build on.
 */
export const GET = handler(async (req) => {
  const url = new URL(req.url);
  const identity = await resolveIdentity(req);

  const rl = await limit("read", identity.userId ?? clientId(req));
  if (!rl.ok) return rateLimited(rl.retryAfter);

  const mine = url.searchParams.get("mine") === "1";
  const rawExpertId = url.searchParams.get("expertId");
  const take = Number(url.searchParams.get("take") ?? 25);

  /* `?expertId=me` resolves against the CALLER's verified identity — a
     client-side page cannot know its own userId (the dashboard view
     never exposes it), and this keeps that true rather than adding a
     backdoor where a client could pass any other id through "me". */
  if (rawExpertId === "me" && !identity.userId) {
    return fail(401, "unauthorised", "Sign in to view your earnings.");
  }
  const expertId = rawExpertId === "me" ? identity.userId : rawExpertId;

  if (mine) {
    if (!identity.userId) return fail(401, "unauthorised", "Sign in to see your completed projects.");
    return ok({ scope: "mine", projects: await listCompleted({ clientId: identity.userId, take }) });
  }

  if (expertId) {
    return ok({
      scope: "expert",
      expertId,
      record: await trackRecord(expertId),
      /* Even on an expert's own portfolio, only consented records are
         shown — the work is theirs, but the story is the client's. */
      portfolio: await listCompleted({ expertId, publishableOnly: true, take }),
    });
  }

  return ok({
    scope: "public",
    projects: await listCompleted({ publishableOnly: true, take }),
    note: "Only projects a client has verified and consented to publish appear here.",
  });
});
