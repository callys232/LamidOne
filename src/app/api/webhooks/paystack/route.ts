import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { fulfillOrder } from "@/lib/fulfillment";
import { attachSubscriptionCode, deactivateSubscription } from "@/lib/users";
import { requirePersistenceInProd } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * SERVER-TO-SERVER PAYSTACK WEBHOOK.
 *
 * Before this route existed, crediting a purchase depended entirely
 * on the customer's browser successfully returning to
 * /api/checkout/callback — a closed tab, a network drop, or a
 * bank-transfer payment that settles after the redirect already fired
 * meant Paystack had the money and this app credited nothing, with no
 * automated way to notice or recover. This is Paystack calling IN,
 * independent of what the customer's browser does, so a payment gets
 * fulfilled even if they never come back.
 *
 * Trust comes from the signature, not from the network path — this
 * endpoint is public by necessity (Paystack's servers call it, not a
 * logged-in browser), so every request is verified against
 * PAYSTACK_SECRET_KEY before anything in the body is trusted.
 * `fulfillOrder`'s underlying `markPaid` is what keeps this route safe
 * to receive the SAME event twice (Paystack retries on anything but a
 * 200) — a redelivery is a no-op, not a double-credit.
 */
export async function POST(req: Request) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) return NextResponse.json({ error: "not_configured" }, { status: 503 });

  try {
    requirePersistenceInProd();
  } catch {
    /* 503, not 200 — Paystack retries a non-2xx response. Acking a
       payment event this app cannot actually persist would silently
       drop it forever instead of giving it a chance to land once the
       database is back. */
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const raw = await req.text();
  const signature = req.headers.get("x-paystack-signature") ?? "";
  const expected = createHmac("sha512", secretKey).update(raw).digest("hex");

  const sigBuf = Buffer.from(signature, "utf8");
  const expBuf = Buffer.from(expected, "utf8");
  const valid = sigBuf.length === expBuf.length && timingSafeEqual(sigBuf, expBuf);
  if (!valid) return NextResponse.json({ error: "invalid_signature" }, { status: 401 });

  let event: { event?: string; data?: Record<string, unknown> } | null = null;
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }

  const data = event?.data ?? {};

  try {
    switch (event?.event) {
      case "charge.success": {
        const reference = String(data.reference ?? "");
        if (reference) await fulfillOrder(reference);
        break;
      }

      case "subscription.create": {
        /* Fired a beat after `charge.success` for the FIRST payment on
           a plan-based transaction — this is where Paystack actually
           hands back the subscription_code needed to cancel it later.
           Not present on the transaction-verify response itself, so
           it cannot be captured any earlier than this. */
        const customer = data.customer as { email?: string } | undefined;
        const plan = data.plan as { interval?: string } | undefined;
        const code = String(data.subscription_code ?? "");
        const email = customer?.email;
        const interval = plan?.interval === "annually" ? "annually" : "monthly";
        if (code && email) await attachSubscriptionCode(email, code, interval);
        break;
      }

      case "subscription.disable":
      case "subscription.not_renew": {
        const code = String(data.subscription_code ?? "");
        if (code) await deactivateSubscription(code);
        break;
      }

      default:
        /* Unhandled event types (e.g. invoice.payment_failed) are
           acknowledged, not errored — Paystack retries on anything but
           a 200, and a 500 loop here would just be noise. */
        break;
    }
  } catch (e) {
    console.error("[webhooks/paystack] handler failed:", e);
    /* Still 200 — the alternative is Paystack retrying an event whose
       failure is almost always a bug on this side, not a transient
       one, so retrying would not help and would spam logs identically
       forever. */
  }

  return NextResponse.json({ received: true });
}
