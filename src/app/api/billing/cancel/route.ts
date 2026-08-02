import { handler, ok, fail, badRequest } from "@/lib/http";
import { resolveIdentity } from "@/lib/entitlements";
import { fetchSubscription, disableSubscription, PaystackError } from "@/lib/paystack";
import { findUserById, deactivateSubscription } from "@/lib/users";
import { requirePersistenceInProd } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Cancels the caller's own recurring subscription. Paystack requires
 * both the subscription code AND its one-time `email_token` to
 * disable a subscription — the token is not stored locally (it is
 * only ever handed out by `fetchSubscription`), so it is fetched
 * fresh here rather than cached anywhere a stale copy could go wrong.
 *
 * Downgrades to free immediately for a responsive UI, rather than
 * waiting on the `subscription.disable` webhook — that webhook still
 * fires and still calls the same `deactivateSubscription`, which is
 * safe to run twice (an update to values already set).
 */
export const POST = handler(async (req) => {
  requirePersistenceInProd();
  const identity = await resolveIdentity(req);
  if (!identity.userId) return fail(401, "unauthorised", "Sign in to manage billing.");

  const user = await findUserById(identity.userId);
  if (!user?.subscriptionCode) {
    return badRequest("There is no recurring subscription on this account to cancel.");
  }

  try {
    const sub = await fetchSubscription(user.subscriptionCode);
    await disableSubscription(user.subscriptionCode, sub.email_token);
  } catch (e) {
    if (e instanceof PaystackError) return fail(502, "cancel_failed", e.message);
    throw e;
  }

  await deactivateSubscription(user.subscriptionCode);
  return ok({ cancelled: true });
});
