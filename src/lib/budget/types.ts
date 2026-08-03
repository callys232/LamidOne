/** Project archetypes the budget engine can scaffold. */
export const PROJECT_TYPES = [
  "Software / IT Build",
  "Construction & Civil Works",
  "Marketing Campaign",
  "Event / Conference",
  "Product Launch",
  "Research & Development",
  "Consulting Engagement",
  "Training & Capability Programme",
  "Infrastructure & Facilities",
  "Grant / Donor Programme",
  "Manufacturing Run",
  "Custom / Other",
] as const;
export type ProjectType = (typeof PROJECT_TYPES)[number];

/** Standard cost groupings. Kept generic so any project type maps onto them. */
export const COST_CATEGORIES = [
  "Personnel",
  "Contractors & Professional Fees",
  "Equipment & Hardware",
  "Software & Licences",
  "Materials & Supplies",
  "Facilities & Logistics",
  "Travel & Accommodation",
  "Marketing & Communications",
  "Training & Development",
  "Compliance & Insurance",
  "Other Direct Costs",
] as const;
export type CostCategory = (typeof COST_CATEGORIES)[number];

/**
 * Where a number came from. A budget you cannot audit is a guess with
 * decimal places — every generated figure carries this so a reviewer can
 * see which numbers the user owns and which the tool derived.
 */
export type Provenance =
  | "user"            // typed in directly
  | "ratio"           // derived from a published structural heuristic (see scaffold.ts)
  | "driver"          // computed from a parametric driver (area, headcount, attendees)
  | "standard";       // taken from a cited standard (AACE, Green Book)

/**
 * Three-point uncertainty, expressed as percentages either side of the
 * point estimate — the way estimators actually think ("could be 10% under,
 * 30% over") rather than as three absolute numbers to re-enter.
 *
 * Asymmetry is the norm and is the point: costs have a floor (you cannot
 * spend much less than the work costs) and a long right tail. A symmetric
 * range is almost always a sign nobody thought about it.
 */
export interface LineUncertainty {
  /** % BELOW the point estimate. 10 → optimistic = point × 0.90. */
  lowPct:  number;
  /** % ABOVE the point estimate. 30 → pessimistic = point × 1.30. */
  highPct: number;
}

/** Absolute three-point values, derived from a point estimate + uncertainty. */
export interface ThreePoint {
  optimistic:  number;
  mostLikely:  number;
  pessimistic: number;
}

export interface LineItem {
  id:        string;
  category:  CostCategory;
  name:      string;
  notes?:    string;
  quantity:  number;
  unit:      string;   // "hours", "days", "units", "months", "sqm", "lump sum"
  unitCost:  number;
  /** Optional 1-based period this cost lands in, for phasing. */
  period?:   number;
  /**
   * Amount actually spent against this line so far. A budget that is never
   * compared to actuals is a calculator — this is what makes it a control.
   * Undefined means not yet tracked, which is different from zero spent.
   */
  actual?:   number;
  /**
   * Cost risk on this line. Absent means "point estimate, no range stated" —
   * which the classifier treats as an immaturity signal rather than as
   * certainty, because an unstated range is unknown, not zero.
   */
  uncertainty?: LineUncertainty;
  /**
   * True for credits, rebates, discounts and contra-costs. Required to carry
   * a negative `unitCost`, so a stray minus sign is still caught as an error
   * while a genuine credit line is representable.
   */
  isCredit?: boolean;
  /** Excluded from escalation — already quoted at out-turn prices, or fixed
   *  by contract for the project's duration. */
  escalationExempt?: boolean;
  provenance?: Provenance;
}

/* ───────────────────────────────────────────────────────────────
   ESTIMATE CLASSIFICATION — AACE International 18R-97
   ─────────────────────────────────────────────────────────────── */

/** 5 (roughest) … 1 (most defined). Never 0 — there is no such class. */
export type EstimateClass = 1 | 2 | 3 | 4 | 5;

