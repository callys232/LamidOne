import type {
  LineItem, ThreePoint, EstimateClass, AccuracyRange,
  EstimateClassification, BudgetSettings,
} from "./types";

/**
 * THREE-POINT ESTIMATION AND ESTIMATE CLASSIFICATION.
 *
 * Two things the calculator could not do before, both of which are the
 * difference between a spreadsheet and an estimate a board can act on:
 *
 *  1. A cost is a RANGE, not a number. PERT turns an optimistic /
 *     most-likely / pessimistic triple into an expected value that
 *     accounts for skew, plus a standard deviation.
 *
 *  2. An estimate's accuracy is a function of how well the project is
 *     DEFINED, and that is measurable from the inputs themselves. AACE
 *     International's 18R-97 classification is the industry standard
 *     for this and publishes the expected accuracy of each class.
 *
 * Presenting a grand total with no stated accuracy is the single most
 * misleading thing a cost tool can do: a concept-stage number and a
 * tendered number look identical on the page, and one of them is
 * -50%/+100%.
 */

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/* ───────────────────────────────────────────────────────────────
   PERT
   ─────────────────────────────────────────────────────────────── */

/**
 * Expected value, weighting the most-likely case four times as heavily
 * as either extreme: E = (O + 4M + P) / 6.
 *
 * Note this is NOT the same as the most-likely value whenever the range
 * is asymmetric — and cost ranges nearly always are, because cost has a
 * floor and a long right tail. That gap between "what I think it costs"
 * and "what it costs on average" is exactly the money projects lose.
 */
export const pertExpected = (tp: ThreePoint): number =>
  round2((tp.optimistic + 4 * tp.mostLikely + tp.pessimistic) / 6);

/**
 * Standard deviation, (P − O) / 6 — the classic PERT approximation,
 * which treats the optimistic-to-pessimistic spread as covering
 * roughly six standard deviations of a beta distribution.
 */
export const pertStdDev = (tp: ThreePoint): number =>
  round2(Math.max(0, (tp.pessimistic - tp.optimistic) / 6));

/**
 * Resolves a line's three-point range from its point estimate.
 *
 * A line with no stated uncertainty collapses to a degenerate range
 * (O = M = P). That is deliberately NOT read as "this line is certain"
 * — the classifier below counts it as an unstated range, which lowers
 * the estimate's class. Unknown and zero are different.
 */
export function threePointFor(pointTotal: number, li: LineItem): ThreePoint {
  const u = li.uncertainty;
  if (!u) return { optimistic: pointTotal, mostLikely: pointTotal, pessimistic: pointTotal };

  const low = clamp(Number(u.lowPct) || 0, 0, 100);   // cannot be >100% below
  const high = Math.max(0, Number(u.highPct) || 0);   // no ceiling on overrun

  return {
    optimistic:  round2(pointTotal * (1 - low / 100)),
    mostLikely:  round2(pointTotal),
    pessimistic: round2(pointTotal * (1 + high / 100)),
  };
}

/* ───────────────────────────────────────────────────────────────
   AACE INTERNATIONAL 18R-97
   ─────────────────────────────────────────────────────────────── */

/**
 * The published classification table. Accuracy ranges are stated at an
 * 80% confidence interval: if contingency has been set appropriately,
 * roughly 80% of projects should land inside the range for their class.
 *
 * `definitionFloor` is this implementation's non-overlapping threshold.
 * AACE's own published bands overlap (Class 3 is 10–40%, Class 2 is
 * 30–75%) because a human assigns the class with judgement; a function
 * has to pick one, so the boundaries below sit inside each band.
 */
