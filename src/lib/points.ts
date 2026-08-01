import { AGENTS } from "@/content/agents";
import type { Identity } from "./entitlements";

/**
 * THE POINTS LEDGER.
 *
 * The whole pricing promise is "you pay when the work gets done", so
 * the ledger is built around a two-phase commit rather than a simple
 * debit:
 *
 *   reserve(...)  → holds the cost, checks the balance, returns a token
 *   settle(token) → converts the hold into a charge (outcome delivered)
 *   release(token) → returns the hold untouched (run failed)
 *
 * A single-phase debit cannot honour "a failed run costs nothing"
 * without refunds, and refunds are where meters lose people's trust.
 * Holding first also prevents a user starting ten concurrent expensive
 * runs against a balance that only covers one.
 *
 * The functions below (`reserve`/`settle`/`release`/`credit`/`history`)
 * are the in-memory implementation, used automatically whenever
 * MONGODB_URI is unset — local dev needs no database. The `*Async`
 * variants further down are the persisted path: MongoDB-backed with a
 * single atomic `findOneAndUpdate` per reservation (see the comment
 * there for why that matters), used in production. `withMeter` always
 * calls the async path, which transparently falls back to these when
 * persistence isn't configured — so callers never choose between them.
 */

export type Hold = {
  id: string;
  userId: string;
  points: number;
  agentId: string;
  createdAt: number;
};

export type Balance = {
  /** Granted on signup and by monthly allowance. Does not roll over. */
  allowance: number;
  /** Bought outright. Never expires. Spent only after allowance. */
  purchased: number;
  /** Currently held against in-flight runs. */
  held: number;
};

export type LedgerEntry = {
  userId: string;
  delta: number;
  reason: string;
  agentId?: string;
  at: number;
};

/* ── In-memory store (development) ────────────────────────── */
const balances = new Map<string, Balance>();
const holds = new Map<string, Hold>();
const ledger: LedgerEntry[] = [];

/** Holds expire so a crashed run cannot strand a balance forever. */
const HOLD_TTL_MS = 10 * 60 * 1000;

function sweepExpiredHolds() {
  const now = Date.now();
  for (const [id, h] of holds) {
    if (now - h.createdAt > HOLD_TTL_MS) {
      const b = balances.get(h.userId);
      if (b) b.held = Math.max(0, b.held - h.points);
      holds.delete(id);
      ledger.push({ userId: h.userId, delta: 0, reason: "hold_expired", agentId: h.agentId, at: now });
    }
  }
}

export function getBalance(userId: string): Balance {
  sweepExpiredHolds();
  return balances.get(userId) ?? { allowance: 0, purchased: 0, held: 0 };
}

export const available = (b: Balance) => b.allowance + b.purchased - b.held;

export function credit(userId: string, points: number, kind: "allowance" | "purchased", reason: string) {
  const b = getBalance(userId);
  const next: Balance = { ...b, [kind]: b[kind] + points };
  balances.set(userId, next);
  ledger.push({ userId, delta: points, reason, at: Date.now() });
  return next;
}

export type ReserveResult =
  | { ok: true; hold: Hold; balance: Balance }
  | { ok: false; code: "insufficient"; shortfall: number; balance: Balance };

