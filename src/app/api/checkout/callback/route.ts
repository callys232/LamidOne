import { NextResponse } from "next/server";
import { verifyTransaction, PaystackError } from "@/lib/paystack";
import { retrieveCheckoutSession, StripeError } from "@/lib/stripe";
import { getOrder } from "@/lib/checkout";
import { fulfillOrder } from "@/lib/fulfillment";
import { attachSubscriptionCode, findUserById } from "@/lib/users";
import { requirePersistenceInProd } from "@/lib/store";
import { env } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Where the customer is sent back after a checkout attempt, on either
 * rail. The order of operations matters: verify with the provider's
 * own API (never trust the redirect's query string alone — anyone can
 * craft a URL that LOOKS like a successful callback), then mark the
 * order paid atomically (fails closed on a second call for the same
 * reference), THEN credit. If verification fails or the order was
 * already processed, nothing is credited twice.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const reference = url.searchParams.get("reference") ?? url.searchParams.get("trxref") ?? "";
  const isStripe = url.searchParams.get("provider") === "stripe";
  const sessionId = url.searchParams.get("session_id") ?? "";
  const base = env.siteUrl;

  try {
    requirePersistenceInProd();
  } catch {
    return NextResponse.redirect(`${base}/dashboard/wallet?purchase=not_configured`);
  }

  if (!reference) return NextResponse.redirect(`${base}/dashboard/wallet?purchase=missing_reference`);

  const order = await getOrder(reference);
  if (!order) return NextResponse.redirect(`${base}/dashboard/wallet?purchase=unknown`);

  const failTarget = order.kind === "tier" ? "/dashboard/billing" : "/dashboard/wallet";
  let stripeSubscriptionId: string | null = null;

  if (isStripe) {
    if (!sessionId) return NextResponse.redirect(`${base}${failTarget}?purchase=missing_reference`);
    try {
      const session = await retrieveCheckoutSession(sessionId);
      if (!session.paid) return NextResponse.redirect(`${base}${failTarget}?purchase=failed`);
      stripeSubscriptionId = session.subscriptionId;
    } catch (e) {
      console.error("[checkout] stripe verify failed:", e instanceof StripeError ? e.message : e);
      return NextResponse.redirect(`${base}${failTarget}?purchase=failed`);
    }
  } else {
    try {
      const tx = await verifyTransaction(reference);
      if (tx.status !== "success") {
        return NextResponse.redirect(`${base}${failTarget}?purchase=failed`);
      }
    } catch (e) {
      console.error("[checkout] verify failed:", e instanceof PaystackError ? e.message : e);
      return NextResponse.redirect(`${base}${failTarget}?purchase=failed`);
    }
  }

  /* The webhook (api/webhooks/paystack or api/webhooks/stripe) may
     have already fulfilled this exact order in the time it took the
     browser to redirect back here — `fulfillOrder`'s underlying
     `markPaid` is the single atomic gate that makes that race
     harmless either way. */
  const result = await fulfillOrder(reference);
  if (!result.done) {
    return NextResponse.redirect(`${base}${failTarget}?purchase=${result.reason}`);
  }

  if (result.order.kind === "points" && result.order.points) {
    return NextResponse.redirect(`${base}/dashboard/wallet?purchase=success&points=${result.order.points}`);
  }
  if (result.order.kind === "tier" && result.order.tier) {
    if (stripeSubscriptionId) {
      const user = await findUserById(result.order.userId);
      if (user) {
        await attachSubscriptionCode(user.email, stripeSubscriptionId, result.order.billingInterval ?? "monthly", "stripe");
      }
    }
    return NextResponse.redirect(`${base}/dashboard/billing?purchase=success&tier=${result.order.tier}`);
  }
  return NextResponse.redirect(`${base}/dashboard/wallet?purchase=success`);
}
