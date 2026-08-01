import { handler, ok, fail, badRequest, tooLarge, rateLimited, bodyTooLarge } from "@/lib/http";
import { limit } from "@/lib/ratelimit";
import { resolveIdentity } from "@/lib/entitlements";
import { initializeTransaction, PaystackError, paystackConfigured } from "@/lib/paystack";
import { createOrder } from "@/lib/checkout";
import { env } from "@/lib/env";
import { TIERS, type TierId } from "@/content/tiers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ref = () => `tier_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;

/**
 * Starts a real Paystack Checkout for a self-serve tier upgrade.
 * Enterprise and Concierge are deliberately excluded — sales-assisted
 * and approval motion respectively, with pricing that either needs
 * confirmation or is negotiated, neither of which belongs behind a
 * self-serve card form. Price is always this account's own TIERS
 * entry, never client-supplied.
 *
 * This charges the FIRST payment and activates the tier on success —
 * it is not a recurring subscription. Renewal, cancellation and
 * dunning would need Paystack's Plan/Subscription objects and a
 * webhook handler, which is a real follow-up, not implemented here.
 */
export const POST = handler(async (req) => {
  if (bodyTooLarge(req, 1024)) return tooLarge();

  const identity = await resolveIdentity(req);
  if (!identity.userId || !identity.email) return fail(401, "unauthorised", "Sign in to upgrade.");

  const rl = await limit("form", identity.userId);
  if (!rl.ok) return rateLimited(rl.retryAfter);

  const body = await req.json().catch(() => null) as { tier?: string; annual?: boolean } | null;
  const tier = TIERS.find((t) => t.id === body?.tier);
  if (!tier || tier.motion !== "self-serve" || tier.price.monthly === null) {
    return badRequest("`tier` must be a self-serve plan with a published price (starter or growth).");
  }

  if (!paystackConfigured()) return fail(503, "not_configured", "Payments are not configured yet.");

  const usd = body?.annual ? tier.price.annual! : tier.price.monthly;
  const reference = ref();
  await createOrder({ reference, userId: identity.userId, kind: "tier", tier: tier.id as TierId, usd });

  try {
    const tx = await initializeTransaction({
      email: identity.email,
      amountMajorUnit: usd,
      reference,
      callbackUrl: `${env.siteUrl}/api/checkout/callback`,
      metadata: { userId: identity.userId, kind: "tier", tier: tier.id },
    });
    return ok({ authorizationUrl: tx.authorization_url });
  } catch (e) {
    if (e instanceof PaystackError) return fail(502, "payment_failed", e.message);
    throw e;
  }
});
