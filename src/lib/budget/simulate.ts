import type { LineItem, ThreePoint, SimulationResult, SCurvePoint } from "./types";
import { threePointFor } from "./estimate";

/**
 * PROBABILISTIC COST RISK — Monte Carlo simulation.
 *
 * Replaces "pick 10% contingency because that sounds prudent" with a
 * contingency sized from the project's own risk profile: assign each
 * line a range, simulate thousands of whole-project outcomes, and read
 * the contingency off the resulting S-curve at the confidence level you
 * intend to budget at. P80 is the industry standard for a control
 * budget; P50 is an aggressive target you should expect to breach half
 * the time; P90 is for regulated or high-consequence work.
 *
 * TWO DESIGN DECISIONS THAT MATTER
 *
 * 1. SEEDED, THEREFORE DETERMINISTIC. Same inputs and seed always
 *    produce the same S-curve. A budget that returns a different number
 *    each time you open it cannot be reviewed, defended in a meeting,
 *    or reproduced in an audit — which would break the platform's whole
 *    "show the arithmetic" promise. `Math.random()` appears nowhere here.
 *
 * 2. CORRELATED, NOT INDEPENDENT. Sampling every line independently is
 *    the most common and most dangerous error in cost simulation: the
 *    central limit theorem cancels the risks against each other and the
 *    distribution collapses to something reassuringly narrow. Real cost
 *    overruns move TOGETHER — labour rates rise across every labour
 *    line at once, a schedule slip inflates every time-based cost
 *    simultaneously. This uses a Gaussian copula with a single common
 *    factor so a correlation of ρ genuinely widens the tail instead of
 *    quietly deleting it.
 */

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

/* ── Deterministic PRNG ───────────────────────────────────────
   mulberry32: small, fast, well-distributed, and fully reproducible
   from a 32-bit seed. Cryptographic quality is irrelevant here;
   reproducibility is the entire requirement. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Box–Muller. Returns one standard normal per call, caching the pair. */
function normalSampler(rand: () => number): () => number {
  let spare: number | null = null;
  return () => {
    if (spare !== null) { const s = spare; spare = null; return s; }
    let u = 0, v = 0, s = 0;
    do {
      u = rand() * 2 - 1;
      v = rand() * 2 - 1;
      s = u * u + v * v;
    } while (s === 0 || s >= 1);
    const mul = Math.sqrt((-2 * Math.log(s)) / s);
    spare = v * mul;
    return u * mul;
  };
}

/**
 * Standard normal CDF via the Abramowitz & Stegun 7.1.26 erf
 * approximation — max absolute error ~1.5e-7, far below the precision
 * any cost estimate carries meaning at.
 */
function normalCdf(z: number): number {
  const sign = z < 0 ? -1 : 1;
  const x = Math.abs(z) / Math.SQRT2;
  const t = 1 / (1 + 0.3275911 * x);
  const y =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t +
      0.254829592) *
      t *
      Math.exp(-x * x);
  return 0.5 * (1 + sign * y);
}

/**
 * Triangular inverse CDF.
 *
 * Chosen over the PERT-beta for the SIMULATION specifically because it
 * has a closed-form inverse, which is what makes the Gaussian copula
 * above work exactly rather than approximately — correlation is applied
 * in quantile space, so every marginal must be invertible. The PERT
 * formula is still used for the deterministic expected value in
 * estimate.ts, where no inversion is needed. Triangular is standard
 * practice in cost risk analysis in its own right.
 */
function triangularInverse(u: number, tp: ThreePoint): number {
  const { optimistic: o, mostLikely: m, pessimistic: p } = tp;
  const span = p - o;
  if (span <= 0) return o;                     // degenerate: no stated range
  const fc = (m - o) / span;
  if (u < fc) return o + Math.sqrt(u * span * (m - o));
  return p - Math.sqrt((1 - u) * span * (p - m));
}

/** Exact variance of a triangular distribution — used to rank risk
 *  drivers without having to retain every sample. */
function triangularVariance(tp: ThreePoint): number {
  const { optimistic: o, mostLikely: m, pessimistic: p } = tp;
  return (o * o + m * m + p * p - o * m - o * p - m * p) / 18;
}

/** Percentile from a sorted array, linearly interpolated. */
function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  if (sorted.length === 1) return sorted[0];
  const idx = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

export interface SimulateOptions {
  iterations?:  number;
  seed?:        number;
  /** 0 = every line independent, 1 = all lines move together. */
  correlation?: number;
  targetP?:     number;
  /** Multiplier applied to every sampled line total, so the simulation
   *  runs on the same loaded basis as the deterministic budget rather
   *  than on bare direct cost. */
  loadFactor?:  number;
  /** Deterministic base the contingency is measured against. */
  deterministicBase: number;
}

