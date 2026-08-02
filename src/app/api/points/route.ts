import { handler, ok, fail, rateLimited } from "@/lib/http";
import { limit } from "@/lib/ratelimit";
import { resolveIdentity } from "@/lib/entitlements";
import { available, getBalanceAsync, historyAsync } from "@/lib/points";
import { POINT_PACKAGES, USD_PER_POINT } from "@/content/agents";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Current balance and recent ledger entries. */
export const GET = handler(async (req) => {
  const identity = await resolveIdentity(req);
  if (!identity.userId) return fail(401, "unauthorised", "Sign in to see your balance.");

  const rl = await limit("read", identity.userId);
  if (!rl.ok) return rateLimited(rl.retryAfter);

  const balance = await getBalanceAsync(identity.userId);
  return ok({
    balance: {
      allowance: balance.allowance,
      purchased: balance.purchased,
      held: balance.held,
      available: available(balance),
    },
    packages: POINT_PACKAGES,
    usdPerPoint: USD_PER_POINT,
    history: await historyAsync(identity.userId, 25),
  });
});

/**
 * Points used to be creditable via `POST` on this route, gated only
 * by a plain string compared against `LAMID_WEBHOOK_SECRET` — not a
 * real Paystack signature, and not called from anywhere in this app.
 * An unauthenticated (or weak-secret) credit endpoint for an arbitrary
 * `userId` is a free-money oracle if that secret ever leaks or is
 * guessed. Real crediting now happens through
 * /api/webhooks/paystack (HMAC-SHA512-verified against
 * PAYSTACK_SECRET_KEY) and the browser callback at
 * /api/checkout/callback, both funnelling through the same
 * idempotent `fulfillOrder` — see lib/fulfillment.ts.
 */
