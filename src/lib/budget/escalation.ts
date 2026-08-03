import type { LineItem, EscalationSettings, EscalationBreakdown } from "./types";

/**
 * ESCALATION — the time value of cost.
 *
 * A budget built at today's prices and spent over two years is wrong by
 * roughly two years of inflation, and wrong in one direction only. The
 * calculator previously phased cost across periods but escalated none
 * of it, so every multi-year budget was quietly priced as though the
 * whole programme happened on day one.
 *
 * This applies compound escalation from a stated base period. Costs at
 * or before the base period are untouched — they are already in
 * today's money; later periods compound forward.
 *
 * The rate is the user's own input, not a shipped index. Real
 * escalation indices (CPI, PPI, construction cost indices) are
 * regional, sector-specific and licensed, and a made-up default would
 * be a fabricated number applied to every line — exactly what this
 * codebase refuses to do elsewhere.
 */

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

/** Per-period compounding rate derived from an annual rate. */
export function periodRate(annualPct: number, periodsPerYear: number): number {
  const ppy = Math.max(1, Math.floor(periodsPerYear) || 1);
  return Math.pow(1 + annualPct / 100, 1 / ppy) - 1;
}

/** Escalation multiplier for a given 1-based period. */
export function escalationFactor(period: number, s: EscalationSettings): number {
  if (!s || !Number.isFinite(s.annualPct) || s.annualPct === 0) return 1;
  const base = Math.max(1, Math.floor(s.basePeriod) || 1);
  const p = Math.max(1, Math.floor(period) || 1);
  if (p <= base) return 1;
  return Math.pow(1 + periodRate(s.annualPct, s.periodsPerYear), p - base);
}

/**
 * Escalates every line to its own period's price level.
 *
 * Unphased lines are left at base-period prices rather than being
 * escalated by an assumed average. A cost with no date has no basis for
 * escalation, and guessing one would move money on an assumption the
 * user never made.
 */
export function applyEscalation(
  lineItems: LineItem[],
  lineTotalOf: (li: LineItem) => number,
  settings: EscalationSettings | undefined,
  periods: number,
): { escalatedTotalOf: (li: LineItem) => number; breakdown: EscalationBreakdown } {
  if (!settings || !settings.annualPct) {
    return {
      escalatedTotalOf: lineTotalOf,
      breakdown: { applied: false, totalUplift: 0, byPeriod: [] },
    };
  }

  const factorFor = (li: LineItem): number => {
    if (li.escalationExempt) return 1;               // fixed-price / already out-turn
    const p = Number(li.period);
    if (!p || p < 1) return 1;                       // unphased: no basis to escalate
    return escalationFactor(p, settings);
  };

  const escalatedTotalOf = (li: LineItem) => round2(lineTotalOf(li) * factorFor(li));

  const upliftByPeriod = new Map<number, number>();
  let totalUplift = 0;
  for (const li of lineItems) {
    const bare = lineTotalOf(li);
    const up = escalatedTotalOf(li) - bare;
    if (up === 0) continue;
    totalUplift += up;
    const p = Number(li.period) || 0;
    upliftByPeriod.set(p, (upliftByPeriod.get(p) ?? 0) + up);
  }

  const byPeriod = Array.from({ length: Math.max(0, periods) }, (_, i) => {
    const p = i + 1;
    return {
      period: p,
      factor: round2(escalationFactor(p, settings) * 100) / 100,
      uplift: round2(upliftByPeriod.get(p) ?? 0),
    };
  });

  return {
    escalatedTotalOf,
    breakdown: { applied: true, totalUplift: round2(totalUplift), byPeriod },
  };
}
