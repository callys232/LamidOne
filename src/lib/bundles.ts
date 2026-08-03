import { collection, persistenceEnabled, ensureIndexes } from "./store";
import { handoffsFor, type Handoff } from "./intelligence/handoffs";
import { MODULE_REGISTRY } from "./intelligence/moduleRegistry";
import { parseEngineCode, configFor, type EngineResult } from "./engines";

/**
 * BUNDLES — the user's working context, carried between engines.
 *
 * The problem this solves: the engines are individually excellent and
 * collectively amnesiac. A user enters their cost base for F04, then
 * enters the same cost base again for F01, then again for F05. Nothing
 * remembers, so the fifth engine is as expensive to use as the first
 * and most people stop at the second.
 *
 * A bundle is a named container holding:
 *   · `facts`  — reusable inputs the user has entered once. Roles,
 *                periods, metrics, cost lines. Re-offered to any engine
 *                that declares the same input kind.
 *   · `runs`   — every engine result, kept so a later engine can cite
 *                an earlier finding instead of asking again.
 *   · `next`   — what to run next, from the existing `handoffsFor`
 *                chain, filtered to remove anything already run.
 *
 * The design rule: a bundle never *rewrites* an input, only *offers*
 * it. Silently reusing a stale figure would be worse than asking —
 * the whole platform's claim is that numbers are traceable.
 *
 * ⚠️  SEAM — in-memory here. Back with a `Bundle` collection keyed on
 * userId. The shape below is already document-shaped for that.
 */

/** Input kinds that carry between engines. Keyed by the registry's
 *  `inputs.kind`, so a fact captured by one module is offered to every
 *  other module of the same shape. */
export type FactKind = "assessment" | "financial" | "roster" | "scenario" | "timeseries";

export type BundleRun = {
  code: string;
  engineName: string;
  kind: string;
  /** Trimmed result — enough to cite, not the whole payload. */
  headline: string;
  at: number;
};

export type Bundle = {
  id: string;
  userId: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  /** Reusable inputs, by kind. Last value wins, with provenance. */
  facts: Partial<Record<FactKind, { value: unknown; fromCode: string; at: number }>>;
  runs: BundleRun[];
};

/* In-memory fallback for local development with no database. NOT the
   production path: this module used to be memory-only, which meant a
   bundle vanished on cold start and diverged across serverless
   instances - the feature built so the engines are not collectively
   amnesiac was itself amnesiac in production. */
const store = new Map<string, Bundle>();
const byUser = new Map<string, Set<string>>();

