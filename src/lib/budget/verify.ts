/**
 * VERIFICATION HARNESS — run with:  npx tsx src/lib/budget/verify.ts
 *
 * Not wired into the app and not imported by it. Financial arithmetic
 * that nobody re-checks drifts silently, and every assertion here
 * encodes a property that must stay true — the tax-base exclusion, the
 * determinism of the simulation, the published reference-class figures,
 * and the fact that the scaffold ships no rates.
 */
import { computeBudget, lineTotal, budgetToCSV } from "./compute";
import { pertExpected, pertStdDev, threePointFor, classifyEstimate } from "./estimate";
import { simulateBudget } from "./simulate";
import { escalationFactor, periodRate } from "./escalation";
import { referenceClassUplift } from "./referenceClass";
import { generateScaffold } from "./scaffold";
import type { LineItem, BudgetSettings } from "./types";

let pass = 0, fail = 0;
const near = (a: number, b: number, tol = 0.02) => Math.abs(a - b) <= tol;
function check(name: string, cond: boolean, detail = "") {
  if (cond) { pass++; console.log(`  PASS  ${name}`); }
  else { fail++; console.log(`  FAIL  ${name} ${detail}`); }
}

const S = (o: Partial<BudgetSettings> = {}): BudgetSettings => ({
  projectName: "T", projectType: "Consulting Engagement", currency: "USD",
  periods: 4, periodLabel: "Month", overheadPct: 0, contingencyPct: 0,
  taxPct: 0, taxOnOverhead: true, ...o,
});
const LI = (o: Partial<LineItem> = {}): LineItem => ({
  id: Math.random().toString(36).slice(2), category: "Personnel", name: "L",
  quantity: 1, unit: "days", unitCost: 100, ...o,
});

console.log("\n── PERT ──");
{
  const tp = { optimistic: 80, mostLikely: 100, pessimistic: 160 };
  check("E = (O+4M+P)/6 = 106.67", near(pertExpected(tp), 106.67));
  check("SD = (P-O)/6 = 13.33", near(pertStdDev(tp), 13.33));
  check("E exceeds M on right-skewed range", pertExpected(tp) > tp.mostLikely);
  const sym = { optimistic: 90, mostLikely: 100, pessimistic: 110 };
  check("E == M on symmetric range", near(pertExpected(sym), 100));
}

console.log("\n── three-point derivation ──");
{
  const tp = threePointFor(1000, LI({ uncertainty: { lowPct: 10, highPct: 30 } }));
  check("O = 900", near(tp.optimistic, 900));
  check("M = 1000", near(tp.mostLikely, 1000));
  check("P = 1300", near(tp.pessimistic, 1300));
  const none = threePointFor(1000, LI());
  check("no range collapses to a point", none.optimistic === 1000 && none.pessimistic === 1000);
}

console.log("\n── TAX BASE LEAK (the reported bug) ──");
{
  const items = [LI({ quantity: 10, unitCost: 100 })];   // direct = 1000
  const b = computeBudget(items, S({ overheadPct: 10, contingencyPct: 10, taxPct: 20, taxOnOverhead: false }));
  check("overhead = 100", near(b.totals.overhead, 100));
  check("contingency = 110 (on direct + overhead)", near(b.totals.contingency, 110));
  check("contingencyOnDirect = 100", near(b.totals.contingencyOnDirect, 100));
  check("taxable base EXCLUDES overhead AND its contingency share = 1100",
    near(b.totals.taxableBase, 1100), `got ${b.totals.taxableBase}`);
  check("old buggy value 1110 is NOT produced", !near(b.totals.taxableBase, 1110));
  check("tax = 220", near(b.totals.tax, 220));

  const on = computeBudget(items, S({ overheadPct: 10, contingencyPct: 10, taxPct: 20, taxOnOverhead: true }));
  check("taxOnOverhead:true taxes everything = 1210", near(on.totals.taxableBase, 1210), `got ${on.totals.taxableBase}`);
  check("toggle actually changes the base", on.totals.taxableBase !== b.totals.taxableBase);
}

console.log("\n── credits ──");
{
  check("credit line resolves negative", lineTotal(LI({ quantity: 1, unitCost: 500, isCredit: true })) === -500);
  check("credit negative even if typed negative", lineTotal(LI({ quantity: 1, unitCost: -500, isCredit: true })) === -500);
  check("non-credit negative coerced to positive magnitude", lineTotal(LI({ quantity: 1, unitCost: -500 })) === 500);
  const b = computeBudget([LI({ quantity: 10, unitCost: 100 }), LI({ quantity: 1, unitCost: 200, isCredit: true })], S());
  check("credit reduces direct cost to 800", near(b.totals.directCosts, 800), `got ${b.totals.directCosts}`);
}

