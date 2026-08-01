/**
 * Repairs and validates AI intelligence output before it reaches the client.
 *
 * The model is instructed to return an exact JSON shape, but LLM output drifts:
 * missing arrays, wrong element counts, scores as strings, renamed dimensions,
 * invalid severity values. Previously any of these crashed the result view at
 * render. This normalises what is recoverable and rejects what is not.
 */

export interface KPI       { label: string; value: string; trend: string }
export interface Signal    { severity: "High" | "Medium" | "Low"; title: string; action: string }
export interface Dimension { label: string; value: number; insight?: string }

export interface IntelligenceResult {
  executiveSummary:   string;
  kpis:               KPI[];
  signals:            Signal[];
  dimensions:         Dimension[];
  distortionIndex:    "Low" | "Medium" | "High";
  correctionPriority: string;
  correctionReason:   string;
  thirtyDayPlan:      string[];
  ninetyDayPlan:      string[];
}

export interface ValidationOutcome {
  ok:       boolean;
  result?:  IntelligenceResult;
  /** Fields the model got wrong that we repaired — useful for prompt tuning. */
  repaired: string[];
  reason?:  string;
}

const str = (v: unknown, max = 600): string =>
  typeof v === "string" ? v.trim().slice(0, max) : "";

const strArray = (v: unknown, max: number): string[] =>
  Array.isArray(v)
    ? v.map((x) => str(x, 300)).filter(Boolean).slice(0, max)
    : [];

/** Scores arrive as 72, "72", "72%", or "0.72". Coerce to an integer 0–100. */
function toScore(v: unknown): number | null {
  let n: number;
  if (typeof v === "number") n = v;
  else if (typeof v === "string") n = parseFloat(v.replace(/[^0-9.-]/g, ""));
  else return null;

  if (!Number.isFinite(n)) return null;
  if (n > 0 && n <= 1) n *= 100;           // model returned a fraction
  return Math.max(0, Math.min(100, Math.round(n)));
}

function toSeverity(v: unknown): "High" | "Medium" | "Low" {
  const s = String(v ?? "").toLowerCase();
  if (s.startsWith("h") || s.startsWith("crit")) return "High";
  if (s.startsWith("l") || s.startsWith("min"))  return "Low";
  return "Medium";
}

function toDistortion(v: unknown): "Low" | "Medium" | "High" {
  const s = String(v ?? "").toLowerCase();
  if (s.startsWith("h")) return "High";
  if (s.startsWith("l")) return "Low";
  return "Medium";
}

/**
 * @param raw             Parsed JSON from the model
 * @param dimensionLabels Canonical labels from the module config — these are the
 *                        source of truth, not whatever the model decided to call them.
 */
export function validateIntelligenceResult(
  raw: unknown,
  dimensionLabels: string[],
): ValidationOutcome {
  const repaired: string[] = [];

  if (!raw || typeof raw !== "object") {
    return { ok: false, repaired, reason: "Model returned no usable object." };
  }
  const r = raw as Record<string, unknown>;

  /* ── Executive summary — required, nothing to fall back to ── */
  const executiveSummary = str(r.executiveSummary, 1200);
  if (executiveSummary.length < 20) {
    return { ok: false, repaired, reason: "Missing or empty executive summary." };
  }

  /* ── KPIs — aim for 4 ── */
  let kpis: KPI[] = Array.isArray(r.kpis)
    ? r.kpis
        .map((k: any) => ({
          label: str(k?.label, 80),
          value: str(k?.value, 40),
          trend: str(k?.trend, 200),
        }))
        .filter((k) => k.label && k.value)
    : [];
  if (kpis.length === 0) {
    return { ok: false, repaired, reason: "No usable KPIs returned." };
  }
  if (kpis.length !== 4) {
    repaired.push(`kpis(${kpis.length}→4)`);
    kpis = kpis.slice(0, 4);
  }

  /* ── Signals — aim for 3 ── */
  let signals: Signal[] = Array.isArray(r.signals)
    ? r.signals
        .map((s: any) => ({
          severity: toSeverity(s?.severity),
          title:    str(s?.title, 200),
          action:   str(s?.action, 300),
        }))
        .filter((s) => s.title)
    : [];
  if (signals.length === 0) {
    return { ok: false, repaired, reason: "No usable signals returned." };
  }
  if (signals.length !== 3) {
    repaired.push(`signals(${signals.length}→3)`);
    signals = signals.slice(0, 3);
  }

  /* ── Dimensions — labels come from config, scores from the model ── */
  const modelDims = Array.isArray(r.dimensions) ? r.dimensions : [];
  const dimensions: Dimension[] = dimensionLabels.map((label, i) => {
    const d: any = modelDims[i] ?? {};
    const score = toScore(d?.value);
    if (score === null) repaired.push(`dimension[${i}].value`);
    // Label mismatches are silently corrected — config is authoritative.
    if (str(d?.label, 80) && str(d?.label, 80) !== label) repaired.push(`dimension[${i}].label`);
    return {
      label,
      value:   score ?? 50,
      insight: str(d?.insight, 240) || undefined,
    };
  });

  /* ── Plans — pad rather than fail; a short plan is still usable ── */
  let thirtyDayPlan = strArray(r.thirtyDayPlan, 6);
  let ninetyDayPlan = strArray(r.ninetyDayPlan, 6);
  if (thirtyDayPlan.length === 0) {
    return { ok: false, repaired, reason: "No 30-day plan returned." };
  }
  if (ninetyDayPlan.length === 0) {
    repaired.push("ninetyDayPlan(empty)");
    ninetyDayPlan = ["Review 30-day outcomes and reassess this dimension."];
  }

  const correctionPriority = str(r.correctionPriority, 160);
  if (!correctionPriority) repaired.push("correctionPriority");

  return {
    ok: true,
    repaired,
    result: {
      executiveSummary,
      kpis,
      signals,
      dimensions,
      distortionIndex:    toDistortion(r.distortionIndex),
      correctionPriority: correctionPriority || "Stabilisation",
      correctionReason:   str(r.correctionReason, 400) || "Derived from the assessment above.",
      thirtyDayPlan,
      ninetyDayPlan,
    },
  };
}
