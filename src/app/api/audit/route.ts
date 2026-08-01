import { handler, ok, fail, rateLimited } from "@/lib/http";
import { limit } from "@/lib/ratelimit";
import { resolveIdentity } from "@/lib/entitlements";
import { listAudit } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The audit log.
 *
 * Enterprise-and-above only, and scoped to the caller's own org even
 * for operators viewing on someone's behalf — an operator's blanket
 * read access is granted through /api/admin surfaces, not by widening
 * this endpoint.
 */
export const GET = handler(async (req) => {
  const identity = await resolveIdentity(req);
  if (!identity.userId) return fail(401, "unauthorised", "Sign in to view the audit log.");
  if (identity.tier !== "enterprise" && identity.tier !== "concierge" && !identity.isAdmin) {
    return fail(403, "tier_required", "The audit log is available from Enterprise.", { kind: "upgrade", tier: "enterprise" });
  }

  const rl = await limit("read", identity.userId);
  if (!rl.ok) return rateLimited(rl.retryAfter);

  return ok({ entries: await listAudit({ orgId: identity.orgId, take: 100 }) });
});