console.log("\n── escalation ──");
{
  check("periodRate(10% annual, 12/yr) ≈ 0.797%", near(periodRate(10, 12) * 100, 0.7974, 0.001));
  check("factor at base period = 1", escalationFactor(1, { annualPct: 10, periodsPerYear: 12, basePeriod: 1 }) === 1);
  check("12 periods after base ≈ 1.10", near(escalationFactor(13, { annualPct: 10, periodsPerYear: 12, basePeriod: 1 }), 1.10, 0.001));
  check("before base is never de-escalated", escalationFactor(1, { annualPct: 10, periodsPerYear: 12, basePeriod: 5 }) === 1);

  const items = [LI({ quantity: 1, unitCost: 1000, period: 13 })];
  const b = computeBudget(items, S({ periods: 24, escalation: { annualPct: 10, periodsPerYear: 12, basePeriod: 1 } }));
  check("escalated direct ≈ 1100", near(b.totals.directCosts, 1100, 1), `got ${b.totals.directCosts}`);
  check("base direct still 1000", near(b.totals.baseDirectCosts, 1000));
  check("escalation reported ≈ 100", near(b.totals.escalation, 100, 1));

  const exempt = computeBudget([LI({ quantity: 1, unitCost: 1000, period: 13, escalationExempt: true })],
    S({ periods: 24, escalation: { annualPct: 10, periodsPerYear: 12, basePeriod: 1 } }));
  check("escalationExempt line is untouched", near(exempt.totals.directCosts, 1000));
}

console.log("\n── Monte Carlo ──");
{
  const items = Array.from({ length: 12 }, (_, i) =>
    LI({ id: `l${i}`, name: `L${i}`, quantity: 10, unitCost: 100, uncertainty: { lowPct: 10, highPct: 40 } }));
  const opts = { deterministicBase: 12000, iterations: 8000, seed: 42, correlation: 0.3, targetP: 80 };

  const a = simulateBudget(items, lineTotal, opts);
  const b = simulateBudget(items, lineTotal, opts);
  check("ran", a.ran);
  check("DETERMINISTIC: identical p80 across runs", a.p80 === b.p80, `${a.p80} vs ${b.p80}`);
  check("DETERMINISTIC: identical mean", a.mean === b.mean);
  check("percentiles ordered p10<p50<p80<p90", a.p10 < a.p50 && a.p50 < a.p80 && a.p80 < a.p90);
  check("p50 near deterministic base", Math.abs(a.p50 - 12000) / 12000 < 0.12, `p50=${a.p50}`);
  check("all samples within [O,P] envelope", a.p10 >= 12000 * 0.9 - 1 && a.p90 <= 12000 * 1.4 + 1);
  check("S-curve has 19 points (5..95)", a.curve.length === 19);
  check("curve monotonically increasing", a.curve.every((pt, i) => i === 0 || pt.value >= a.curve[i - 1].value));
  check("contingency at P80 is positive", a.contingencyAtTarget > 0);
  check("risk drivers sorted descending", a.drivers.every((d, i) => i === 0 || d.contributionPct <= a.drivers[i - 1].contributionPct));
  check("drivers capped at top 8", a.drivers.length === 8);
  check("12 equal-risk lines ⇒ each contributes 1/12 = 8.33%", near(a.drivers[0].contributionPct, 8.33, 0.05));
  {
    // With ≤8 lines the full set is returned, so contributions must sum to 100%.
    const few = Array.from({ length: 5 }, (_, i) =>
      LI({ id: `f${i}`, name: `F${i}`, quantity: 10, unitCost: 100, uncertainty: { lowPct: 10, highPct: 10 + i * 20 } }));
    const r = simulateBudget(few, lineTotal, { ...opts, deterministicBase: 5000 });
    check("full driver set sums to 100%", near(r.drivers.reduce((s, d) => s + d.contributionPct, 0), 100, 0.5));
    check("widest-range line ranks first", r.drivers[0].name === "F4");
  }

  const indep = simulateBudget(items, lineTotal, { ...opts, correlation: 0 });
  const corr  = simulateBudget(items, lineTotal, { ...opts, correlation: 0.8 });
  check("CORRELATION WIDENS SPREAD (the classic error this avoids)",
    corr.stdDev > indep.stdDev * 1.5, `indep=${indep.stdDev} corr=${corr.stdDev}`);
  check("higher correlation ⇒ higher P80", corr.p80 > indep.p80);

  const noRange = simulateBudget([LI({ quantity: 1, unitCost: 100 })], lineTotal, opts);
  check("no stated range ⇒ does not run, and says why", !noRange.ran && Boolean(noRange.reason));
}

