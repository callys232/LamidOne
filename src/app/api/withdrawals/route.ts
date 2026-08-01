import { handler, ok, fail, badRequest, rateLimited, bodyTooLarge, tooLarge } from "@/lib/http";
import { limit } from "@/lib/ratelimit";
import { resolveIdentity } from "@/lib/entitlements";
import { listWithdrawals, requestWithdrawal, PayoutError } from "@/lib/payouts";
import { PaystackError } from "@/lib/paystack";
import { trackRecord } from "@/lib/marketplace";
import { record } from "@/lib/audit";
import { notify } from "@/lib/notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = handler(async (req) => {
  const identity = await resolveIdentity(req);
  if (!identity.userId) return fail(401, "unauthorised", "Sign in to view withdrawals.");

  const rl = await limit("read", identity.userId);
  if (!rl.ok) return rateLimited(rl.retryAfter);

  const trackRecordResult = await trackRecord(identity.userId);
  const paid = (await listWithdrawals(identity.userId))
    .filter((w) => w.status === "paid" || w.status === "processing")
    .reduce((s, w) => s + w.amount, 0);

  return ok({
    withdrawals: await listWithdrawals(identity.userId),
    available: Math.max(0, trackRecordResult.totalValueDelivered - paid),
  });
});

/**
 * Request a withdrawal.
 *
 * The withdrawable amount is computed HERE, server-side, from the
 * caller's real track record — never taken from the request body. A
 * client that could pass its own "available" figure could withdraw
 * money it never earned.
 */
export const POST = handler(async (req) => {
  if (bodyTooLarge(req, 2 * 1024)) return tooLarge();

  const identity = await resolveIdentity(req);
  if (!identity.userId) return fail(401, "unauthorised", "Sign in to withdraw.");

  const rl = await limit("agent", identity.userId);
  if (!rl.ok) return rateLimited(rl.retryAfter);

  const body = await req.json().catch(() => null) as { amount?: number } | null;
  if (typeof body?.amount !== "number") return badRequest("`amount` is required.");

  const [trackRecordResult, prior] = await Promise.all([
    trackRecord(identity.userId),
    listWithdrawals(identity.userId),
  ]);
  const alreadyMoving = prior.filter((w) => w.status === "paid" || w.status === "processing").reduce((s, w) => s + w.amount, 0);
  const available = Math.max(0, trackRecordResult.totalValueDelivered - alreadyMoving);

  try {
    const withdrawal = await requestWithdrawal(identity.userId, body.amount, available);
    await record({
      orgId: identity.orgId, actorId: identity.userId, actorRole: "expert",
      action: "withdrawal_requested", target: withdrawal.id, detail: `${withdrawal.currency} ${withdrawal.amount}`,
    });
    await notify(identity.userId, "Withdrawal requested",
      `${withdrawal.currency} ${withdrawal.amount.toLocaleString()} is ${withdrawal.status === "processing" ? "on its way to your bank account" : "being processed"}.`);
    return ok({ withdrawal }, { status: 201 });
  } catch (e) {
    if (e instanceof PayoutError) return badRequest(e.message);
    if (e instanceof PaystackError) return fail(502, "paystack_error", e.message);
    throw e;
  }
});
