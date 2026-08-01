import { handler, ok, fail, badRequest, rateLimited, bodyTooLarge, tooLarge } from "@/lib/http";
import { limit } from "@/lib/ratelimit";
import { resolveIdentity } from "@/lib/entitlements";
import { getPayoutAccount, addPayoutAccount, PayoutError } from "@/lib/payouts";
import { PaystackError } from "@/lib/paystack";
import { record } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The caller's payout account.
 *
 * The full account number is never returned — `getPayoutAccount`
 * already strips it server-side, so there is no response shape here
 * that could accidentally leak it, even if this route is later edited
 * carelessly.
 */
export const GET = handler(async (req) => {
  const identity = await resolveIdentity(req);
  if (!identity.userId) return fail(401, "unauthorised", "Sign in to view your payout account.");

  const rl = await limit("read", identity.userId);
  if (!rl.ok) return rateLimited(rl.retryAfter);

  return ok({ account: await getPayoutAccount(identity.userId) });
});

/**
 * Add or replace the payout account.
 *
 * Verifies the account number resolves to a real name at the chosen
 * bank BEFORE saving anything — see lib/payouts.ts. If Paystack is not
 * configured this returns 503 rather than saving an unverified number,
 * because an unverifiable payout destination is worse than none.
 */
export const POST = handler(async (req) => {
  if (bodyTooLarge(req, 4 * 1024)) return tooLarge();

  const identity = await resolveIdentity(req);
  if (!identity.userId) return fail(401, "unauthorised", "Sign in to add a payout account.");

  const rl = await limit("form", identity.userId);
  if (!rl.ok) return rateLimited(rl.retryAfter);

  const body = await req.json().catch(() => null) as
    | { accountNumber?: string; bankCode?: string; bankName?: string }
    | null;
  if (!body?.accountNumber || !body?.bankCode || !body?.bankName) {
    return badRequest("`accountNumber`, `bankCode` and `bankName` are required.");
  }

  try {
    const account = await addPayoutAccount(identity.userId, body as never);
    await record({
      orgId: identity.orgId, actorId: identity.userId, actorRole: "expert",
      action: "payout_account_added", target: account.bankName, detail: account.accountNumberMasked,
    });
    return ok({ account });
  } catch (e) {
    if (e instanceof PayoutError) return badRequest(e.message);
    if (e instanceof PaystackError) return fail(502, "paystack_error", `Could not verify that account: ${e.message}`);
    throw e;
  }
});