console.log("\n── probabilistic contingency wiring ──");
{
  const items = Array.from({ length: 10 }, (_, i) =>
    LI({ id: `p${i}`, quantity: 10, unitCost: 100, uncertainty: { lowPct: 10, highPct: 50 } }));
  const b = computeBudget(items, S({
    useProbabilisticContingency: true, targetConfidence: 80,
    costCorrelation: 0.3, simulationSeed: 7, iterations: 8000,
  }));
  check("simulation ran inside computeBudget", b.simulation.ran);
  check("contingency == simulated P80 contingency",
    near(b.totals.contingency, b.simulation.contingencyAtTarget), `${b.totals.contingency} vs ${b.simulation.contingencyAtTarget}`);
  check("contingency > 0 with real risk", b.totals.contingency > 0);
  check("grand total = direct + cont (no other loads)",
    near(b.totals.grandTotal, b.totals.directCosts + b.totals.contingency));
}

console.log("\n── AACE classification ──");
{
  const empty = classifyEstimate([], 0, S());
  check("empty ⇒ Class 5", empty.estimateClass === 5);
  check("Class 5 accuracy is -50/+100", empty.accuracy.lowPct === -50 && empty.accuracy.highPct === 100);

  // Priced lump sums are a feasibility sketch (Class 4); strip the rates
  // and it drops to order-of-magnitude (Class 5). Caps only ever make the
  // class rougher, never finer, so Class 5 always survives them.
  const rough = Array.from({ length: 3 }, (_, i) => LI({ id: `r${i}`, unit: "lump sum", quantity: 1 }));
  check("3 PRICED lump sums ⇒ Class 4", classifyEstimate(rough, 1000, S()).estimateClass === 4);
  const unpricedRough = rough.map((l) => ({ ...l, unitCost: 0 }));
  check("3 UNPRICED lump sums ⇒ Class 5", classifyEstimate(unpricedRough, 0, S()).estimateClass === 5);
  check("cap is explained in the signals",
    classifyEstimate(rough, 1000, S()).signals.some((x) => x.label === "Capped"));

  const mature = Array.from({ length: 45 }, (_, i) => LI({
    id: `m${i}`, quantity: 10, unit: "days", unitCost: 100, period: (i % 4) + 1,
    uncertainty: { lowPct: 5, highPct: 10 },
    category: (["Personnel", "Travel & Accommodation", "Equipment & Hardware",
      "Software & Licences", "Materials & Supplies", "Other Direct Costs"] as const)[i % 6],
  }));
  const mc = classifyEstimate(mature, 45000, S());
  check("45 quantified, ranged, phased, broad lines ⇒ Class 1 or 2", mc.estimateClass <= 2, `got ${mc.estimateClass}`);
  check("accuracy bounds are money around the total", mc.lowValue < 45000 && mc.highValue > 45000);
  check("signals returned for auditability", mc.signals.length >= 6);
  check("more definition ⇒ tighter range", mc.accuracy.highPct < empty.accuracy.highPct);
}

console.log("\n── reference-class uplift ──");
{
  const soft5 = referenceClassUplift(1000, "Software / IT Build", 5);
  const soft1 = referenceClassUplift(1000, "Software / IT Build", 1);
  check("IT at Class 5 = published 200% upper bound", near(soft5.upliftPct ?? 0, 200));
  check("IT at Class 1 decays to 10% floor", near(soft1.upliftPct ?? 0, 10));
  check("uplift decays monotonically 5→1",
    [5, 4, 3, 2, 1].map((c) => referenceClassUplift(1000, "Software / IT Build", c as 1 | 2 | 3 | 4 | 5).upliftPct ?? 0)
      .every((v, i, arr) => i === 0 || v <= arr[i - 1]));
  check("uplift value = base × pct", near(soft5.upliftValue, 2000));

  const road3 = referenceClassUplift(1000, "Construction & Civil Works", 3);
  check("roads at Class 3 hits published mid-stage 15% exactly", near(road3.upliftPct ?? 0, 15));

  const consulting = referenceClassUplift(1000, "Consulting Engagement", 3);
  check("no published class ⇒ null, NOT zero", consulting.upliftPct === null);
  check("no published class ⇒ zero value applied", consulting.upliftValue === 0);
  check("no published class ⇒ explains why", consulting.basis.includes("No published reference class"));

  const override = referenceClassUplift(1000, "Consulting Engagement", 3, 25);
  check("user override applies", near(override.upliftPct ?? 0, 25) && near(override.upliftValue, 250));
}

