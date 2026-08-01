import { MODULE_REGISTRY } from "./moduleRegistry";

/**
 * What to run next, and why.
 *
 * A finding is only worth surfacing if the reader can act on it. Most findings
 * in this product are actionable in another tool — a margin problem located in
 * Cost Optimization is decided in Predictive Foresight, a succession gap found
 * in Succession Pipeline is planned in Career Pathing. Without these links a
 * user finishes a run, learns something, and has nowhere obvious to go.
 *
 * Each handoff states the reason in the user's terms, so the suggestion reads
 * as a next step rather than an advertisement for another page.
 */

export interface Handoff {
  /** Module id of the tool to run next. */
  to:     string;
  /** Route to it. */
  href:   string;
  /** Why this follows from what was just found. Second person, no hedging. */
  reason: string;
}

const HANDOFFS: Record<string, Handoff[]> = {
  /* ── Finance ─────────────────────────────────────────────── */
  F01: [
    { to: "F04", href: "/f04-cost-optimization",
      reason: "You can see the totals. Find which cost lines are growing faster than your revenue." },
    { to: "F02", href: "/f02-budgeting-forecasting",
      reason: "Turn this position into a costed plan for the next period." },
  ],
  F04: [
    { to: "Q46", href: "/q46-predictive-foresight",
      reason: "You know where the cost is. Compare your options for cutting it by expected value." },
    { to: "F02", href: "/f02-budgeting-forecasting",
      reason: "Build the corrected budget on these figures." },
  ],
  F02: [
    { to: "F04", href: "/f04-cost-optimization",
      reason: "Check the plan against where your cost is actually leaking." },
    { to: "F05", href: "/f05-enterprise-value",
      reason: "See what this plan does to what your business is worth." },
  ],
  F05: [
    { to: "F04", href: "/f04-cost-optimization",
      reason: "Margin is the fastest lever on valuation. Find the cost line to move first." },
  ],

  /* ── Grow / cadence ──────────────────────────────────────── */
  R14: [
    { to: "R25", href: "/r25-root-cause-of-cadence-issues",
      reason: "You have the symptom. Trace it to the dependency or overload behind it." },
    { to: "R05", href: "/r05-workload-balance-monitor",
      reason: "Check whether the pace problem is really a load problem." },
  ],
  R03: [
    { to: "R25", href: "/r25-root-cause-of-cadence-issues",
      reason: "Drift is the signal, not the cause. Find what is actually slipping." },
  ],
  R05: [
    { to: "A21", href: "/a21-succession-pipeline",
      reason: "If the same teams are always overloaded, check who else could carry the work." },
  ],
  P01: [
    { to: "P21", href: "/p21-process-optimisation",
      reason: "You have located the stalls. Take the waits and approvals out of them." },
    { to: "R05", href: "/r05-workload-balance-monitor",
      reason: "Check whether the stall is a process problem or a capacity one." },
  ],

  /* ── Talent ──────────────────────────────────────────────── */
  A21: [
    { to: "A25", href: "/a25-career-pathing",
      reason: "You know which roles have nobody behind them. Build the path that fills them." },
    { to: "A15", href: "/a15-capability-uplift",
      reason: "Close the capability gap that is keeping your bench thin." },
  ],
  A25: [
    { to: "A15", href: "/a15-capability-uplift",
      reason: "Turn these pathways into the specific skills to build next." },
  ],
  A26: [
    { to: "A21", href: "/a21-succession-pipeline",
      reason: "Readiness depends on cover. Check which critical roles have a successor." },
  ],

  /* ── Core / decisions ────────────────────────────────────── */
  Q46: [
    { to: "F02", href: "/f02-budgeting-forecasting",
      reason: "You have chosen. Cost the option you picked before you commit to it." },
    { to: "Q59", href: "/q59-outcome-range-assessment",
      reason: "See the spread between your best and worst case on this decision." },
  ],
  Q59: [
    { to: "Q46", href: "/q46-predictive-foresight",
      reason: "You know the range. Compare your options by expected value net of cost." },
  ],
  S03: [
    { to: "S09", href: "/s09-strategic-priority-weighting",
      reason: "Contradictions usually mean unranked priorities. Weight them." },
  ],

  /* ── Protection ──────────────────────────────────────────── */
  X03: [
    { to: "Q98", href: "/q98-decision-authority-matrix",
      reason: "Governance gaps are usually authority gaps. Set out who can approve what." },
  ],
  X06: [
    { to: "A21", href: "/a21-succession-pipeline",
      reason: "Resilience fails at single points of dependency. Find yours in the roster." },
  ],
};

/** Suggested next tools for a module, resolved against the registry. */
export function handoffsFor(moduleId: string): (Handoff & { name: string })[] {
  const list = HANDOFFS[moduleId] ?? [];
  return list
    .map((h) => {
      const cfg = MODULE_REGISTRY[h.to];
      return cfg ? { ...h, name: cfg.engineName } : null;
    })
    .filter((h): h is Handoff & { name: string } => h !== null);
}
