import { MODULE_REGISTRY } from "@/lib/intelligence/moduleRegistry";

/**
 * THE COMPUTATION METHODS.
 *
 * Why this file exists: the platform was selling a COUNT — "247
 * modules", "194 CORE engines", "~400 engine routes" — and the count
 * invites the one discovery that undermines it. Nine of every ten
 * modules run the same evidence-weighted assessment with different
 * question labels. A buyer who runs three of them notices, and at that
 * point the number they were sold reads as padding rather than depth.
 *
 * The honest framing is stronger than the count anyway: this is a small
 * set of well-chosen methods applied across a lot of contexts. Nine
 * methods, each picked because the obvious alternative would have been
 * WRONG for that shape of question — and each of those reasons is a
 * real argument a buyer can check.
 *
 * `moduleCount` is COUNTED FROM THE REGISTRY, never typed. That is the
 * whole point: the previous framing drifted because counts were written
 * by hand in nine places. A method that stops being used drops to zero
 * here on its own.
 */

export type Method = {
  /** The registry `inputs.kind`, or "assessment" for the default. */
  kind: string;
  name: string;
  /** What it computes, in one line. */
  what: string;
  /** Why the obvious alternative would have been wrong. The argument. */
  whyNotAverage: string;
  /** Where the implementation lives, so the claim is checkable. */
  source: string;
};

export const METHODS: Method[] = [
  {
    kind: "decision-quality",
    name: "Chain-limited scoring",
    what: "Scores a decision against fixed, anchored requirements and reports the weakest link rather than the mean.",
    whyNotAverage:
      "A decision is a chain. Averaging lets a well-framed problem hide the fact that nobody owns the outcome — which is the exact failure the module exists to catch.",
    source: "lib/intelligence/decisionQuality.ts",
  },
  {
    kind: "growth-pathways",
    name: "Risk-adjusted portfolio sequencing",
    what: "Compares candidate growth options against each other and returns a sequenced portfolio inside a capacity constraint, with what was deferred and why.",
    whyNotAverage:
      "A score ranks you against yourself. A recommendation has to compare options, price the structural risk of each, and respect the fact that you cannot pursue all of them.",
    source: "lib/intelligence/growthPathways.ts",
  },
  {
    kind: "bench-strength",
    name: "Per-seat coverage",
    what: "Counts, for every critical seat, how many named successors could actually hold it inside the notice period you would get.",
    whyNotAverage:
      "Succession is coverage, not a score. Eight well-covered roles and two with nobody average to a healthy bench — and the two that will break the organisation vanish into the arithmetic.",
    source: "lib/intelligence/benchStrength.ts",
  },
  {
    kind: "scenario-decision",
    name: "Decision under uncertainty",
    what: "Evaluates options across possible futures under three decision rules, and prices what better information would be worth.",
    whyNotAverage:
      "A single expected value hides whether an option is robust or merely lucky. Three rules disagreeing is itself the finding.",
    source: "lib/intelligence/scenarioDecision.ts",
  },
  {
    kind: "roadmap",
    name: "Capacity-constrained sequencing",
    what: "Sequences initiatives into phases under their dependencies and a per-period capacity, and reports the critical path.",
    whyNotAverage:
      "A prioritised list is not a plan. Without dependencies and capacity it produces an order nobody can actually execute in.",
    source: "lib/intelligence/roadmap.ts",
  },
  {
    kind: "optimisation",
    name: "Constraint analysis",
    what: "Finds the step that sets throughput, and reports what improving anything else would actually buy you.",
    whyNotAverage:
      "Throughput is set by the constraint. Effort spent anywhere else is waste, and an average across steps conceals which step that is.",
    source: "lib/intelligence/optimisation.ts",
  },
  {
    kind: "selection",
    name: "Weighted choice with sensitivity",
    what: "Scores options against weighted criteria and reports how fragile the winner is to a change in those weights.",
    whyNotAverage:
      "A ranking without sensitivity looks decisive whether it is robust or one small weight change away from reversing.",
    source: "lib/intelligence/selector.ts",
  },
  {
    kind: "conflict",
    name: "Pairwise conflict detection",
    what: "Checks objectives against each other in pairs and surfaces the ones that cannot both be satisfied.",
    whyNotAverage:
      "Conflict is a property of pairs. No per-objective score can express it, however many objectives you score.",
    source: "lib/intelligence/conflict.ts",
  },
  {
    kind: "assessment",
    name: "Evidence-weighted assessment",
    what: "Rates a module's own declared dimensions, then discounts each rating by what actually backs it up and reports the gap between the two.",
    whyNotAverage:
      "This one IS a weighted mean — with the correction that matters. A dimension rated 5 with nothing to show for it is the most common failure of self-scoring, so it is discounted and reported rather than taken at face value.",
    source: "lib/intelligence/assessment.ts",
  },
];

/**
 * How many registered modules run each method. Counted, not typed.
 *
 * Everything without an explicit `inputs.kind` falls through to the
 * assessment archetype, so that is where the remainder lands — which is
 * the honest number and the one worth stating plainly.
 */
export function moduleCountsByMethod(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const m of Object.values(MODULE_REGISTRY)) {
    const kind = (m as { inputs?: { kind?: string } }).inputs?.kind ?? "assessment";
    counts[kind] = (counts[kind] ?? 0) + 1;
  }
  return counts;
}

export const TOTAL_MODULES = Object.keys(MODULE_REGISTRY).length;