console.log("\n── scaffold generator ──");
{
  const { lineItems, warnings } = generateScaffold("Consulting Engagement", {
    weeks: 12, team: 3, daysPerWeek: 4.5, onsitePct: 40, workshops: 4, periods: 3,
  });
  check("generates a real WBS", lineItems.length >= 12, `got ${lineItems.length}`);
  check("EVERY rate is zero (ships no pricing)", lineItems.every((l) => l.unitCost === 0));
  check("every line has a real quantity", lineItems.every((l) => l.quantity > 0));
  check("every line carries a risk range", lineItems.every((l) => Boolean(l.uncertainty)));
  check("every line is phased", lineItems.every((l) => (l.period ?? 0) >= 1));
  check("warns that rates are missing", warnings.some((w) => w.includes("NO RATES")));
  check("delivery base 12w × 3 FTE × 4.5d = 162d → analyst 65% = 105.3",
    near(lineItems.find((l) => l.name.includes("Analyst"))?.quantity ?? 0, 105.3, 0.3));
  const cats = new Set(lineItems.map((l) => l.category));
  check("spans multiple cost categories", cats.size >= 5, `got ${cats.size}`);

  // The classifier must not be fooled by its own scaffold: generated
  // ranges/phasing are the tool's judgement, and no rates exist yet.
  const unpricedClass = classifyEstimate(lineItems, 0, S()).estimateClass;
  const pricedClass = classifyEstimate(
    lineItems.map((l) => ({ ...l, unitCost: 800, provenance: "user" as const })), 100000, S()).estimateClass;
  check("UNPRICED scaffold is capped at Class 4", unpricedClass >= 4, `got ${unpricedClass}`);
  check("pricing it improves the class", pricedClass < unpricedClass, `${unpricedClass} -> ${pricedClass}`);

  for (const t of ["Software / IT Build", "Construction & Civil Works", "Event / Conference",
    "Training & Capability Programme", "Grant / Donor Programme", "Marketing Campaign",
    "Product Launch", "Research & Development", "Infrastructure & Facilities",
    "Manufacturing Run", "Custom / Other"] as const) {
    const r = generateScaffold(t, { weeks: 8, months: 6, team: 3, people: 3, area: 1000,
      attendees: 100, days: 2, cohorts: 3, perCohort: 20, deliveryDays: 2,
      engineers: 4, storeys: 2, beneficiaries: 400, channels: 3, periods: 4, staff: 3 });
    check(`${t} scaffolds`, r.lineItems.length > 0 && r.lineItems.every((l) => l.unitCost === 0));
  }
}

console.log("\n── end-to-end ──");
{
  const { lineItems } = generateScaffold("Software / IT Build", { months: 6, engineers: 4, runMonths: 3, periods: 6 });
  const priced = lineItems.map((l, i) => ({ ...l, unitCost: 500 + (i % 3) * 100 }));
  const b = computeBudget(priced, S({
    projectType: "Software / IT Build", periods: 6, overheadPct: 12, taxPct: 7.5,
    taxOnOverhead: false, useProbabilisticContingency: true, targetConfidence: 80,
    costCorrelation: 0.3, simulationSeed: 99, iterations: 6000,
    escalation: { annualPct: 4, periodsPerYear: 12, basePeriod: 1 },
  }));
  check("produces a grand total", b.totals.grandTotal > 0);
  check("classified", b.classification.estimateClass >= 1 && b.classification.estimateClass <= 5);
  check("simulation ran", b.simulation.ran);
  check("optimism uplift applied for IT", b.totals.optimismUplift > 0);
  check("escalation applied", b.totals.escalation > 0);
  check("accuracy band brackets the total",
    b.classification.lowValue < b.totals.grandTotal && b.classification.highValue > b.totals.grandTotal);
  check("totals reconcile exactly",
    near(b.totals.grandTotal,
      b.totals.directCosts + b.totals.overhead + b.totals.contingency + b.totals.optimismUplift + b.totals.tax, 0.05));
  check("period breakdown sums to grand total",
    near(b.periods.reduce((s, p) => s + p.loaded, 0), b.totals.grandTotal, 1));
  check("CSV exports", budgetToCSV(b).length > 500);
}

console.log(`\n${"=".repeat(50)}\n  ${pass} passed, ${fail} failed\n${"=".repeat(50)}\n`);
if (fail > 0) process.exit(1);
