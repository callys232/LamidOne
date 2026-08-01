import type {
  LineItem, BudgetSettings, ComputedBudget, CategoryRollup,
  BudgetTotals, PeriodBreakdown, CostCategory,
  LineVariance, VarianceSummary,
} from "./types";
import { COST_CATEGORIES } from "./types";

/** Round to 2dp without float drift (0.1+0.2 style errors compound across 100s of rows). */
const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

const safe = (n: unknown): number => {
  const v = typeof n === "number" ? n : Number(n);
  return Number.isFinite(v) && v >= 0 ? v : 0;
};

export const lineTotal = (li: LineItem): number => round2(safe(li.quantity) * safe(li.unitCost));

/**
 * Single source of truth for every number the budget displays.
 * Deterministic: same inputs always produce the same output. No AI involved —
 * the model proposes line items, this computes the money.
 */
export function computeBudget(lineItems: LineItem[], settings: BudgetSettings): ComputedBudget {
  const warnings: string[] = [];

  const overheadPct    = safe(settings.overheadPct);
  const contingencyPct = safe(settings.contingencyPct);
  const taxPct         = safe(settings.taxPct);
  const periods        = Math.max(1, Math.floor(safe(settings.periods)) || 1);

  /* ── Direct costs ── */
  const directCosts = round2(lineItems.reduce((sum, li) => sum + lineTotal(li), 0));

  /* ── Category rollup ── */
  const byCategory = new Map<CostCategory, { subtotal: number; count: number }>();
  for (const li of lineItems) {
    const cur = byCategory.get(li.category) ?? { subtotal: 0, count: 0 };
    cur.subtotal += lineTotal(li);
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

  /* ── Loaded costs ── */
  const overhead    = round2(directCosts * (overheadPct / 100));
  const contingency = round2((directCosts + overhead) * (contingencyPct / 100));

  // Tax base optionally excludes overhead (varies by jurisdiction/contract).
  const taxableBase = round2(
    settings.taxOnOverhead ? directCosts + overhead + contingency : directCosts + contingency
  );
  const tax = round2(taxableBase * (taxPct / 100));

  const grandTotal = round2(directCosts + overhead + contingency + tax);

  const totals: BudgetTotals = {
    directCosts, overhead, contingency, taxableBase, tax, grandTotal,
  };

  /* ── Phasing ── */
  const directByPeriod = new Array(periods).fill(0);
  let unphased = 0;

  for (const li of lineItems) {
    const p = li.period;
    if (p && p >= 1 && p <= periods) {
      directByPeriod[p - 1] += lineTotal(li);
    } else {
      unphased += lineTotal(li);
    }
  }

  // Anything without an explicit period spreads evenly.
  if (unphased > 0) {
    const per = unphased / periods;
    for (let i = 0; i < periods; i++) directByPeriod[i] += per;
  }

  // Loaded costs follow direct spend pro-rata rather than sitting in period 1.
  const loadFactor = directCosts > 0 ? grandTotal / directCosts : 0;

  const periodBreakdown: PeriodBreakdown[] = directByPeriod.map((direct, i) => ({
    period: i + 1,
    label:  `${settings.periodLabel} ${i + 1}`,
    direct: round2(direct),
    loaded: round2(direct * loadFactor),
  }));

  /* ── Data-quality checks ── */
  if (lineItems.length === 0) {
    warnings.push("No line items yet — add costs or generate a starting scaffold.");
  }
  const zeroCost = lineItems.filter((li) => lineTotal(li) === 0).length;
  if (zeroCost > 0) {
    warnings.push(`${zeroCost} line item${zeroCost > 1 ? "s have" : " has"} a zero total — check quantity and unit cost.`);
  }
  if (contingencyPct === 0 && lineItems.length > 0) {
    warnings.push("Contingency is 0%. Most projects carry 5–15% to absorb overruns.");
  }
  const top = categories[0];
  if (top && top.pctOfDirect > 70) {
    warnings.push(`${top.category} is ${top.pctOfDirect}% of direct cost — concentration risk worth reviewing.`);
  }

  /* ── Plan versus actual ── */
  const variance = computeVariance(lineItems, grandTotal, directCosts);
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

  return { settings, lineItems, categories, totals, periods: periodBreakdown, variance, warnings };
}

/**
 * Compares budgeted against actual for every line carrying an actual.
 *
 * Lines without an actual are excluded rather than counted as zero spent —
 * "not started" and "spent nothing" are different states and conflating them
 * would understate the overrun.
 */
function computeVariance(
  lineItems:   LineItem[],
  grandTotal:  number,
  directCosts: number,
): VarianceSummary {
  const tracked = lineItems.filter((li) => typeof li.actual === "number" && Number.isFinite(li.actual));

  if (tracked.length === 0) {
    return {
      tracked: false, linesTracked: 0, budgetedToDate: 0, actualToDate: 0,
      variance: 0, variancePct: 0, overruns: [], lines: [], projectedTotal: null,
    };
  }

  const lines: LineVariance[] = tracked
    .map((li) => {
      const budgeted = lineTotal(li);
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

  const budgetedToDate = round2(lines.reduce((s, l) => s + l.budgeted, 0));
  const actualToDate   = round2(lines.reduce((s, l) => s + l.actual, 0));
  const variance       = round2(actualToDate - budgetedToDate);
  const variancePct    = budgetedToDate !== 0 ? round2((variance / budgetedToDate) * 100) : 0;

  /* Projecting from a tiny sample is worse than not projecting. Require a
     quarter of direct cost to be tracked before extrapolating. */
  const coverage = directCosts > 0 ? budgetedToDate / directCosts : 0;
  const projectedTotal =
    coverage >= 0.25 ? round2(grandTotal * (1 + variancePct / 100)) : null;

  return {
    tracked: true,
    linesTracked: lines.length,
    budgetedToDate, actualToDate, variance, variancePct,
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
  const { settings: s, totals: t } = b;

  const rows: string[] = [];
  rows.push(esc(`${s.projectName} — Budget`));
  rows.push(esc(`Project type,${s.projectType}`));
  rows.push(`Currency,${esc(s.currency)}`);
  rows.push("");
  rows.push(["Category", "Item", "Qty", "Unit", "Unit Cost", "Total", "Actual", "Variance", "Variance %", s.periodLabel, "Notes"].map(esc).join(","));

  for (const li of b.lineItems) {
    const v = b.variance.lines.find((l) => l.id === li.id);
    rows.push([
      li.category, li.name, li.quantity, li.unit,
      li.unitCost, lineTotal(li),
      v ? v.actual : "", v ? v.variance : "", v ? `${v.variancePct}%` : "",
      li.period ?? "", li.notes ?? "",
    ].map(esc).join(","));
  }

  rows.push("");
  rows.push(["Subtotal by category", "", "", "", "", "", "", ""].map(esc).join(","));
  for (const c of b.categories) {
    rows.push([c.category, "", "", "", "", c.subtotal, "", `${c.pctOfDirect}% of direct`].map(esc).join(","));
  }

  rows.push("");
  rows.push(`Direct costs,,,,,${t.directCosts}`);
  rows.push(`Overhead (${s.overheadPct}%),,,,,${t.overhead}`);
  rows.push(`Contingency (${s.contingencyPct}%),,,,,${t.contingency}`);
  rows.push(`Tax (${s.taxPct}%),,,,,${t.tax}`);
  rows.push(`GRAND TOTAL,,,,,${t.grandTotal}`);

  if (b.variance.tracked) {
    rows.push("");
    rows.push(`Budgeted to date,,,,,${b.variance.budgetedToDate}`);
    rows.push(`Actual to date,,,,,${b.variance.actualToDate}`);
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