const AACE_TABLE: Record<EstimateClass, {
  definitionFloor: number;
  accuracy: AccuracyRange;
  label: string;
  fitFor: string;
  method: string;
}> = {
  5: {
    definitionFloor: 0,
    accuracy: { lowPct: -50, highPct: 100 },
    label: "Class 5 — Order of magnitude",
    fitFor: "Screening an idea. Not fit to authorise spend, set a baseline or quote a client.",
    method: "Parametric models, capacity factoring, judgement",
  },
  4: {
    definitionFloor: 10,
    accuracy: { lowPct: -30, highPct: 50 },
    label: "Class 4 — Study / feasibility",
    fitFor: "Comparing options and testing viability. Still too soft to commit to a number externally.",
    method: "Equipment-factored or parametric models",
  },
  3: {
    definitionFloor: 25,
    accuracy: { lowPct: -20, highPct: 30 },
    label: "Class 3 — Budget authorisation",
    fitFor: "Requesting funding and setting an initial control budget.",
    method: "Semi-detailed unit costs with line-item takeoff",
  },
  2: {
    definitionFloor: 50,
    accuracy: { lowPct: -15, highPct: 20 },
    label: "Class 2 — Control baseline",
    fitFor: "Bid evaluation and the baseline you will be measured against.",
    method: "Detailed unit costs with forced detailed takeoff",
  },
  1: {
    definitionFloor: 75,
    accuracy: { lowPct: -10, highPct: 15 },
    label: "Class 1 — Check estimate",
    fitFor: "Validating a bid, pricing change orders, final commitment.",
    method: "Detailed unit costs with detailed takeoff",
  },
};

export const aaceMethodFor = (c: EstimateClass) => AACE_TABLE[c].method;

/** Lump-sum-style units carry no quantification — they are a placeholder
 *  for work nobody has broken down yet. */
const LUMP_UNITS = new Set(["lump sum", "lump", "ls", "allowance", "provisional", "tbc", ""]);

/**
 * Scores how completely the project is defined, from the inputs alone,
 * and maps that to an AACE class.
 *
 * Every signal is reported back with its own score so the classification
 * is arguable rather than asserted — a user who disagrees can see which
 * signal dragged it down and go fix that specific thing, which is the
 * whole point. The weights are this implementation's judgement, not part
 * of the AACE standard, and are stated as such in the UI.
 */
