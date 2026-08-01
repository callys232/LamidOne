import { handler, ok, fail, badRequest, rateLimited } from "@/lib/http";
import { limit } from "@/lib/ratelimit";
import { resolveIdentity } from "@/lib/entitlements";
import { available, getBalanceAsync, creditAsync, historyAsync } from "@/lib/points";
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
 * Credit points after a confirmed purchase.
 *
 * ⚠️  This must only ever be called from a verified payment webhook —
 * Stripe or Paystack — never from the browser. ProdLamid already has
 * `api/escrows/paystack/webhook` doing signature verification; wire
 * this behind the same check. An unauthenticated credit endpoint is
 * free money.
 */
export const POST = handler(async (req) => {
  const secret = req.headers.get("x-lamid-webhook-secret");
  if (!secret || secret !== process.env.LAMID_WEBHOOK_SECRET) {
    return fail(401, "unauthorised", "Webhook signature required.");
  }

  const body = await req.json().catch(() => null) as
    | { userId?: string; points?: number; kind?: "allowance" | "purchased"; reference?: string }
    | null;

  if (!body?.userId || typeof body.points !== "number" || body.points <= 0) {
    return badRequest("`userId` and a positive `points` value are required.");
  }

  const kind = body.kind === "allowance" ? "allowance" : "purchased";
  const balance = await creditAsync(
    body.userId, Math.floor(body.points), kind, body.reference ?? "purchase",
  );

  return ok({ balance: { ...balance, available: available(balance) } });
});
