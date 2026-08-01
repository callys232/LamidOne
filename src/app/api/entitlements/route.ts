import { handler, ok, rateLimited } from "@/lib/http";
import { limit, clientId } from "@/lib/ratelimit";
import { resolveIdentity, entitlementSummary } from "@/lib/entitlements";
import { getBalance, available } from "@/lib/points";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * What this caller may do.
 *
 * Lets the UI gate controls without a round trip per button, while the
 * server still enforces on every write. Client-side gating is a
 * courtesy; `canRunAgent` on the route is the actual control.
 */
export const GET = handler(async (req) => {
  const identity = await resolveIdentity(req);

  const rl = await limit("read", identity.userId ?? clientId(req));
  if (!rl.ok) return rateLimited(rl.retryAfter);

  const summary = entitlementSummary(identity);
  const balance = identity.userId ? getBalance(identity.userId) : null;

  return ok({
    ...summary,
    authenticated: Boolean(identity.userId),
    points: balance ? { available: available(balance), held: balance.held } : null,
  });
});
