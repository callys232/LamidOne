import { collection, persistenceEnabled } from "./store";
import { createPlan } from "./paystack";
import type { Tier, TierId } from "@/content/tiers";

/**
 * Caches the Paystack Plan created for each (tier, interval)
 * combination — a Plan only needs to exist once; every subsequent
 * checkout for "Growth, monthly" reuses the same `plan_code` rather
 * than minting a duplicate Plan on Paystack's side every time someone
 * upgrades. Falls back to an in-memory cache when Mongo isn't
 * configured, same as every other store in this app.
 */

type PlanDoc = { key: string; planCode: string; createdAt: number };

const cache = new Map<string, string>();
const key = (tier: TierId, interval: "monthly" | "annually") => `${tier}_${interval}`;

export async function getOrCreatePlanCode(tier: Tier, interval: "monthly" | "annually"): Promise<string> {
  const amount = interval === "monthly" ? tier.price.monthly : tier.price.annual;
  if (!amount) throw new Error(`${tier.id} has no ${interval} price to create a plan against.`);

  const k = key(tier.id, interval);

  if (persistenceEnabled()) {
    const col = await collection<PlanDoc>("paystackPlans");
    if (col) {
      const existing = await col.findOne({ key: k });
      if (existing) return existing.planCode;

      const plan = await createPlan({
        name: `LAMID ONE — ${tier.name} (${interval})`,
        amountMajorUnit: amount,
        interval,
      });

      /* `key` is unique-indexed (store.ts) — if two requests race to
         create the same plan, the loser's insert fails and it falls
         back to reading what the winner just wrote, rather than
         leaving two Plans live on Paystack for the same tier. */
      try {
        await col.insertOne({ key: k, planCode: plan.plan_code, createdAt: Date.now() });
        return plan.plan_code;
      } catch {
        const winner = await col.findOne({ key: k });
        return winner?.planCode ?? plan.plan_code;
      }
    }
  }

  const cached = cache.get(k);
  if (cached) return cached;
  const plan = await createPlan({
    name: `LAMID ONE — ${tier.name} (${interval})`,
    amountMajorUnit: amount,
    interval,
  });
  cache.set(k, plan.plan_code);
  return plan.plan_code;
}
