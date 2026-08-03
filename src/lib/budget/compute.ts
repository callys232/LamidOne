import type {
  LineItem, BudgetSettings, ComputedBudget, CategoryRollup,
  BudgetTotals, PeriodBreakdown, CostCategory,
  LineVariance, VarianceSummary,
} from "./types";
import { COST_CATEGORIES } from "./types";
import { classifyEstimate } from "./estimate";
import { simulateBudget } from "./simulate";
import { referenceClassUplift } from "./referenceClass";
import { applyEscalation } from "./escalation";

/** Round to 2dp without float drift (0.1+0.2 style errors compound across 100s of rows). */
const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

/** Non-negative coercion, for quantities and rates that cannot be negative. */
const safe = (n: unknown): number => {
  const v = typeof n === "number" ? n : Number(n);
  return Number.isFinite(v) && v >= 0 ? v : 0;
};

/**
 * A line's money value.
 *
 * Credits (rebates, discounts, contra-costs) are representable via the
 * explicit `isCredit` flag and always resolve NEGATIVE regardless of how
 * the amount was typed. Previously any negative value was silently
 * coerced to zero, which meant a legitimate credit line vanished from
 * the budget without a word — and a genuine typo was equally invisible.
 * Requiring the flag keeps both cases distinguishable.
 */
export const lineTotal = (li: LineItem): number => {
  const qty = safe(li.quantity);
  const rate = Math.abs(Number(li.unitCost) || 0);
  const magnitude = round2(qty * rate);
  return li.isCredit ? -magnitude : magnitude;
};

/** Percentages above this are almost certainly a typo (15 entered as 1500). */
const PCT_SANITY_CEILING = 200;

/**
 * Single source of truth for every number the budget displays.
 * Deterministic: same inputs always produce the same output, including
 * the Monte Carlo run, which is seeded. No AI involved anywhere — the
 * model may propose line items, this computes the money.
 */
