/**
 * Typed input specs for intelligence modules.
 *
 * Modules that declare `inputs` render a structured form instead of the generic
 * six-field narrative one. Modules that omit it are unchanged — this is additive.
 */

export type SeriesTrend = "rising" | "falling" | "flat" | "volatile";

/** A metric tracked across periods — the core of Archetype B. */
export interface SeriesMetric {
  key:    string;
  label:  string;
  unit:   string;          // "%", "days", "count", "hrs"
  hint?:  string;
  /** Sensible starting values so the form is never empty on first load. */
  sample?: number[];
  /**
   * Which direction is good. Without this a trend is only a description —
   * "cycle time rising" and "on-time rate rising" mean opposite things.
   */
  betterWhen: "higher" | "lower";
  /** Default target, editable per run. A trend with no target cannot be judged. */
  target?: number;
}

export interface TimeSeriesInputSpec {
  kind:        "timeseries";
  periodLabel: string;     // "Week" | "Month" | "Sprint" | "Quarter"
  periods:     number;     // default count
  metrics:     SeriesMetric[];
}

export interface FinancialInputSpec {
  kind:        "financial";
  periodLabel: string;
  periods:     number;
}

export interface RosterInputSpec {
  kind: "roster";
}

export interface ScenarioInputSpec {
  kind: "scenario";
}

export interface NarrativeInputSpec {
  kind: "narrative";       // the existing six-field form
}

/**
 * Archetype G — the module's own dimensions, rated with evidence.
 *
 * Fits any module whose output is a set of scored dimensions but which has no
 * measurable series, roster or ledger behind it. The dimensions come from the
 * registry entry, so the thing being scored is the thing the module claims to
 * assess rather than a generic questionnaire.
 */
export interface AssessmentInputSpec {
  kind: "assessment";
  /** Falls back to the module's dimensionLabels when omitted. */
  dimensions?: string[];
}

export type ModuleInputSpec =
  | TimeSeriesInputSpec
  | FinancialInputSpec
  | RosterInputSpec
  | ScenarioInputSpec
  | AssessmentInputSpec
  | NarrativeInputSpec;

/** A-Series modules that assess workforce STRUCTURE rather than sentiment. */
export const ROSTER_MODULES = new Set([
  "A02","A03","A04","A06","A21","A22","A24","A25","A26","A28","A30","A31",
]);

/** Q-Series modules that model discrete CHOICES rather than capability. */
export const SCENARIO_MODULES = new Set([
  "Q05","Q24","Q46","Q59","Q60","Q61","Q69",
]);

/* ── Derived statistics — computed in TypeScript, never by the model ── */

export interface SeriesStats {
  key:        string;
  label:      string;
  unit:       string;
  values:     number[];
  first:      number;
  last:       number;
  min:        number;
  max:        number;
  mean:       number;
  /** Percent change first → last. */
  changePct:  number;
  /** Mean absolute period-over-period swing, as % of mean. */
  volatility: number;
  trend:      SeriesTrend;

