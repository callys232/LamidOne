import { handler, ok, fail, rateLimited } from "@/lib/http";
import { limit, clientId } from "@/lib/ratelimit";
import { resolveIdentity } from "@/lib/entitlements";
import { listBanks, paystackConfigured, PaystackError } from "@/lib/paystack";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Bank list for the payout-account form.
 *
 * Returns an explicit `configured: false` when Paystack has no key
 * rather than a fabricated bank list — a dropdown of banks that do not
 * actually resolve would fail confusingly at the verify step instead
 * of here, where the reason is clear.
 */
export const GET = handler(async (req) => {
  const identity = await resolveIdentity(req);
  const rl = await limit("read", identity.userId ?? clientId(req));
  if (!rl.ok) return rateLimited(rl.retryAfter);

  if (!paystackConfigured()) {
    return ok({ configured: false, banks: [] });
  }

  try {
    return ok({ configured: true, banks: await listBanks() });
  } catch (e) {
    if (e instanceof PaystackError) return fail(502, "paystack_error", e.message);
    throw e;
  }
});