export function computeBudget(lineItems: LineItem[], settings: BudgetSettings): ComputedBudget {
  const warnings: string[] = [];

  const overheadPct    = safe(settings.overheadPct);
  const contingencyPct = safe(settings.contingencyPct);
  const taxPct         = safe(settings.taxPct);
  const periods        = Math.max(1, Math.floor(safe(settings.periods)) || 1);

  /* Percentages are not bounded by anything physical, so a mistyped rate
     produces a confidently wrong budget with no other symptom. */
  for (const [label, pct] of [
    ["Overhead", overheadPct], ["Contingency", contingencyPct], ["Tax", taxPct],
  ] as const) {
    if (pct > PCT_SANITY_CEILING) {
      warnings.push(`${label} is set to ${pct}%. Check this — a rate above ${PCT_SANITY_CEILING}% is usually a decimal-point error.`);
    }
  }

  /* ── Escalation (before anything loads on top) ── */
  const { escalatedTotalOf, breakdown: escalation } =
    applyEscalation(lineItems, lineTotal, settings.escalation, periods);

  const baseDirectCosts = round2(lineItems.reduce((s, li) => s + lineTotal(li), 0));
  const directCosts     = round2(lineItems.reduce((s, li) => s + escalatedTotalOf(li), 0));
  const escalationValue = round2(directCosts - baseDirectCosts);

  /* ── Category rollup (on escalated values) ── */
  const byCategory = new Map<CostCategory, { subtotal: number; count: number }>();
  for (const li of lineItems) {
    const cur = byCategory.get(li.category) ?? { subtotal: 0, count: 0 };
    cur.subtotal += escalatedTotalOf(li);
    cur.count += 1;
    byCategory.set(li.category, cur);
  }

  const categories: CategoryRollup[] = COST_CATEGORIES
    .filter((c) => byCategory.has(c))
    .map((category) => {
      const { subtotal, count } = byCategory.get(category)!;
      return {
        category,
        subtotal:    round2(subtotal),
        pctOfDirect: directCosts > 0 ? round2((subtotal / directCosts) * 100) : 0,
        itemCount:   count,
      };
    })
    .sort((a, b) => b.subtotal - a.subtotal);

  const overhead = round2(directCosts * (overheadPct / 100));

  /* ── Probabilistic cost risk ──
     Simulated on DIRECT costs only. Running it on the fully loaded total
     would be circular when contingency is itself derived from the run,
     and loading a percentage onto a simulated figure adds no information
     the loading percentages did not already contain. */
  const simulation = simulateBudget(lineItems, escalatedTotalOf, {
    iterations:  settings.iterations,
    seed:        settings.simulationSeed,
    correlation: settings.costCorrelation,
    targetP:     settings.targetConfidence,
    deterministicBase: directCosts,
  });

  /* ── Contingency ──
     Either sized from the risk profile at the target confidence level
     (professional practice), or a flat percentage (a stated assumption,
     not an analysis). */
  const useProbabilistic = Boolean(settings.useProbabilisticContingency) && simulation.ran;

  let contingency: number;
  let contingencyOnDirect: number;

  if (useProbabilistic) {
    contingency = simulation.contingencyAtTarget;
    contingencyOnDirect = contingency;      // simulated on direct costs
  } else {
    /* Split at source rather than pro-rata after the fact, so the tax
       base below can exclude the overhead-derived share exactly. */
    contingencyOnDirect = round2(directCosts * (contingencyPct / 100));
    const onOverhead    = round2(overhead * (contingencyPct / 100));
    contingency         = round2(contingencyOnDirect + onOverhead);
  }

  /* ── Estimate class ──
     Called twice on purpose: the class is needed to size the optimism-bias
     uplift, and the uplift changes the grand total the accuracy range is
     expressed against. The function is pure and cheap, so re-deriving the
     money bounds once the final total exists is simpler and less
     error-prone than threading a provisional total through. */
  const provisionalTotal = round2(directCosts + overhead + contingency);
  const provisionalClass = classifyEstimate(lineItems, provisionalTotal, settings);

  const referenceClass = referenceClassUplift(
    provisionalTotal,
    settings.projectType,
    provisionalClass.estimateClass,
    settings.optimismBiasPct,
  );
  const optimismUplift = referenceClass.upliftValue;

  /* ── Tax ──
     FIXED: `taxOnOverhead: false` previously still taxed overhead through
     the back door, because contingency was computed on (direct + overhead)
     and the whole contingency figure went into the taxable base. Only the
     direct-attributable share is included now, so the toggle does what it
     says. */
  const taxableBase = round2(
    settings.taxOnOverhead
      ? directCosts + overhead + contingency + optimismUplift
      : directCosts + contingencyOnDirect + optimismUplift,
  );
  const tax = round2(taxableBase * (taxPct / 100));

  const grandTotal = round2(directCosts + overhead + contingency + optimismUplift + tax);

  const totals: BudgetTotals = {
    baseDirectCosts, escalation: escalationValue, directCosts,
    overhead, contingency, contingencyOnDirect, optimismUplift,
    taxableBase, tax, grandTotal,
  };

  const classification = classifyEstimate(lineItems, grandTotal, settings);

  /* ── Phasing ── */
  const directByPeriod = new Array(periods).fill(0);
  let unphased = 0;

  for (const li of lineItems) {
    const p = li.period;
    const v = escalatedTotalOf(li);
    if (p && p >= 1 && p <= periods) directByPeriod[p - 1] += v;
    else unphased += v;
  }

  if (unphased !== 0) {
    const per = unphased / periods;
    for (let i = 0; i < periods; i++) directByPeriod[i] += per;
  }

  const loadFactor = directCosts > 0 ? grandTotal / directCosts : 0;

  const periodBreakdown: PeriodBreakdown[] = directByPeriod.map((direct, i) => ({
    period: i + 1,
    label:  `${settings.periodLabel} ${i + 1}`,
    direct: round2(direct),
    loaded: round2(direct * loadFactor),
  }));

  /* ── Data-quality checks ── */
  if (lineItems.length === 0) {
    warnings.push("No line items yet — add costs, or generate a starting structure from your project type.");
  }

  const unpriced = lineItems.filter((li) => safe(li.unitCost) === 0 && !li.isCredit).length;
  if (unpriced > 0) {
    warnings.push(`${unpriced} line${unpriced > 1 ? "s have" : " has"} no rate yet. Quantities without rates are a structure, not a budget.`);
  }

  if (!simulation.ran && lineItems.length > 0 && simulation.reason) {
    warnings.push(simulation.reason);
  }
  if (!useProbabilistic && contingencyPct === 0 && lineItems.length > 0) {
    warnings.push("Contingency is 0% and no risk simulation is driving it. Every estimate carries risk; this one just is not showing it.");
  }
  if (classification.estimateClass >= 4 && lineItems.length > 0) {
    warnings.push(`This is a ${classification.label}. ${classification.fitFor}`);
  }
  if (referenceClass.upliftPct === null && lineItems.length > 0) {
    warnings.push(referenceClass.basis);
  }

  const top = categories[0];
  if (top && top.pctOfDirect > 70) {
    warnings.push(`${top.category} is ${top.pctOfDirect}% of direct cost — concentration risk worth reviewing.`);
  }

  /* ── Plan versus actual ── */
  const variance = computeVariance(lineItems, escalatedTotalOf, grandTotal, directCosts);
  if (variance.tracked) {
    if (variance.variancePct > 10) {
      warnings.push(
        `Tracked spend is ${variance.variancePct}% over budget on ${variance.linesTracked} line${variance.linesTracked > 1 ? "s" : ""}.`
      );
    }
    if (variance.overruns.length > 0) {
      const worst = variance.overruns[0];
      warnings.push(`Largest overrun: ${worst.name} at ${worst.variancePct}% above plan.`);
    }
    if (variance.projectedTotal !== null && variance.projectedTotal > grandTotal) {
      warnings.push(
        `At the current overrun rate the project lands near ${Math.round(variance.projectedTotal).toLocaleString()} against a ${Math.round(grandTotal).toLocaleString()} budget.`
      );
    }
  }

  return {
    settings, lineItems, categories, totals, periods: periodBreakdown,
    classification, simulation, referenceClass, escalation,
    variance, warnings,
  };
}

