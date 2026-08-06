import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { constructWebhookEvent, StripeError } from "@/lib/stripe";
import { fulfillOrder } from "@/lib/fulfillment";
import { attachSubscriptionCode, deactivateSubscription, findUserById } from "@/lib/users";
import { requirePersistenceInProd } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * SERVER-TO-SERVER STRIPE WEBHOOK — same reasoning as
 * /api/webhooks/paystack: trust comes from the signature, not the
 * network path, and this closes the gap where crediting a purchase
 * depended entirely on the customer's browser successfully returning
 * to /api/checkout/callback. `fulfillOrder`'s underlying `markPaid` is
 * what keeps this safe to receive the SAME event twice (Stripe retries
 * on anything but a 2xx) — a redelivery is a no-op, not a
 * double-credit.
 */
export async function POST(req: Request) {
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  try {
    requirePersistenceInProd();
  } catch {
    /* 503, not 200 — Stripe retries a non-2xx response. Acking an
       event this app cannot actually persist would silently drop it
       forever instead of giving it a chance to land once the database
       is back. */
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const raw = await req.text();
  const signature = req.headers.get("stripe-signature") ?? "";

  let event: Stripe.Event;
  try {
    event = constructWebhookEvent(raw, signature);
  } catch (e) {
    console.error("[webhooks/stripe] signature verification failed:", e instanceof StripeError ? e.message : e);
    return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const reference = session.client_reference_id;
        if (!reference) break;

        const result = await fulfillOrder(reference);

        /* Same subscription-id capture the browser callback does —
           whichever of the two arrives first attaches it, the other
           is a harmless overwrite of the same value. */
        if (result.done && result.order.kind === "tier" && typeof session.subscription === "string") {
          const user = await findUserById(result.order.userId);
          if (user) {
            await attachSubscriptionCode(user.email, session.subscription, result.order.billingInterval ?? "monthly", "stripe");
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await deactivateSubscription(subscription.id);
        break;
      }

      default:
        /* Unhandled event types are acknowledged, not errored — Stripe
           retries on anything but a 2xx, and a 500 loop here would
           just be noise. */
        break;
    }
  } catch (e) {
    console.error("[webhooks/stripe] handler failed:", e);
    /* Still 200 — the alternative is Stripe retrying an event whose
       failure is almost always a bug on this side, not a transient
       one, so retrying would not help and would spam logs identically
       forever. */
  }

  return NextResponse.json({ received: true });
}
