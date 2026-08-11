import { handler, ok, fail, badRequest, rateLimited, bodyTooLarge, tooLarge } from "@/lib/http";
import { limit } from "@/lib/ratelimit";
import { resolveIdentity } from "@/lib/entitlements";
import { listWithdrawals, requestWithdrawal, PayoutError, PAYOUT_CURRENCY } from "@/lib/payouts";
import { PaystackError } from "@/lib/paystack";
import { approvedEarnings } from "@/lib/milestones";
import { record } from "@/lib/audit";
import { notify } from "@/lib/notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = handler(async (req) => {
  const identity = await resolveIdentity(req);
  if (!identity.userId) return fail(401, "unauthorised", "Sign in to view withdrawals.");

  const rl = await limit("read", identity.userId);
  if (!rl.ok) return rateLimited(rl.retryAfter);

  const [released, prior] = await Promise.all([
    approvedEarnings(identity.userId, PAYOUT_CURRENCY),
    listWithdrawals(identity.userId),
  ]);

  return ok({
    withdrawals: prior,
    available: Math.max(0, released - movingOrPaid(prior)),
  });
});

/**
 * Money already out or on its way. Counted against the released balance
 * so the same approval cannot fund two withdrawals.
 *
 * `failed` is deliberately excluded — a transfer Paystack rejected did
 * not move, and leaving it counted would strand the money permanently.
 */
function movingOrPaid(prior: { status: string; amount: number }[]) {
  return prior
    .filter((w) => w.status === "paid" || w.status === "processing")
    .reduce((s, w) => s + w.amount, 0);
}

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

  /* Recomputed here rather than trusted from the GET above — the two
     requests are seconds apart and a milestone can be disputed in
     between, which takes it out of `approved` and out of the balance. */
  const [released, prior] = await Promise.all([
    approvedEarnings(identity.userId, PAYOUT_CURRENCY),
    listWithdrawals(identity.userId),
  ]);
  const available = Math.max(0, released - movingOrPaid(prior));

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
