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
  budgetedToDate: number;
  actualToDate:   number;
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
  directCosts:  number;
  overhead:     number;
  contingency:  number;
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
  /** Plan versus actual. `tracked: false` until actuals are entered. */
  variance:    VarianceSummary;
  /** Non-blocking data-quality warnings surfaced to the user. */
  warnings:    string[];
}
