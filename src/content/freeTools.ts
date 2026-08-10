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
  /**
   * The problem in the reader's own words — what they would type into a
   * search box at 11pm, not what the module is called.
   *
   * This is the field the homepage's diagnostic picker is built on. The
   * platform is a machine you bring a problem to; leading with module
   * names asks the reader to already know which engine answers theirs,
   * which is exactly backwards.
   */
  symptom: string;
  /**
   * The business data the user supplies. Named precisely, because this
   * is the half of the transaction that is easy to hide behind a verb —
   * "run a diagnostic" tells nobody that they need two periods of cost
   * lines to hand before they start.
   */
  inputs: string;
  /**
   * What the engine computes from it. An artefact, never "insights".
   *
   * THE RULE, because three entries broke it: nothing named in `inputs`
   * may reappear here. The homepage renders the two side by side under
   * "You enter" and "It computes", so they are read against each other,
   * and a term appearing in both columns shows the engine returning its
   * own input — which reads as no arithmetic having happened at all.
   *
   * `margin-check` is the reference pair: "two periods of revenue and
   * cost lines" in, "WHICH cost line is outrunning revenue" out. The
   * output is a thing the input demonstrably is not.
   */
  answers: string;
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
  /** An in-app destination for a tool whose real implementation is a
   *  PAGE rather than a registered module. Distinct from engineCode
   *  (which routes to /diagnostics/{code}) and from externalHref
   *  (which leaves the site). Using engineCode for these would claim a
   *  module that does not exist; leaving them null would list a live
   *  capability as "coming soon". */
  toolHref?: string;
};

