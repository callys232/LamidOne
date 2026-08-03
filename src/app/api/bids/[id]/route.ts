import { requirePersistenceInProd } from "@/lib/store";
import { handler, ok, fail, badRequest, tooLarge, rateLimited, bodyTooLarge } from "@/lib/http";
import { limit } from "@/lib/ratelimit";
import { resolveIdentity } from "@/lib/entitlements";
import { withdrawBid, MarketplaceError } from "@/lib/marketplace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Withdraw your own bid — the other half of the missing lifecycle.
 * `placeBid` has always refused a second bid with "withdraw it
 * first"; until this route existed, there was no way to actually do
 * that. Free — withdrawing costs nothing, same as awarding.
 */
export const PATCH = handler(async (req) => {
  requirePersistenceInProd();
  if (bodyTooLarge(req, 1024)) return tooLarge();

  const bidId = new URL(req.url).pathname.split("/").at(-1) ?? "";

  const identity = await resolveIdentity(req);
  if (!identity.userId) return fail(401, "unauthorised", "Sign in to withdraw a bid.");

  const rl = await limit("agent", identity.userId);
  if (!rl.ok) return rateLimited(rl.retryAfter);

  const body = await req.json().catch(() => ({})) as { action?: string };
  if (body.action && body.action !== "withdraw") {
    return badRequest('The only supported `action` is "withdraw".');
  }

  try {
    const bid = await withdrawBid(identity.userId, bidId);
    return ok({ bid });
  } catch (e) {
    if (e instanceof MarketplaceError) return badRequest(e.message);
    throw e;
  }
});