export interface AccuracyRange {
  /** Negative. −20 means the true cost could be 20% BELOW this estimate. */
  lowPct:  number;
  /** Positive. +30 means it could be 30% ABOVE. */
  highPct: number;
}

export interface EstimateClassification {
  estimateClass: EstimateClass;
  /** 0–100. How completely the project is defined, derived from the inputs. */
  definitionPct: number;
  /** AACE's expected accuracy at an 80% confidence interval for this class. */
  accuracy:      AccuracyRange;
  /** Grand total ± the accuracy range, in money. */
  lowValue:      number;
  highValue:     number;
  label:         string;
  /** What this class is fit to be used FOR. Stops a screening number being
   *  taken to a board as a control budget. */
  fitFor:        string;
  /** The individual maturity signals, so the classification is arguable
   *  rather than asserted. */
  signals:       { label: string; scorePct: number; detail: string }[];
}

/* ───────────────────────────────────────────────────────────────
   REFERENCE-CLASS FORECASTING — HM Treasury Green Book
   ─────────────────────────────────────────────────────────────── */

export interface ReferenceClassUplift {
  /** The Green Book reference class this project type maps onto, or null
   *  where no published class genuinely fits. */
  referenceClass: string | null;
  /** % uplift applied. Null when no published figure exists and the user
   *  has not supplied one — deliberately not defaulted to zero, because
   *  "no data" and "no bias" are different claims. */
  upliftPct:      number | null;
  upliftValue:    number;
  /** Published upper bound for this class, before maturity decay. */
  publishedUpperPct: number | null;
  /** Why this figure, in one line, including the decay applied. Explains
   *  the arithmetic without citing the underlying research. */
  basis:          string;
}

/* ───────────────────────────────────────────────────────────────
   PROBABILISTIC COST RISK — Monte Carlo
   ─────────────────────────────────────────────────────────────── */

export interface SCurvePoint {
  /** Confidence level, 1–99. */
  p:     number;
  value: number;
}

export interface SimulationResult {
  ran:        boolean;
  /** Why not, when `ran` is false. */
  reason?:    string;
  iterations: number;
  /** Deterministic: the same inputs and seed always produce this same run. */
  seed:       number;
  correlation: number;
  mean:       number;
  stdDev:     number;
  p10:        number;
  p50:        number;
  p80:        number;
  p90:        number;
  /** Full curve at 5% steps, for charting. */
  curve:      SCurvePoint[];
  /** Contingency needed to reach `targetP`, over the deterministic base. */
  targetP:            number;
  contingencyAtTarget: number;
  contingencyPctAtTarget: number;
  /** Lines ranked by contribution to total variance — where the risk
   *  actually is, which is usually not where people assume. */
  drivers: { id: string; name: string; contributionPct: number }[];
}

/* ───────────────────────────────────────────────────────────────
   ESCALATION
   ─────────────────────────────────────────────────────────────── */

export interface EscalationSettings {
  /** Annual escalation rate, %. 0 disables. */
  annualPct:      number;
  /** Periods per year — 12 monthly, 4 quarterly, 1 annual. Converts the
   *  annual rate to a per-period compounding rate. */
  periodsPerYear: number;
  /** 1-based period priced at today's money. Earlier periods are not
   *  de-escalated; later ones compound from here. */
  basePeriod:     number;
}

export interface EscalationBreakdown {
  applied:      boolean;
  totalUplift:  number;
  byPeriod:     { period: number; factor: number; uplift: number }[];
}