export function reserve(userId: string, agentId: string, costOverride?: number): ReserveResult {
  const cost = costOverride ?? AGENTS.find((a) => a.id === agentId)?.points ?? 0;
  const b = getBalance(userId);

  if (available(b) < cost) {
    return { ok: false, code: "insufficient", shortfall: cost - available(b), balance: b };
  }

  const hold: Hold = {
    id: `h_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    userId,
    points: cost,
    agentId,
    createdAt: Date.now(),
  };

  const next: Balance = { ...b, held: b.held + cost };
  balances.set(userId, next);
  holds.set(hold.id, hold);

  return { ok: true, hold, balance: next };
}

/** Outcome delivered. Convert the hold into a real charge. */
export function settle(holdId: string, reason = "agent_outcome"): Balance | null {
  const h = holds.get(holdId);
  if (!h) return null;

  const b = getBalance(h.userId);
  /* Allowance is spent before purchased points, so the balance that
     never expires is the one that survives. */
  const fromAllowance = Math.min(b.allowance, h.points);
  const fromPurchased = h.points - fromAllowance;

  const next: Balance = {
    allowance: b.allowance - fromAllowance,
    purchased: b.purchased - fromPurchased,
    held: Math.max(0, b.held - h.points),
  };

  balances.set(h.userId, next);
  holds.delete(holdId);
  ledger.push({ userId: h.userId, delta: -h.points, reason, agentId: h.agentId, at: Date.now() });
  return next;
}

/** Run failed. The customer is not charged — this is the promise. */
export function release(holdId: string): Balance | null {
  const h = holds.get(holdId);
  if (!h) return null;

  const b = getBalance(h.userId);
  const next: Balance = { ...b, held: Math.max(0, b.held - h.points) };
  balances.set(h.userId, next);
  holds.delete(holdId);
  ledger.push({ userId: h.userId, delta: 0, reason: "run_failed_not_charged", agentId: h.agentId, at: Date.now() });
  return next;
}

export function history(userId: string, take = 50): LedgerEntry[] {
  return ledger.filter((e) => e.userId === userId).slice(-take).reverse();
}

/**
 * Runs `work`, charging only if it resolves. Any throw releases the
 * hold, so "a failed run costs nothing" is enforced by control flow
 * rather than by remembering to refund.
 */
export async function withMeter<T>(
  identity: Identity,
  agentId: string,
  work: () => Promise<T>,
): Promise<{ result: T; charged: number; balance: Balance }> {
  if (!identity.userId) throw new Error("metered work requires an identity");

  const r = await reserveAsync(identity.userId, agentId);
  if (!r.ok) {
    const err = new Error("insufficient_points") as Error & { shortfall: number };
    err.shortfall = r.shortfall;
    throw err;
  }

  try {
    const result = await work();
    const balance = (await settleAsync(r.hold.id)) ?? getBalance(identity.userId);
    return { result, charged: r.hold.points, balance };
  } catch (e) {
    await releaseAsync(r.hold.id);
    throw e;
  }
}

/* ───────────────────────────────────────────────────────────────
   PERSISTENT PATH
   Used whenever MONGODB_URI is set; otherwise these delegate to the
   in-memory functions above so local development needs no database.

   The reservation is a SINGLE conditional update rather than a
   read-then-write. Two concurrent runs against one balance would both
   pass a read-then-check and both reserve — the classic double-spend.
   `findOneAndUpdate` with the balance condition in the filter makes
   the check and the decrement one atomic operation, so the second
   request finds no matching document and is refused.
   ─────────────────────────────────────────────────────────────── */

type BalanceDoc = { userId: string; allowance: number; purchased: number; held: number };
type HoldDoc = Hold & { settled?: boolean };

/**
 * Meter an arbitrary priced action.
 *
 * Agent runs price by agent id; marketplace actions (post a project,
 * place a bid, boost a bid) price by their own published cost. Passing
 * an explicit cost keeps the check and the charge the same number —
 * the earlier version gated on 50 and billed 30 because the gate read
 * the action cost and the meter read an agent's cost.
 */
export async function withMeterCost<T>(
  identity: Identity,
  cost: number,
  reason: string,
  work: () => Promise<T>,
): Promise<{ result: T; charged: number; balance: Balance }> {
  if (!identity.userId) throw new Error("metered work requires an identity");

  const r = await reserveAsync(identity.userId, "", cost);
  if (!r.ok) {
    const err = new Error("insufficient_points") as Error & { shortfall: number };
    err.shortfall = r.shortfall;
    throw err;
  }

  try {
    const result = await work();
    const balance = (await settleAsync(r.hold.id, reason)) ?? (await getBalanceAsync(identity.userId));
    return { result, charged: cost, balance };
  } catch (e) {
    await releaseAsync(r.hold.id);
    throw e;
  }
}

export async function reserveAsync(
  userId: string,
  agentId: string,
  costOverride?: number,
): Promise<ReserveResult> {
  const { collection, ensureIndexes, persistenceEnabled } = await import("./store");
  if (!persistenceEnabled()) return reserve(userId, agentId, costOverride);

  await ensureIndexes();
  const balances = await collection<BalanceDoc>("balances");
  const holdsCol = await collection<HoldDoc>("holds");
  if (!balances || !holdsCol) return reserve(userId, agentId, costOverride);

  const cost = costOverride ?? AGENTS.find((a) => a.id === agentId)?.points ?? 0;

  await balances.updateOne(
    { userId },
    { $setOnInsert: { userId, allowance: 0, purchased: 0, held: 0 } },
    { upsert: true },
  );

  /* Atomic: only matches if the free balance still covers the cost. */
  const updated = await balances.findOneAndUpdate(
    { userId, $expr: { $gte: [{ $subtract: [{ $add: ["$allowance", "$purchased"] }, "$held"] }, cost] } },
    { $inc: { held: cost } },
    { returnDocument: "after" },
  );

  if (!updated) {
    const current = (await balances.findOne({ userId })) ?? { allowance: 0, purchased: 0, held: 0 };
    const bal = { allowance: current.allowance, purchased: current.purchased, held: current.held };
    return { ok: false, code: "insufficient", shortfall: cost - available(bal), balance: bal };
  }

  const hold: Hold = {
    id: `h_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    userId, points: cost, agentId, createdAt: Date.now(),
  };
  await holdsCol.insertOne({ ...hold, createdAt: new Date() as never });

  return {
    ok: true,
    hold,
    balance: { allowance: updated.allowance, purchased: updated.purchased, held: updated.held },
  };
}

