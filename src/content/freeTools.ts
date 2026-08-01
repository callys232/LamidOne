/**
 * Free tools — the top of the funnel, an SEO surface, and a live demo
 * of the engines all in one build.
 *
 * GATING RULE (teardown §7.3): gating tracks the VALUE OF WHAT THE USER
 * WALKS AWAY WITH, not the tool's cost to run.
 *   · Ungated when the output is a VERDICT you read and leave.
 *   · Gated when the output is an ASSET you want to keep.
 * A score you glance at is free. A generated document is worth an email
 * address.
 *
 * Each tool is a thin free tier over an engine that already exists —
 * no new computation, just a reduced input surface.
 */

export type FreeTool = {
  slug: string;
  name: string;
  what: string;
  /** The engine in ProdLamid this is a reduced tier of. */
  poweredBy: string;
  suite: string;
  gated: boolean;
  /** What the user leaves with. Drives the gating decision. */
  output: "verdict" | "asset";
  minutes: number;
};

export const FREE_TOOLS: FreeTool[] = [
  {
    slug: "decision-clarity",
    name: "Decision clarity check",
    what: "Five questions that score how well-formed a decision is before you take it into the room.",
    poweredBy: "q44-decision-clarity-score",
    suite: "core",
    gated: false,
    output: "verdict",
    minutes: 3,
  },
  {
    slug: "operating-rhythm",
    name: "Operating rhythm scorecard",
    what: "Find the tempo your teams actually deliver at, and where it drifts from the plan.",
    poweredBy: "r01-cadence-mapping",
    suite: "core",
    gated: false,
    output: "verdict",
    minutes: 5,
  },
  {
    slug: "visibility-check",
    name: "AI visibility check",
    what: "See how AI assistants describe your firm when a buyer asks about your sector.",
    poweredBy: "LAMID SIGNAL — answer-engine visibility",
    suite: "signal",
    gated: false,
    output: "verdict",
    minutes: 2,
  },
  {
    slug: "margin-check",
    name: "Margin direction check",
    what: "Enter two periods and see whether any cost line is outrunning your revenue.",
    poweredBy: "f04-cost-optimization",
    suite: "finance",
    gated: false,
    output: "verdict",
    minutes: 4,
  },
  {
    slug: "budget-estimator",
    name: "Budget estimator",
    what: "Build a costed project budget with overhead, contingency and tax — and export the working.",
    poweredBy: "f02-budgeting-forecasting · lib/budget/compute.ts",
    suite: "finance",
    gated: true,
    output: "asset",
    minutes: 10,
  },
  {
    slug: "bench-strength",
    name: "Bench strength snapshot",
    what: "Score succession cover across your critical roles and export the gap list.",
    poweredBy: "a22-bench-strength",
    suite: "talent",
    gated: true,
    output: "asset",
    minutes: 12,
  },
  {
    slug: "brief-builder",
    name: "Engagement brief builder",
    what: "Turn a problem statement into a scoped brief you can send to experts.",
    poweredBy: "Proposal Agent · api/ai/proposal",
    suite: "market",
    gated: true,
    output: "asset",
    minutes: 8,
  },
  {
    slug: "templates",
    name: "Template library",
    what: "Decision records, budget models, cadence reviews and engagement briefs.",
    poweredBy: "LAMID LEARN — template library",
    suite: "learn",
    gated: false,
    output: "verdict",
    minutes: 1,
  },
];

export const UNGATED = FREE_TOOLS.filter((t) => !t.gated);
export const GATED = FREE_TOOLS.filter((t) => t.gated);