/**
 * Compares budgeted against actual for every line carrying an actual.
 *
 * Lines without an actual are excluded rather than counted as zero spent —
 * "not started" and "spent nothing" are different states and conflating them
 * would understate the overrun.
 *
 * Note the fields are named `...OnTracked`, not `...ToDate`: there is no
 * time dimension here at all. A line is included because someone entered an
 * actual against it, not because its period has passed.
 */
function computeVariance(
  lineItems:   LineItem[],
  totalOf:     (li: LineItem) => number,
  grandTotal:  number,
  directCosts: number,
): VarianceSummary {
  const tracked = lineItems.filter((li) => typeof li.actual === "number" && Number.isFinite(li.actual));

  if (tracked.length === 0) {
    return {
      tracked: false, linesTracked: 0, budgetedOnTracked: 0, actualOnTracked: 0,
      variance: 0, variancePct: 0, overruns: [], lines: [], projectedTotal: null,
    };
  }

  const lines: LineVariance[] = tracked
    .map((li) => {
      const budgeted = totalOf(li);
      const actual   = safe(li.actual);
      const variance = round2(actual - budgeted);
      const variancePct = budgeted !== 0 ? round2((variance / budgeted) * 100) : 0;
      return {
        id: li.id, name: li.name, category: li.category,
        budgeted, actual, variance, variancePct,
        // A 2% swing either way is noise, not a signal worth flagging.
        status: variancePct > 2 ? "over" : variancePct < -2 ? "under" : "on-track",
      } as LineVariance;
    })
    .sort((a, b) => b.variance - a.variance);

  const budgetedOnTracked = round2(lines.reduce((s, l) => s + l.budgeted, 0));
  const actualOnTracked   = round2(lines.reduce((s, l) => s + l.actual, 0));
  const variance          = round2(actualOnTracked - budgetedOnTracked);
  const variancePct       = budgetedOnTracked !== 0 ? round2((variance / budgetedOnTracked) * 100) : 0;

  /* Projecting from a tiny sample is worse than not projecting. Require a
     quarter of direct cost to be tracked before extrapolating. */
  const coverage = directCosts > 0 ? budgetedOnTracked / directCosts : 0;
  const projectedTotal =
    coverage >= 0.25 ? round2(grandTotal * (1 + variancePct / 100)) : null;

  return {
    tracked: true,
    linesTracked: lines.length,
    budgetedOnTracked, actualOnTracked, variance, variancePct,
    overruns: lines.filter((l) => l.status === "over"),
    lines,
    projectedTotal,
  };
}

