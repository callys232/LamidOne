import { NextResponse } from "next/server";
import { verifyTransaction, PaystackError } from "@/lib/paystack";
import { getOrder, markPaid } from "@/lib/checkout";
import { creditAsync } from "@/lib/points";
import { activateTier } from "@/lib/users";
import { env } from "@/lib/env";
import type { TierId } from "@/content/tiers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Where Paystack sends the customer back after a checkout attempt.
 * The order of operations matters: verify with Paystack's own API
 * (never trust the redirect's query string alone — anyone can craft
 * a URL that LOOKS like a successful callback), then mark the order
 * paid atomically (fails closed on a second call for the same
 * reference), THEN credit. If verification fails or the order was
 * already processed, nothing is credited twice.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const reference = url.searchParams.get("reference") ?? url.searchParams.get("trxref") ?? "";
  const base = env.siteUrl;

  if (!reference) return NextResponse.redirect(`${base}/dashboard/wallet?purchase=missing_reference`);

  const order = await getOrder(reference);
  if (!order) return NextResponse.redirect(`${base}/dashboard/wallet?purchase=unknown`);

  const failTarget = order.kind === "tier" ? "/dashboard/billing" : "/dashboard/wallet";

  try {
    const tx = await verifyTransaction(reference);
    if (tx.status !== "success") {
      return NextResponse.redirect(`${base}${failTarget}?purchase=failed`);
    }
  } catch (e) {
    console.error("[checkout] verify failed:", e instanceof PaystackError ? e.message : e);
    return NextResponse.redirect(`${base}${failTarget}?purchase=failed`);
  }

  const paid = await markPaid(reference);
  if (!paid) {
    /* Already processed (a refreshed callback page) or the order was
       never pending — either way, crediting again would be a bug, so
       this still reads as success to the customer without repeating
       the credit. */
    return NextResponse.redirect(`${base}${failTarget}?purchase=already_processed`);
  }

  if (paid.kind === "points" && paid.points) {
    await creditAsync(paid.userId, paid.points, "purchased", `points purchase ${reference}`);
    return NextResponse.redirect(`${base}/dashboard/wallet?purchase=success&points=${paid.points}`);
  }

  if (paid.kind === "tier" && paid.tier) {
    await activateTier(paid.userId, paid.tier as TierId);
    return NextResponse.redirect(`${base}/dashboard/billing?purchase=success&tier=${paid.tier}`);
  }

  return NextResponse.redirect(`${base}/dashboard/wallet?purchase=success`);
}