  /* ── Target comparison. Present only when a target was supplied. ── */
  betterWhen: "higher" | "lower";
  target:     number | null;
  /** Signed distance from target as a percentage. Positive = better than target. */
  targetGapPct: number | null;
  /** True when the latest value is on the right side of the target. */
  onTarget:   boolean | null;
  /**
   * 0–100 attainment against the target, direction-aware. Null without a target.
   * Capped at 100 — beating a target does not earn more than full marks.
   */
  attainment: number | null;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

export function computeSeriesStats(
  metric: SeriesMetric,
  values: number[],
  /** Overrides metric.target for this run. */
  targetOverride?: number | null,
): SeriesStats {
  const clean = values.filter((v) => Number.isFinite(v));
  const n = clean.length;
  const target =
    targetOverride !== undefined && targetOverride !== null && Number.isFinite(targetOverride)
      ? targetOverride
      : metric.target ?? null;

  if (n === 0) {
    return {
      key: metric.key, label: metric.label, unit: metric.unit, values: [],
      first: 0, last: 0, min: 0, max: 0, mean: 0,
      changePct: 0, volatility: 0, trend: "flat",
      betterWhen: metric.betterWhen, target,
      targetGapPct: null, onTarget: null, attainment: null,
    };
  }

  const first = clean[0];
  const last  = clean[n - 1];
  const min   = Math.min(...clean);
  const max   = Math.max(...clean);
  const mean  = clean.reduce((a, b) => a + b, 0) / n;

  const changePct = first !== 0 ? round1(((last - first) / Math.abs(first)) * 100) : 0;

  // Mean absolute period-over-period delta, normalised against the mean.
  let deltaSum = 0;
  for (let i = 1; i < n; i++) deltaSum += Math.abs(clean[i] - clean[i - 1]);
  const meanDelta  = n > 1 ? deltaSum / (n - 1) : 0;
  const volatility = mean !== 0 ? round1((meanDelta / Math.abs(mean)) * 100) : 0;

  // Volatility dominates: a metric swinging wildly isn't "rising" in any useful sense.
  let trend: SeriesTrend;
  if (volatility > 25)        trend = "volatile";
  else if (changePct > 5)     trend = "rising";
  else if (changePct < -5)    trend = "falling";
  else                        trend = "flat";

  /* ── Target attainment, direction-aware ──
     For "higher is better", attainment is last/target. For "lower is better"
     it inverts: hitting 10 days against a 12-day target scores above 100 and
     is capped. A zero target is meaningless, so it is treated as absent. */
  let targetGapPct: number | null = null;
  let onTarget:     boolean | null = null;
  let attainment:   number | null = null;

  if (target !== null && target !== 0) {
    const raw = metric.betterWhen === "higher" ? last / target : target / last;
    if (Number.isFinite(raw)) {
      attainment   = round1(Math.max(0, Math.min(100, raw * 100)));
      onTarget     = metric.betterWhen === "higher" ? last >= target : last <= target;
      targetGapPct = round1(((last - target) / Math.abs(target)) * 100 * (metric.betterWhen === "higher" ? 1 : -1));
    }
  }

  return {
    key: metric.key, label: metric.label, unit: metric.unit,
    values: clean, first, last, min, max,
    mean: round1(mean), changePct, volatility, trend,
    betterWhen: metric.betterWhen, target, targetGapPct, onTarget, attainment,
  };
}

/** Compact, deterministic summary the model reads instead of raw numbers. */
export function seriesStatsToPrompt(stats: SeriesStats[], periodLabel: string): string {
  return stats
    .map((s) => {
      const dir =
        s.trend === "rising"   ? `up ${s.changePct}%` :
        s.trend === "falling"  ? `down ${Math.abs(s.changePct)}%` :
        s.trend === "volatile" ? `volatile (${s.volatility}% mean swing)` :
                                 "flat";
      const vsTarget =
        s.target !== null && s.attainment !== null
          ? ` Target ${s.target}${s.unit} — currently ${s.onTarget ? "met" : "missed"} (${s.attainment}% attainment, ${s.targetGapPct! >= 0 ? "+" : ""}${s.targetGapPct}% vs target).`
          : "";
      return `• ${s.label}: ${s.first}${s.unit} → ${s.last}${s.unit} over ${s.values.length} ${periodLabel.toLowerCase()}s — ${dir}. Range ${s.min}–${s.max}${s.unit}, mean ${s.mean}${s.unit}.${vsTarget}`;
    })
    .join("\n");
}

/* ── Shared metric sets ─────────────────────────────────────────────── */

/** R-Series — cadence, rhythm, operating tempo. */
export const CADENCE_METRICS: SeriesMetric[] = [
  { key: "cycleTime",   label: "Delivery cycle time",     unit: " days", hint: "Idea to shipped",             sample: [14, 13, 15, 12, 11, 12], betterWhen: "lower",  target: 10 },
  { key: "onTimeRate",  label: "On-time completion rate", unit: "%",     hint: "Committed work delivered",    sample: [72, 75, 71, 78, 82, 80], betterWhen: "higher", target: 85 },
  { key: "meetingLoad", label: "Hours in meetings / person / week", unit: " hrs", hint: "Coordination overhead", sample: [12, 13, 15, 14, 16, 17], betterWhen: "lower", target: 10 },
];

/** P-Series — throughput, productivity, flow. */
export const PRODUCTIVITY_METRICS: SeriesMetric[] = [
  { key: "throughput",  label: "Completed units of work", unit: " items", hint: "Tickets, deliverables, cases", sample: [42, 45, 41, 48, 52, 50], betterWhen: "higher", target: 55 },
  { key: "reworkRate",  label: "Rework / defect rate",    unit: "%",      hint: "Work redone after delivery",   sample: [18, 16, 19, 14, 12, 13], betterWhen: "lower",  target: 10 },
  // Utilisation above ~85% queues work rather than completing it, so the target is a band, not a maximum.
  { key: "utilisation", label: "Capacity utilisation",    unit: "%",      hint: "Productive vs available time", sample: [68, 71, 74, 79, 84, 88], betterWhen: "higher", target: 85 },
];