export async function settleAsync(holdId: string, reason = "agent_outcome"): Promise<Balance | null> {
  const { collection, persistenceEnabled } = await import("./store");
  if (!persistenceEnabled()) return settle(holdId, reason);

  const balances = await collection<BalanceDoc>("balances");
  const holdsCol = await collection<HoldDoc>("holds");
  const ledgerCol = await collection<LedgerEntry>("ledger");
  if (!balances || !holdsCol) return settle(holdId);

  /* Claim the hold first. If it is already gone, another request
     settled or released it and this is a duplicate — do nothing rather
     than charge twice. */
  const claimed = await holdsCol.findOneAndDelete({ id: holdId });
  if (!claimed) return null;

  const current = await balances.findOne({ userId: claimed.userId });
  if (!current) return null;

  /* Allowance is spent before purchased, so the balance that never
     expires is the one that survives. */
  const fromAllowance = Math.min(current.allowance, claimed.points);
  const fromPurchased = claimed.points - fromAllowance;

  const after = await balances.findOneAndUpdate(
    { userId: claimed.userId },
    { $inc: { allowance: -fromAllowance, purchased: -fromPurchased, held: -claimed.points } },
    { returnDocument: "after" },
  );

  await ledgerCol?.insertOne({
    userId: claimed.userId, delta: -claimed.points,
    reason, agentId: claimed.agentId, at: Date.now(),
  });

  return after
    ? { allowance: after.allowance, purchased: after.purchased, held: Math.max(0, after.held) }
    : null;
}

export async function releaseAsync(holdId: string): Promise<Balance | null> {
  const { collection, persistenceEnabled } = await import("./store");
  if (!persistenceEnabled()) return release(holdId);

  const balances = await collection<BalanceDoc>("balances");
  const holdsCol = await collection<HoldDoc>("holds");
  const ledgerCol = await collection<LedgerEntry>("ledger");
  if (!balances || !holdsCol) return release(holdId);

  const claimed = await holdsCol.findOneAndDelete({ id: holdId });
  if (!claimed) return null;

  const after = await balances.findOneAndUpdate(
    { userId: claimed.userId },
    { $inc: { held: -claimed.points } },
    { returnDocument: "after" },
  );

  /* Recorded with delta 0 — the run happened and cost nothing. The
     evidence matters: it is what makes the promise auditable. */
  await ledgerCol?.insertOne({
    userId: claimed.userId, delta: 0,
    reason: "run_failed_not_charged", agentId: claimed.agentId, at: Date.now(),
  });

  return after
    ? { allowance: after.allowance, purchased: after.purchased, held: Math.max(0, after.held) }
    : null;
}

export async function getBalanceAsync(userId: string): Promise<Balance> {
  const { collection, persistenceEnabled } = await import("./store");
  if (!persistenceEnabled()) return getBalance(userId);

  const balances = await collection<BalanceDoc>("balances");
  const doc = await balances?.findOne({ userId });
  return doc
    ? { allowance: doc.allowance, purchased: doc.purchased, held: doc.held }
    : { allowance: 0, purchased: 0, held: 0 };
}

export async function creditAsync(
  userId: string, points: number, kind: "allowance" | "purchased", reason: string,
): Promise<Balance> {
  const { collection, persistenceEnabled } = await import("./store");
  if (!persistenceEnabled()) return credit(userId, points, kind, reason);

  const balances = await collection<BalanceDoc>("balances");
  const ledgerCol = await collection<LedgerEntry>("ledger");
  if (!balances) return credit(userId, points, kind, reason);

  const after = await balances.findOneAndUpdate(
    { userId },
    { $inc: { [kind]: points }, $setOnInsert: { userId, held: 0 } },
    { upsert: true, returnDocument: "after" },
  );

  await ledgerCol?.insertOne({ userId, delta: points, reason, at: Date.now() });

  return after
    ? { allowance: after.allowance, purchased: after.purchased, held: after.held }
    : { allowance: 0, purchased: 0, held: 0 };
}

export async function historyAsync(userId: string, take = 50): Promise<LedgerEntry[]> {
  const { collection, persistenceEnabled } = await import("./store");
  if (!persistenceEnabled()) return history(userId, take);

  const ledgerCol = await collection<LedgerEntry>("ledger");
  if (!ledgerCol) return history(userId, take);

  return ledgerCol.find({ userId }).sort({ at: -1 }).limit(take).toArray();
}