export const FREE_TOOLS: FreeTool[] = [
  {
    slug: "decision-clarity",
    symptom: "We keep re-opening decisions nobody actually owns.",
    /* `inputs` and `answers` are rendered side by side on the homepage
       under "You enter" and "It computes", so they are read AGAINST each
       other. The pair therefore has one rule: nothing named in `inputs`
       may reappear in `answers`. This entry used to list owner,
       evidence and reversibility on BOTH sides, which showed the engine
       handing back its own input — the exact opposite of the claim the
       section makes. The enumeration stays on the input side, where it
       tells a reader what they need to be able to answer; the output
       side names the verdict, which is the part that is computed. */
    inputs: "The decision itself, answered against four fixed requirements — owner, evidence, reversibility, consequence.",
    answers: "A clarity score out of 100, and which of the four requirements is the one failing it.",
    name: "Decision clarity check",
    what: "Five questions that score how well-formed a decision is before you take it into the room.",
    poweredBy: "Q44 — Decision Clarity Score",
    suite: "core",
    minutes: 3,
    engineCode: "q44",
  },
  {
    slug: "operating-rhythm",
    symptom: "Everyone is busy and the plan has not moved.",
    /* Same correction as decision-clarity: the input already IS "the
       tempo you actually run at", so returning it was no answer. The
       computed part is the gap between the two tempos and which team
       owns the worst of it. */
    inputs: "Your delivery cadence per team: the tempo the plan assumes, against the tempo you actually run at.",
    answers: "The size of the gap between the two, team by team, and which team is furthest out.",
    name: "Operating rhythm scorecard",
    what: "Find the tempo your teams actually deliver at, and where it drifts from the plan.",
    poweredBy: "R01 — Cadence Mapping",
    suite: "core",
    minutes: 5,
    engineCode: "r01",
  },
  {
    slug: "margin-check",
    symptom: "Revenue is up. Margin is not.",
    inputs: "Two periods of revenue and cost lines.",
    answers: "Which cost line is outrunning revenue, period against period.",
    name: "Margin direction check",
    what: "Enter two periods and see whether any cost line is outrunning your revenue.",
    poweredBy: "F04 — Cost Optimization Diagnostic",
    suite: "finance",
    minutes: 4,
    engineCode: "f04",
  },
  {
    slug: "budget-estimator",
    symptom: "Nobody can say what this project really costs.",
    /* "Overhead, contingency and tax" was listed on both sides. They
       are RATES going in and MONEY coming out, but printed twice in the
       same words the difference is invisible — so the output side now
       says what the reader actually leaves with. */
    inputs: "Your cost lines — quantities, unit costs and periods — plus overhead, contingency and tax rates.",
    answers: "A defensible total, with every line of the working shown and exportable.",
    name: "Budget estimator",
    what: "Build a costed project budget with overhead, contingency and tax — and export the working.",
    poweredBy: "F02 — Budgeting & Forecasting",
    suite: "finance",
    minutes: 10,
    engineCode: "budget",
  },
  {
    /* GROW was the only engine suite with no tool listed here, despite
       having the most substantial engine on the platform. G03 has been
       live at /diagnostics/g03 with a full runner since the port — it
       was simply reachable from nowhere except the GROW suite page. */
    slug: "growth-pathways",
    symptom: "We have five growth ideas and capacity for two.",
    inputs: "Your candidate growth options, each rated on market pull, capability fit, investment and months to revenue — plus how many you can resource.",
    answers: "A sequenced portfolio you can resource, with what was deferred and why.",
    name: "Growth pathway sequencer",
    what: "Compare the growth options in front of you and get a sequenced portfolio you can resource — with what was deferred, and why.",
    poweredBy: "G03 — Growth Pathways",
    suite: "grow",
    minutes: 8,
    engineCode: "g03",
  },
  {
    slug: "bench-strength",
    symptom: "If one key person left tomorrow, we would be stuck.",
    inputs: "Your critical seats, how much notice you would get, and who is behind each one and how soon.",
    answers: "Cover per critical seat, and the seats with nobody ready inside your notice period.",
    name: "Bench strength snapshot",
    what: "Score succession cover across your critical roles and export the gap list.",
    poweredBy: "A22 — Leadership Bench Strength",
    suite: "talent",
    minutes: 12,
    engineCode: "a22",
  },
  {
    slug: "visibility-check",
    symptom: "Buyers cannot find us, or AI describes us wrongly.",
    inputs: "Your firm and the sector a buyer would search in.",
    answers: "How AI assistants answer when a buyer asks about your sector.",
    name: "AI visibility check",
    what: "See how AI assistants describe your firm when a buyer asks about your sector.",
    poweredBy: "LAMID SIGNAL",
    suite: "signal",
    minutes: 2,
    engineCode: null,
  },
  {
    /* Was listed as "coming soon" and attributed to Scribe — a persona
       over a generic completion. The real, shipped capability behind
       this is deterministic weighted matching against actual expert
       records (lib/matching.ts), which is what /experts runs. Pointed
       at that rather than at an agent that would have written prose
       about a shortlist instead of computing one. */
    slug: "brief-builder",
    symptom: "We need a specialist and do not know who.",
    inputs: "The disciplines the work actually needs.",
    answers: "Experts scored against your brief on discipline, rating, reliability and verification.",
    name: "Expert shortlist from a brief",
    what: "Describe the problem and get experts scored against it on discipline overlap, rating, reliability and verification — a ranked shortlist, not a directory.",
    poweredBy: "Compass — deterministic matching, no model in the loop",
    suite: "market",
    minutes: 5,
    engineCode: null,
    toolHref: "/experts",
  },
  {
    slug: "templates",
    symptom: "We rebuild the same documents every time.",
    inputs: "Nothing — this one is a library, not a computation.",
    answers: "Decision records, budget models, cadence reviews and engagement briefs.",
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

/**
 * Everything a visitor can actually run right now — an engine, a
 * dedicated calculator, or a real page. Excludes anything not yet wired
 * to a computation, because a diagnostic picker that offers a dead
 * option is worse than a shorter list.
 */
export const RUNNABLE_TOOLS = FREE_TOOLS.filter((t) => t.engineCode || t.toolHref);