export function simulateBudget(
  lineItems: LineItem[],
  lineTotalOf: (li: LineItem) => number,
  opts: SimulateOptions,
): SimulationResult {
  const iterations  = Math.min(50_000, Math.max(1_000, Math.floor(opts.iterations ?? 10_000)));
  const seed        = Math.floor(opts.seed ?? 20260801);
  const correlation = Math.min(1, Math.max(0, opts.correlation ?? 0.3));
  const targetP     = Math.min(99, Math.max(50, Math.round(opts.targetP ?? 80)));
  const loadFactor  = opts.loadFactor && opts.loadFactor > 0 ? opts.loadFactor : 1;
  const base        = opts.deterministicBase;

  const empty = (reason: string): SimulationResult => ({
    ran: false, reason, iterations: 0, seed, correlation,
    mean: 0, stdDev: 0, p10: 0, p50: 0, p80: 0, p90: 0,
    curve: [], targetP, contingencyAtTarget: 0, contingencyPctAtTarget: 0, drivers: [],
  });

  if (lineItems.length === 0) return empty("No line items to simulate.");

  /* Only lines with a stated range carry risk. Lines without one are
     held at their point estimate rather than being assigned an invented
     spread — the classifier already penalises the missing range, and
     inventing one here would manufacture confidence out of nothing. */
  const risky = lineItems
    .map((li) => ({ li, tp: threePointFor(lineTotalOf(li), li) }))
    .filter(({ tp }) => tp.pessimistic > tp.optimistic);

  if (risky.length === 0) {
    return empty(
      "No line carries an uncertainty range, so there is nothing to simulate. Add a range to the lines you are least sure about — those are the ones driving the risk.",
    );
  }

  const fixedTotal = lineItems
    .filter((li) => !risky.some((r) => r.li.id === li.id))
    .reduce((s, li) => s + lineTotalOf(li), 0);

  const rand = mulberry32(seed);
  const normal = normalSampler(rand);
  const rho = Math.sqrt(correlation);
  const antiRho = Math.sqrt(1 - correlation);

  const totals = new Float64Array(iterations);

  for (let i = 0; i < iterations; i++) {
    /* One common shock per iteration, shared by every line — this is
       what makes the lines move together. */
    const zCommon = normal();
    let sum = fixedTotal;

    for (let k = 0; k < risky.length; k++) {
      const zLine = normal();
      // Correlated standard normal, then mapped into a uniform quantile.
      const z = rho * zCommon + antiRho * zLine;
      sum += triangularInverse(normalCdf(z), risky[k].tp);
    }

    totals[i] = sum * loadFactor;
  }

  const sorted = Array.from(totals).sort((a, b) => a - b);

  let mean = 0;
  for (let i = 0; i < iterations; i++) mean += totals[i];
  mean /= iterations;

  let varSum = 0;
  for (let i = 0; i < iterations; i++) {
    const d = totals[i] - mean;
    varSum += d * d;
  }
  const stdDev = Math.sqrt(varSum / Math.max(1, iterations - 1));

  const curve: SCurvePoint[] = [];
  for (let p = 5; p <= 95; p += 5) {
    curve.push({ p, value: round2(percentile(sorted, p)) });
  }

  const atTarget = percentile(sorted, targetP);
  const contingency = Math.max(0, atTarget - base);

  /* Risk ranking by share of total line variance. This is where the
     risk actually lives, which is very often not the biggest line —
     a large, well-understood cost is less dangerous than a medium one
     nobody can bound. */
  const variances = risky.map(({ li, tp }) => ({
    id: li.id,
    name: li.name,
    variance: triangularVariance(tp),
  }));
  const totalVar = variances.reduce((s, v) => s + v.variance, 0);
  const drivers = variances
    .map((v) => ({
      id: v.id,
      name: v.name,
      contributionPct: totalVar > 0 ? round2((v.variance / totalVar) * 100) : 0,
    }))
    .sort((a, b) => b.contributionPct - a.contributionPct)
    .slice(0, 8);

  return {
    ran: true,
    iterations,
    seed,
    correlation,
    mean:   round2(mean),
    stdDev: round2(stdDev),
    p10: round2(percentile(sorted, 10)),
    p50: round2(percentile(sorted, 50)),
    p80: round2(percentile(sorted, 80)),
    p90: round2(percentile(sorted, 90)),
    curve,
    targetP,
    contingencyAtTarget: round2(contingency),
    contingencyPctAtTarget: base > 0 ? round2((contingency / base) * 100) : 0,
    drivers,
  };
}
