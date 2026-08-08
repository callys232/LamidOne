import { collection, persistenceEnabled, ensureIndexes } from "./store";
import type { EngineResult } from "./engines";

/**
 * ENGINE RUNS — the record a diagnostic leaves behind.
 *
 * Before this, a result existed only in React state on the page that
 * produced it. Refresh the tab and it was gone. That made three shipped
 * claims untrue at once:
 *
 *   · "Re-runnable — the second diagnostic is a comparison, not a
 *     restart" (use-cases/diagnose) — there was nothing to compare to.
 *   · "Models export to CSV on every tier" (solutions.ts) — true only
 *     of the budget calculator.
 *   · "export everything held about you at any time, in CSV"
 *     (legal.ts, the privacy policy) — there was no such route, and a
 *     portability promise in a privacy policy is not a marketing
 *     overclaim, it is a regulatory one.
 *
 * Bundles already persisted runs, but only a TRIMMED `headline` and
 * only when the caller supplied a bundleId — which the public runner
 * never does. This stores the full result for every authenticated run,
 * bundled or not, which is what the three claims above actually need.
 *
 * RETENTION. Runs are capped per user per module (see MAX_PER_MODULE):
 * comparison needs the previous run, not the previous hundred, and an
 * uncapped write path on a free tier is an unbounded storage liability.
 * The cap is applied on write so it cannot drift from what is read.
 */

export type StoredRun = {
  id: string;
  userId: string;
  /** Uppercase module code — Q44, G03. */
  code: string;
  engineName: string;
  kind: string;
  /** The engine's own summary shape, untouched. */
  summary: unknown;
  /** The arithmetic in prose, as the engine rendered it. */
  working: string;
  warnings: string[];
  /** What the user entered. Needed to make a re-run a re-run. */
  input: unknown;
  at: number;
};

/** Kept per user per module. Enough for "compare with last time". */
const MAX_PER_MODULE = 10;

/* In-memory fallback for local development with no database — the same
   pattern as bundles.ts. Not the production path. */
const memory = new Map<string, StoredRun[]>();
const memKey = (userId: string, code: string) => `${userId}::${code}`;

const newId = () => `r_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

/**
 * The user's most recent stored run of this module.
 *
 * Named for what it returns, not for how one caller uses it: the run
 * route calls this BEFORE recording, where "latest" is the previous
 * run and is what a comparison needs. Calling it after recording
 * returns the run you just made — which is correct for export, and
 * would be a run compared against itself for anything else.
 */
export async function latestRun(userId: string, code: string): Promise<StoredRun | null> {
  const key = code.toUpperCase();

  if (persistenceEnabled()) {
    await ensureIndexes();
    const col = await collection<StoredRun>("engineRuns");
    if (col) {
      return await col.findOne({ userId, code: key }, { sort: { at: -1 } });
    }
  }

  const list = memory.get(memKey(userId, key)) ?? [];
  return list[0] ?? null;
}

export async function recordEngineRun(
  userId: string,
  result: EngineResult,
  input: unknown,
): Promise<StoredRun> {
  const code = result.code.toUpperCase();
  const run: StoredRun = {
    id: newId(),
    userId,
    code,
    engineName: result.engineName,
    kind: result.kind,
    summary: result.summary,
    working: String(result.working ?? ""),
    warnings: result.warnings ?? [],
    input,
    at: Date.now(),
  };

  if (persistenceEnabled()) {
    await ensureIndexes();
    const col = await collection<StoredRun>("engineRuns");
    if (col) {
      await col.insertOne(run as never);
      /* Trim on write. Reading the cap instead would let the collection
         grow without limit and only hide it from the UI. */
      const stale = await col
        .find({ userId, code }, { sort: { at: -1 }, skip: MAX_PER_MODULE, projection: { id: 1 } })
        .toArray();
      if (stale.length) {
        await col.deleteMany({ id: { $in: stale.map((s) => s.id) } });
      }
      return run;
    }
  }

  const key = memKey(userId, code);
  const list = [run, ...(memory.get(key) ?? [])].slice(0, MAX_PER_MODULE);
  memory.set(key, list);
  return run;
}

/**
 * Every run this user has, newest first — the engine half of the data
 * portability export. Capped so a single request cannot be made to
 * assemble an unbounded document.
 */
export async function allRunsFor(userId: string, take = 500): Promise<StoredRun[]> {
  if (persistenceEnabled()) {
    await ensureIndexes();
    const col = await collection<StoredRun>("engineRuns");
    if (col) {
      return await col.find({ userId }, { sort: { at: -1 }, limit: take }).toArray();
    }
  }

  const out: StoredRun[] = [];
  for (const [k, list] of memory) if (k.startsWith(`${userId}::`)) out.push(...list);
  return out.sort((a, b) => b.at - a.at).slice(0, take);
}

/** Right to erasure. Returns how many were removed. */
export async function deleteRunsFor(userId: string): Promise<number> {
  if (persistenceEnabled()) {
    await ensureIndexes();
    const col = await collection<StoredRun>("engineRuns");
    if (col) {
      const res = await col.deleteMany({ userId });
      return res.deletedCount ?? 0;
    }
  }

  let n = 0;
  for (const [k, list] of [...memory]) {
    if (k.startsWith(`${userId}::`)) { n += list.length; memory.delete(k); }
  }
  return n;
}