const id = () => `b_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

export async function createBundle(userId: string, name: string): Promise<Bundle> {
  const bundle: Bundle = {
    id: id(),
    userId,
    name: name.trim().slice(0, 120) || "Untitled bundle",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    facts: {},
    runs: [],
  };

  if (persistenceEnabled()) {
    await ensureIndexes();
    const col = await collection<Bundle>("bundles");
    if (col) { await col.insertOne(bundle); return bundle; }
  }
  store.set(bundle.id, bundle);
  if (!byUser.has(userId)) byUser.set(userId, new Set());
  byUser.get(userId)!.add(bundle.id);
  return bundle;
}

export async function getBundle(userId: string, bundleId: string): Promise<Bundle | null> {
  /* Ownership is part of the QUERY, not a check after the fact, so no
     caller can forget it and no id-guesser can read another account's
     working context. */
  if (persistenceEnabled()) {
    const col = await collection<Bundle>("bundles");
    if (col) return col.findOne({ id: bundleId, userId });
  }
  const b = store.get(bundleId);
  return b && b.userId === userId ? b : null;
}

export async function listBundles(userId: string): Promise<Bundle[]> {
  if (persistenceEnabled()) {
    const col = await collection<Bundle>("bundles");
    if (col) return col.find({ userId }).sort({ updatedAt: -1 }).limit(100).toArray();
  }
  return [...(byUser.get(userId) ?? [])]
    .map((bid) => store.get(bid))
    .filter((b): b is Bundle => Boolean(b))
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

/** One-line summary of a result, for citation by a later engine. */
function headlineOf(result: EngineResult): string {
  const s = result.summary as Record<string, unknown> | null;
  if (s && typeof s === "object") {
    for (const key of ["adjustedIndexPct", "indexPct", "netExpected", "healthPct", "runway"]) {
      if (typeof s[key] === "number") return `${result.engineName}: ${key} ${Math.round(s[key] as number)}`;
    }
  }
  return `${result.engineName}: computed`;
}

/**
 * Record a run and absorb its inputs as reusable facts.
 * Returns the updated bundle so the caller can hand `next` to the UI.
 */
export async function recordRun(
  userId: string,
  bundleId: string,
  result: EngineResult,
  input: Record<string, unknown>,
): Promise<Bundle | null> {
  const bundle = await getBundle(userId, bundleId);
  if (!bundle) return null;

  bundle.runs.push({
    code: result.code,
    engineName: result.engineName,
    kind: result.kind,
    headline: headlineOf(result),
    at: Date.now(),
  });

  /* Absorb the input under its kind, with provenance so the UI can say
     "reused from Q44" rather than presenting it as fresh. */
  const kind = result.kind as FactKind;
  const reusable: Partial<Record<FactKind, unknown>> = {
    assessment: input.rows,
    financial: input.periods ? input : undefined,
    roster: input.roles,
    scenario: input.options,
    timeseries: input.series ?? (input.metric ? [{ metric: input.metric, values: input.values }] : undefined),
  };

  const value = reusable[kind];
  if (value !== undefined) {
    bundle.facts[kind] = { value, fromCode: result.code, at: Date.now() };
  }

  bundle.updatedAt = Date.now();

  if (persistenceEnabled()) {
    const col = await collection<Bundle>("bundles");
    if (col) {
      await col.updateOne(
        { id: bundleId, userId },
        { $set: { runs: bundle.runs, facts: bundle.facts, updatedAt: bundle.updatedAt } },
      );
    }
  }
  return bundle;
}

/**
 * Inputs this bundle can pre-fill for a given engine.
 * Offers only — the caller decides whether to use them, and the UI must
 * show where each came from.
 */
export function prefillFor(bundle: Bundle, code: string): {
  kind: string;
  available: boolean;
  value?: unknown;
  fromCode?: string;
} {
  const ref = parseEngineCode(code);
  if (!ref) return { kind: "unknown", available: false };

  const kind = ((configFor(ref).inputs as { kind?: string })?.kind ?? "assessment") as FactKind;
  const fact = bundle.facts[kind];

  return fact
    ? { kind, available: true, value: fact.value, fromCode: fact.fromCode }
    : { kind, available: false };
}

/**
 * What to run next. Uses the existing handoff chain and removes
 * anything already run, so the suggestion list shrinks as work is done
 * rather than repeating itself.
 */
export function nextSteps(bundle: Bundle): (Handoff & { name?: string })[] {
  const done = new Set(bundle.runs.map((r) => r.code));
  const last = bundle.runs.at(-1);
  if (!last) return [];

  /* Hand-authored chains first — they carry a written reason, which is
     the part that actually helps someone choose. Only 16 of 225 modules
     have one, so the registry's own `nextHref` covers the rest rather
     than leaving 93% of the catalogue with an empty "what next". */
  const authored = handoffsFor(last.code).filter((h) => !done.has(h.to));
  if (authored.length > 0) return authored.slice(0, 4);

  return registryNext(last.code).filter((h) => !done.has(h.to)).slice(0, 4);
}

/**
 * Fallback chain from the module registry.
 *
 * Every entry declares `nextHref`/`nextLabel` — the sequential walk
 * through its series. Less considered than an authored handoff, so the
 * reason is phrased as sequence rather than as insight. Overstating why
 * one engine follows another would be worse than admitting it is simply
 * the next one in the series.
 */
function registryNext(code: string): (Handoff & { name?: string })[] {
  const cfg = MODULE_REGISTRY[code] as
    | { nextHref?: string; nextLabel?: string }
    | undefined;
  if (!cfg?.nextHref) return [];

  const to = /^\/([a-z]\d{2})/i.exec(cfg.nextHref)?.[1]?.toUpperCase() ?? "";
  const target = to ? MODULE_REGISTRY[to] : undefined;

  return [{
    to,
    href: cfg.nextHref,
    reason: target
      ? `Next in this series — ${target.engineName}.`
      : cfg.nextLabel ?? "Continue through this series.",
    name: target?.engineName,
  }];
}

/** Everything the UI needs for one bundle, in one read. */
export async function bundleView(userId: string, bundleId: string) {
  const bundle = await getBundle(userId, bundleId);
  if (!bundle) return null;
  return {
    ...bundle,
    next: nextSteps(bundle),
    reusableFacts: Object.entries(bundle.facts).map(([kind, f]) => ({
      kind,
      fromCode: f.fromCode,
      capturedAt: f.at,
    })),
  };
}
