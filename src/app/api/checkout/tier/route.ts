import { randomUUID } from "node:crypto";
import { handler, ok, fail, badRequest, tooLarge, rateLimited, bodyTooLarge } from "@/lib/http";
import { limit } from "@/lib/ratelimit";
import { resolveIdentity } from "@/lib/entitlements";
import { initializeTransaction, PaystackError, paystackConfigured } from "@/lib/paystack";
import { createCheckoutSession, StripeError, stripeConfigured } from "@/lib/stripe";
import { createOrder } from "@/lib/checkout";
import { getOrCreatePlanCode } from "@/lib/subscriptionPlans";
import { requirePersistenceInProd } from "@/lib/store";
import { env } from "@/lib/env";
import { TIERS, type TierId } from "@/content/tiers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ref = () => `tier_${randomUUID()}`;

/**
 * Starts a real Paystack Checkout for a self-serve tier upgrade.
 * Enterprise and Concierge are deliberately excluded — sales-assisted
 * and approval motion respectively, with pricing that either needs
 * confirmation or is negotiated, neither of which belongs behind a
 * self-serve card form. Price is always this account's own TIERS
 * entry, never client-supplied.
 *
 * This IS a recurring subscription: the transaction is initialized
 * against a Paystack Plan (lib/subscriptionPlans.ts), so a successful
 * first payment saves the card and Paystack auto-charges it every
 * billing interval on its own, firing `charge.success` again for each
 * renewal — handled by /api/webhooks/paystack, not by this route.
 * Cancellation is /api/billing/cancel.
 */
export const POST = handler(async (req) => {
  requirePersistenceInProd();
  if (bodyTooLarge(req, 1024)) return tooLarge();

  const identity = await resolveIdentity(req);
  if (!identity.userId || !identity.email) return fail(401, "unauthorised", "Sign in to upgrade.");

  const rl = await limit("form", identity.userId);
  if (!rl.ok) return rateLimited(rl.retryAfter);

  const body = await req.json().catch(() => null) as { tier?: string; annual?: boolean; provider?: string } | null;
  const tier = TIERS.find((t) => t.id === body?.tier);
  if (!tier || tier.motion !== "self-serve" || tier.price.monthly === null) {
    return badRequest("`tier` must be a self-serve plan with a published price (starter or growth).");
  }

  const provider = body?.provider === "stripe" ? "stripe" : "paystack";
  if (provider === "stripe" ? !stripeConfigured() : !paystackConfigured()) {
    return fail(503, "not_configured", "Payments are not configured yet.");
  }

  const interval: "monthly" | "annually" = body?.annual ? "annually" : "monthly";
  const usd = interval === "annually" ? tier.price.annual! : tier.price.monthly;
  const reference = ref();
  await createOrder({
    reference, userId: identity.userId, kind: "tier", tier: tier.id as TierId, usd, billingInterval: interval,
  });

  if (provider === "stripe") {
    try {
      const session = await createCheckoutSession({
        email: identity.email,
        amountMajorUnit: usd,
        reference,
        productName: `LAMID ONE — ${tier.name} (${interval})`,
        successUrl: `${env.siteUrl}/api/checkout/callback?provider=stripe&reference=${reference}&session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${env.siteUrl}/dashboard/billing?purchase=cancelled`,
        metadata: { userId: identity.userId, kind: "tier", tier: tier.id },
        mode: "subscription",
        interval: interval === "annually" ? "year" : "month",
      });
      return ok({ authorizationUrl: session.url });
    } catch (e) {
      if (e instanceof StripeError) return fail(502, "payment_failed", e.message);
      throw e;
    }
  }

  try {
    const planCode = await getOrCreatePlanCode(tier, interval);
    const tx = await initializeTransaction({
      email: identity.email,
      amountMajorUnit: usd,
      reference,
      callbackUrl: `${env.siteUrl}/api/checkout/callback`,
      metadata: { userId: identity.userId, kind: "tier", tier: tier.id },
      plan: planCode,
    });
    return ok({ authorizationUrl: tx.authorization_url });
  } catch (e) {
    if (e instanceof PaystackError) return fail(502, "payment_failed", e.message);
    throw e;
  }
});