/** Currency formatter with graceful fallback for unusual ISO codes. */
export function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  }
}

/** RFC-4180 CSV export — quotes escaped so names with commas survive Excel. */
export function budgetToCSV(b: ComputedBudget): string {
  const esc = (v: string | number) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const { settings: s, totals: t, classification: c } = b;

  const rows: string[] = [];
  rows.push(esc(`${s.projectName} — Budget`));
  rows.push(esc(`Project type,${s.projectType}`));
  rows.push(`Currency,${esc(s.currency)}`);
  rows.push(esc(`Estimate class,${c.label} (${c.definitionPct}% defined)`));
  rows.push(esc(`Expected accuracy,${c.accuracy.lowPct}% to +${c.accuracy.highPct}% — ${Math.round(c.lowValue).toLocaleString()} to ${Math.round(c.highValue).toLocaleString()}`));
  rows.push(esc(`Fit for,${c.fitFor}`));
  rows.push("");
  rows.push(["Category", "Item", "Qty", "Unit", "Unit Cost", "Total", "Low", "High", "Actual", "Variance", "Variance %", s.periodLabel, "Notes"].map(esc).join(","));

  for (const li of b.lineItems) {
    const v = b.variance.lines.find((l) => l.id === li.id);
    const base = lineTotal(li);
    const u = li.uncertainty;
    rows.push([
      li.category, li.name, li.quantity, li.unit,
      li.unitCost, base,
      u ? round2(base * (1 - u.lowPct / 100)) : "",
      u ? round2(base * (1 + u.highPct / 100)) : "",
      v ? v.actual : "", v ? v.variance : "", v ? `${v.variancePct}%` : "",
      li.period ?? "", li.notes ?? "",
    ].map(esc).join(","));
  }

  rows.push("");
  rows.push(["Subtotal by category", "", "", "", "", "", "", ""].map(esc).join(","));
  for (const cat of b.categories) {
    rows.push([cat.category, "", "", "", "", cat.subtotal, "", `${cat.pctOfDirect}% of direct`].map(esc).join(","));
  }

  rows.push("");
  rows.push(`Direct costs (base),,,,,${t.baseDirectCosts}`);
  if (t.escalation !== 0) rows.push(`Escalation,,,,,${t.escalation}`);
  rows.push(`Direct costs (escalated),,,,,${t.directCosts}`);
  rows.push(`Overhead (${s.overheadPct}%),,,,,${t.overhead}`);
  rows.push(esc(`Contingency,${b.simulation.ran && s.useProbabilisticContingency ? `P${b.simulation.targetP} risk-based` : `${s.contingencyPct}% flat`}`) + `,,,,${t.contingency}`);
  if (t.optimismUplift !== 0) {
    rows.push(esc(`Optimism bias uplift (${b.referenceClass.upliftPct}%)`) + `,,,,,${t.optimismUplift}`);
  }
  rows.push(`Tax (${s.taxPct}%),,,,,${t.tax}`);
  rows.push(`GRAND TOTAL,,,,,${t.grandTotal}`);

  if (b.simulation.ran) {
    rows.push("");
    rows.push(esc(`Cost risk — ${b.simulation.iterations.toLocaleString()} iterations, correlation ${b.simulation.correlation}, seed ${b.simulation.seed}`));
    rows.push(["Confidence", "Total"].map(esc).join(","));
    for (const pt of b.simulation.curve) rows.push(`P${pt.p},${pt.value}`);
  }

  if (b.variance.tracked) {
    rows.push("");
    rows.push(`Budgeted on tracked lines,,,,,${b.variance.budgetedOnTracked}`);
    rows.push(`Actual on tracked lines,,,,,${b.variance.actualOnTracked}`);
    rows.push(`Variance,,,,,${b.variance.variance},${b.variance.variancePct}%`);
    if (b.variance.projectedTotal !== null) {
      rows.push(`Projected total at current rate,,,,,${b.variance.projectedTotal}`);
    }
  }

  rows.push("");
  rows.push([s.periodLabel, "Direct", "Loaded"].map(esc).join(","));
  for (const p of b.periods) {
    rows.push([p.label, p.direct, p.loaded].map(esc).join(","));
  }

  return rows.join("\n");
}
