import Stripe from "stripe";

/**
 * STRIPE CLIENT — a second checkout rail alongside Paystack
 * (lib/paystack.ts), for card payments where Paystack isn't the
 * right fit. Deliberately mirrors that file's shape: one config check
 * that throws a typed error, one function per operation a caller
 * actually needs, amounts always in the account's major currency unit
 * (dollars, not cents) so every caller passes what the UI shows.
 *
 * Checkout Sessions use inline `price_data` rather than pre-created
 * Stripe Price objects — unlike Paystack, which requires a Plan to
 * exist before a subscription transaction can reference it, Stripe
 * accepts a recurring price defined right on the session, so there is
 * no plan-caching layer to build here (contrast
 * lib/subscriptionPlans.ts).
 */

export class StripeError extends Error {
  constructor(msg: string) { super(msg); this.name = "StripeError"; }
}

export const stripeConfigured = () => Boolean(process.env.STRIPE_SECRET_KEY);

let client: Stripe | null = null;

function stripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY ?? "";
  if (!key) throw new StripeError("STRIPE_SECRET_KEY is not configured.");
  if (!client) client = new Stripe(key);
  return client;
}

export type StripeCheckoutResult = { url: string; sessionId: string };

/** Starts a real Stripe Checkout Session. `mode: "subscription"` bills
 *  on `interval` and saves the card for auto-renewal, firing
 *  `invoice.paid` on every future cycle; `mode: "payment"` is a
 *  genuine one-time charge (points packages). */
export async function createCheckoutSession(input: {
  email: string;
  amountMajorUnit: number;
  currency?: string;
  reference: string;
  productName: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
  mode: "payment" | "subscription";
  interval?: "month" | "year";
}): Promise<StripeCheckoutResult> {
  try {
    const session = await stripe().checkout.sessions.create({
      mode: input.mode,
      customer_email: input.email,
      client_reference_id: input.reference,
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      metadata: input.metadata ?? {},
      line_items: [{
        quantity: 1,
        price_data: {
          currency: input.currency ?? "usd",
          unit_amount: Math.round(input.amountMajorUnit * 100),
          product_data: { name: input.productName },
          ...(input.mode === "subscription" ? { recurring: { interval: input.interval ?? "month" } } : {}),
        },
      }],
    });
    if (!session.url) throw new StripeError("Stripe did not return a checkout URL.");
    return { url: session.url, sessionId: session.id };
  } catch (e) {
    if (e instanceof StripeError) throw e;
    throw new StripeError(e instanceof Error ? e.message : "Stripe checkout session creation failed.");
  }
}

export type RetrievedSession = { paid: boolean; subscriptionId: string | null };

/** Confirms a session's own payment status with Stripe's API directly
 *  — same "never trust the redirect's query string alone" rule as
 *  Paystack's callback verifying with verifyTransaction(). */
export async function retrieveCheckoutSession(sessionId: string): Promise<RetrievedSession> {
  try {
    const session = await stripe().checkout.sessions.retrieve(sessionId);
    return {
      paid: session.payment_status === "paid" || session.status === "complete",
      subscriptionId: typeof session.subscription === "string" ? session.subscription : null,
    };
  } catch (e) {
    throw new StripeError(e instanceof Error ? e.message : "Stripe session retrieval failed.");
  }
}

/** Verifies a webhook's signature and returns the parsed event — the
 *  same "trust comes from the signature, not the network path" rule
 *  as /api/webhooks/paystack, using Stripe's own HMAC scheme. */
export function constructWebhookEvent(rawBody: string, signature: string): Stripe.Event {
  const secret = process.env.STRIPE_WEBHOOK_SECRET ?? "";
  if (!secret) throw new StripeError("STRIPE_WEBHOOK_SECRET is not configured.");
  return stripe().webhooks.constructEvent(rawBody, signature, secret);
}

export async function cancelSubscription(subscriptionId: string): Promise<void> {
  try {
    await stripe().subscriptions.cancel(subscriptionId);
  } catch (e) {
    throw new StripeError(e instanceof Error ? e.message : "Stripe subscription cancellation failed.");
  }
}