export function classifyEstimate(
  lineItems: LineItem[],
  grandTotal: number,
  settings: BudgetSettings,
): EstimateClassification {
  const n = lineItems.length;

  if (n === 0) {
    const t = AACE_TABLE[5];
    return {
      estimateClass: 5,
      definitionPct: 0,
      accuracy: t.accuracy,
      lowValue: 0,
      highValue: 0,
      label: t.label,
      fitFor: t.fitFor,
      signals: [{ label: "Line items", scorePct: 0, detail: "No costs entered yet." }],
    };
  }

  /* 1. Quantification — is the work broken into countable units, or is
        it a pile of lump sums? The strongest single maturity signal. */
  const quantified = lineItems.filter(
    (li) => Number(li.quantity) > 0 && !LUMP_UNITS.has(String(li.unit ?? "").trim().toLowerCase()),
  ).length;
  const quantPct = (quantified / n) * 100;

  /* 2. Rates supplied — the single hardest signal to fake.
        A generated structure arrives fully quantified, ranged and
        phased with NO rates, so without this the scaffold would score
        as a near-complete estimate on a budget nobody has priced. */
  const priced = lineItems.filter((li) => li.isCredit || Math.abs(Number(li.unitCost) || 0) > 0).length;
  const pricedPct = (priced / n) * 100;

  /* 3. Stated uncertainty — has anyone thought about the range?
        Tool-supplied defaults count at HALF. The scaffold attaches a
        starting range to every line it generates; that is a useful
        default but it is the tool's judgement, not the estimator's,
        and counting it in full would let a one-click structure claim
        the definition maturity of a considered estimate. */
  const ownRange = lineItems.filter((li) => li.uncertainty && (!li.provenance || li.provenance === "user")).length;
  const toolRange = lineItems.filter((li) => li.uncertainty && li.provenance && li.provenance !== "user").length;
  const rangePct = ((ownRange + toolRange * 0.5) / n) * 100;

  /* 3. Phasing — knowing WHEN cost lands means the plan exists. */
  const phased = lineItems.filter((li) => Number(li.period) > 0).length;
  const phasePct = (phased / n) * 100;

  /* 4. Granularity — 6 lines is a sketch, 60 is a takeoff. Saturates at
        40 so a very large project is not scored as more mature purely
        for being large. */
  const granPct = clamp((n / 40) * 100, 0, 100);

  /* 5. Category breadth — how much of the cost surface was considered.
        Missing whole categories is how estimates get 30% light. */
  const distinctCats = new Set(lineItems.map((li) => li.category)).size;
  const breadthPct = clamp((distinctCats / 6) * 100, 0, 100);

  const signals = [
    { label: "Rates supplied", scorePct: Math.round(pricedPct), weight: 0.25,
      detail: `${priced} of ${n} lines carry a rate. A generated structure is not an estimate until it is priced.` },
    { label: "Quantified line items", scorePct: Math.round(quantPct), weight: 0.25,
      detail: `${quantified} of ${n} lines have a real quantity and unit rather than a lump sum.` },
    { label: "Cost ranges stated", scorePct: Math.round(rangePct), weight: 0.20,
      detail: toolRange > 0
        ? `${ownRange} of ${n} lines carry a range you set; ${toolRange} use a generated default, which counts at half.`
        : `${ownRange} of ${n} lines carry an uncertainty range. An unstated range is unknown, not zero.` },
    { label: "Granularity", scorePct: Math.round(granPct), weight: 0.15,
      detail: `${n} line items. Detailed takeoffs typically run to 40 or more.` },
    { label: "Phasing", scorePct: Math.round(phasePct), weight: 0.10,
      detail: `${phased} of ${n} lines are assigned to a ${String(settings.periodLabel ?? "period").toLowerCase()}.` },
    { label: "Category coverage", scorePct: Math.round(breadthPct), weight: 0.05,
      detail: `${distinctCats} cost categories used. Missing categories are the usual cause of a light estimate.` },
  ];

  const definitionPct = Math.round(
    signals.reduce((s, sig) => s + sig.scorePct * sig.weight, 0),
  );

  const fromScore: EstimateClass =
    definitionPct >= AACE_TABLE[1].definitionFloor ? 1
    : definitionPct >= AACE_TABLE[2].definitionFloor ? 2
    : definitionPct >= AACE_TABLE[3].definitionFloor ? 3
    : definitionPct >= AACE_TABLE[4].definitionFloor ? 4
    : 5;

  /**
   * NECESSARY CONDITIONS — hard caps a weighted average must not outvote.
   *
   * A score is good at ranking maturity but bad at enforcing floors: a
   * generated structure is fully quantified, phased and categorised the
   * instant it is created, which was enough to carry an UNPRICED budget
   * to Class 2. No amount of structure makes an unpriced sketch a
   * control baseline, and three lump sums are not a budget-authorisation
   * estimate however well described they are. Both are gates, not
   * contributions. Higher class number = rougher, so a cap is a MAX.
   */
  const caps: { cls: EstimateClass; why: string }[] = [];
  if (pricedPct < 50) caps.push({ cls: 4, why: "over half the lines have no rate — this is a structure, not yet an estimate" });
  else if (pricedPct < 90) caps.push({ cls: 3, why: "some lines are still unpriced" });
  if (n < 10) caps.push({ cls: 4, why: `only ${n} line items` });
  else if (n < 25) caps.push({ cls: 3, why: `${n} line items is below takeoff-level detail` });

  const capped = caps.reduce<EstimateClass>((worst, c) => (c.cls > worst ? c.cls : worst), 1);
  const estimateClass: EstimateClass = Math.max(fromScore, capped) as EstimateClass;

  if (estimateClass !== fromScore) {
    const reasons = caps.filter((c) => c.cls === capped).map((c) => c.why);
    signals.push({
      label: "Capped", scorePct: 0, weight: 0,
      detail: `Scored Class ${fromScore} but held at Class ${estimateClass}: ${reasons.join("; ")}.`,
    });
  }

  const t = AACE_TABLE[estimateClass];

  return {
    estimateClass,
    definitionPct,
    accuracy: t.accuracy,
    lowValue:  round2(grandTotal * (1 + t.accuracy.lowPct / 100)),
    highValue: round2(grandTotal * (1 + t.accuracy.highPct / 100)),
    label: t.label,
    fitFor: t.fitFor,
    signals: signals.map(({ label, scorePct, detail }) => ({ label, scorePct, detail })),
  };
}