export interface BudgetSettings {
  projectName:   string;
  projectType:   ProjectType;
  currency:      string;   // ISO 4217
  periods:       number;   // number of months/phases
  periodLabel:   string;   // "Month" | "Quarter" | "Phase"
  overheadPct:   number;   // % of direct costs
  contingencyPct:number;   // % of (direct + overhead)
  taxPct:        number;   // % applied to taxable base
  taxOnOverhead: boolean;
  /**
   * When true, contingency is sized from the Monte Carlo result at
   * `targetConfidence` instead of the flat `contingencyPct`. This is the
   * professional method: contingency should fall out of the risk profile,
   * not be picked because 10% sounds prudent.
   */
  useProbabilisticContingency?: boolean;
  /** Confidence level to budget at. 80 is the industry standard. */
  targetConfidence?: number;
  /** Correlation between line-item overruns, 0–1. Uncorrelated simulation
   *  understates spread badly (the central limit theorem cancels risk that
   *  in reality moves together). 0.2–0.4 is typical. */
  costCorrelation?:  number;
  /** Fixed so a re-run reproduces exactly. */
  simulationSeed?:   number;
  iterations?:       number;
  escalation?:       EscalationSettings;
  /** Overrides the published reference-class uplift, or supplies one where
   *  no published class fits. */
  optimismBiasPct?:  number;
}

/** Plan versus actual for one line. */
export interface LineVariance {
  id:          string;
  name:        string;
  category:    CostCategory;
  budgeted:    number;
  actual:      number;
  /** Positive = over budget. */
  variance:    number;
  variancePct: number;
  status:      "over" | "under" | "on-track";
}

export interface VarianceSummary {
  /** True once at least one line carries an actual. */
  tracked:        boolean;
  linesTracked:   number;
  budgetedOnTracked: number;
  actualOnTracked:   number;
  variance:       number;
  variancePct:    number;
  /** Lines over budget, worst first. */
  overruns:       LineVariance[];
  /** Every tracked line, worst variance first. */
  lines:          LineVariance[];
  /**
   * Grand total projected forward if the current overrun rate holds across the
   * untracked lines too. Null until enough of the budget is tracked to mean
   * anything.
   */
  projectedTotal: number | null;
}

export interface BudgetSettings {
  projectName:   string;
  projectType:   ProjectType;
  currency:      string;   // ISO 4217
  periods:       number;   // number of months/phases
  periodLabel:   string;   // "Month" | "Quarter" | "Phase"
  overheadPct:   number;   // % of direct costs
  contingencyPct:number;   // % of (direct + overhead)
  taxPct:        number;   // % applied to taxable base
  taxOnOverhead: boolean;
}

export interface CategoryRollup {
  category:  CostCategory;
  subtotal:  number;
  pctOfDirect: number;
  itemCount: number;
}

export interface BudgetTotals {
  /** Direct costs BEFORE escalation, in base-period money. */
  baseDirectCosts: number;
  /** Uplift from escalating phased costs to their own period's prices. */
  escalation:   number;
  /** Direct costs after escalation — what everything else loads onto. */
  directCosts:  number;
  overhead:     number;
  contingency:  number;
  /** Share of contingency attributable to direct costs, kept separate so
   *  `taxOnOverhead: false` can exclude the overhead-derived remainder
   *  instead of silently taxing it. */
  contingencyOnDirect: number;
  /** Reference-class (optimism bias) uplift. 0 when no published class
   *  applies and the user has not set one. */
  optimismUplift: number;
  taxableBase:  number;
  tax:          number;
  grandTotal:   number;
}

export interface PeriodBreakdown {
  period: number;
  label:  string;
  direct: number;
  /** Overhead/contingency/tax spread pro-rata against this period's direct spend. */
  loaded: number;
}

export interface ComputedBudget {
  settings:    BudgetSettings;
  lineItems:   LineItem[];
  categories:  CategoryRollup[];
  totals:      BudgetTotals;
  periods:     PeriodBreakdown[];
  /** AACE 18R-97 class and the honest accuracy range that goes with it. */
  classification: EstimateClassification;
  /** Probabilistic cost risk. `ran: false` when no line carries a range. */
  simulation:  SimulationResult;
  /** Optimism-bias uplift actually applied, and why. */
  referenceClass: ReferenceClassUplift;
  escalation:  EscalationBreakdown;
  /** Plan versus actual. `tracked: false` until actuals are entered. */
  variance:    VarianceSummary;
  /** Non-blocking data-quality warnings surfaced to the user. */
  warnings:    string[];
}
