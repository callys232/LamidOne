import { collection, persistenceEnabled, ensureIndexes } from "./store";
import type { TierId } from "@/content/tiers";

/**
 * CHECKOUT ORDERS.
 *
 * The record that makes payment idempotent. `verifyTransaction` can be
 * called more than once for the same reference (a user refreshing the
 * callback page, a retried webhook) — without a stored order tracking
 * "pending" → "paid", a second verify would credit the points twice.
 * `markPaid` only ever transitions a genuinely-pending order once.
 */

export type CheckoutOrder = {
  reference: string;
  userId: string;
  kind: "points" | "tier";
  points?: number;
  tier?: TierId;
  /** Set only for `kind: "tier"` orders started against a Paystack
   *  Plan (see lib/subscriptionPlans.ts) — tells the fulfiller which
   *  cadence to record once Paystack confirms the subscription. */
  billingInterval?: "monthly" | "annually";
  usd: number;
  status: "pending" | "paid" | "failed";
  createdAt: number;
  paidAt?: number;
};

const orders = new Map<string, CheckoutOrder>();

export async function createOrder(order: Omit<CheckoutOrder, "status" | "createdAt">): Promise<CheckoutOrder> {
  const full: CheckoutOrder = { ...order, status: "pending", createdAt: Date.now() };
  if (persistenceEnabled()) {
    await ensureIndexes();
    const col = await collection<CheckoutOrder>("checkoutOrders");
    if (col) { await col.insertOne(full); return full; }
  }
  orders.set(full.reference, full);
  return full;
}

export async function getOrder(reference: string): Promise<CheckoutOrder | null> {
  if (persistenceEnabled()) {
    const col = await collection<CheckoutOrder>("checkoutOrders");
    if (col) return col.findOne({ reference });
  }
  return orders.get(reference) ?? null;
}

/** Idempotent: returns the order once, freshly marked paid, on the
 *  FIRST call for a pending reference; returns null on every call
 *  after that (already paid) or if the reference is unknown — the
 *  caller uses null to mean "do not credit anything twice." */
export async function markPaid(reference: string): Promise<CheckoutOrder | null> {
  if (persistenceEnabled()) {
    const col = await collection<CheckoutOrder>("checkoutOrders");
    if (col) {
      const updated = await col.findOneAndUpdate(
        { reference, status: "pending" },
        { $set: { status: "paid", paidAt: Date.now() } },
        { returnDocument: "after" },
      );
      return updated ?? null;
    }
  }
  const order = orders.get(reference);
  if (!order || order.status !== "pending") return null;
  order.status = "paid";
  order.paidAt = Date.now();
  return order;
}
