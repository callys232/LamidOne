import { getOrder, markPaid, type CheckoutOrder } from "./checkout";
import { creditAsync } from "./points";
import { activateTier } from "./users";
import type { TierId } from "@/content/tiers";

/**
 * The one place a paid order actually turns into points or an active
 * tier. Called from BOTH the browser redirect callback (after its own
 * `verifyTransaction` call — see api/checkout/callback) and the signed
 * server-to-server webhook (api/webhooks/paystack, after signature
 * verification) — whichever arrives first does the crediting via
 * `markPaid`'s atomic pending→paid guard, and the other is a safe
 * no-op. This closes the gap where crediting depended ONLY on the
 * customer's browser successfully returning to the callback URL: a
 * closed tab, a network drop, or a bank-transfer settlement that
 * completes after redirect used to mean Paystack had the money and
 * this app credited nothing.
 */
export type FulfillResult =
  | { done: true; order: CheckoutOrder }
  | { done: false; reason: "unknown_order" | "already_processed" };

export async function fulfillOrder(reference: string): Promise<FulfillResult> {
  const existing = await getOrder(reference);
  if (!existing) return { done: false, reason: "unknown_order" };

  const paid = await markPaid(reference);
  if (!paid) return { done: false, reason: "already_processed" };

  if (paid.kind === "points" && paid.points) {
    await creditAsync(paid.userId, paid.points, "purchased", `points purchase ${reference}`);
  } else if (paid.kind === "tier" && paid.tier) {
    await activateTier(paid.userId, paid.tier as TierId);
  }

  return { done: true, order: paid };
}
