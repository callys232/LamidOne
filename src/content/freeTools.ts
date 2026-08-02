/**
 * Free tools — the top of the funnel, an SEO surface, and a live demo
 * of the engines all in one build.
 *
 * GATING RULE: every tool is fillable by anyone, no account — but the
 * computed RESULT always requires signing up (or upgrading, if the
 * engine needs a paid tier). Same "fill free, gate the result" pattern
 * as /diagnostics/[code], which is what these route to; the earlier
 * verdict/asset split that let a handful of tools show a result with
 * no account at all has been deliberately removed.
 *
 * Each tool is a thin free tier over an engine that already exists —
 * no new computation, just a reduced input surface. `engineCode` is
 * what actually makes that true: when set, the tool routes to a real,
 * live diagnostic; when null, the tool is listed honestly as not yet
 * wired to a live computation rather than dead-ending at a sign-up
 * page with nothing behind it.
 */

export type FreeTool = {
  slug: string;
  name: string;
  what: string;
  /** The engine this is a reduced tier of, for display. */
  poweredBy: string;
  suite: string;
  minutes: number;
  /** Real, registered module code this tool runs — routes to
   *  /diagnostics/{engineCode}. "budget" is the special case that
   *  routes to the dedicated /diagnostics/budget calculator instead.
   *  null = not wired to a live engine yet. */
  engineCode: string | null;
  /** Set only for tools that are a link to a resource, not a
   *  computed result (e.g. LAMID LEARN's template library) — these
   *  skip the fill/gate pattern entirely since there's no "result". */
  externalHref?: string;
};

export const FREE_TOOLS: FreeTool[] = [
  {
    slug: "decision-clarity",
    name: "Decision clarity check",
    what: "Five questions that score how well-formed a decision is before you take it into the room.",
    poweredBy: "Q44 — Decision Clarity Score",
    suite: "core",
    minutes: 3,
    engineCode: "q44",
  },
  {
    slug: "operating-rhythm",
    name: "Operating rhythm scorecard",
    what: "Find the tempo your teams actually deliver at, and where it drifts from the plan.",
    poweredBy: "R01 — Cadence Mapping",
    suite: "core",
    minutes: 5,
    engineCode: "r01",
  },
  {
    slug: "margin-check",
    name: "Margin direction check",
    what: "Enter two periods and see whether any cost line is outrunning your revenue.",
    poweredBy: "F04 — Cost Optimization Diagnostic",
    suite: "finance",
    minutes: 4,
    engineCode: "f04",
  },
  {
    slug: "budget-estimator",
    name: "Budget estimator",
    what: "Build a costed project budget with overhead, contingency and tax — and export the working.",
    poweredBy: "F02 — Budgeting & Forecasting",
    suite: "finance",
    minutes: 10,
    engineCode: "budget",
  },
  {
    slug: "bench-strength",
    name: "Bench strength snapshot",
    what: "Score succession cover across your critical roles and export the gap list.",
    poweredBy: "A22 — Leadership Bench Strength",
    suite: "talent",
    minutes: 12,
    engineCode: "a22",
  },
  {
    slug: "visibility-check",
    name: "AI visibility check",
    what: "See how AI assistants describe your firm when a buyer asks about your sector.",
    poweredBy: "LAMID SIGNAL",
    suite: "signal",
    minutes: 2,
    engineCode: null,
  },
  {
    slug: "brief-builder",
    name: "Engagement brief builder",
    what: "Turn a problem statement into a scoped brief you can send to experts.",
    poweredBy: "Scribe — proposal drafting agent",
    suite: "market",
    minutes: 8,
    engineCode: null,
  },
  {
    slug: "templates",
    name: "Template library",
    what: "Decision records, budget models, cadence reviews and engagement briefs.",
    poweredBy: "LAMID LEARN",
    suite: "learn",
    minutes: 1,
    engineCode: null,
    externalHref: "https://learn-by-lamid.vercel.app",
  },
];

export const LIVE_TOOLS = FREE_TOOLS.filter((t) => t.engineCode);
