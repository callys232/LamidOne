import type { PrimarySuite } from "./aios";

/**
 * MODULE MICROCOPY — the words the product itself speaks.
 *
 * Everything else from the brand document is marketing prose that lives
 * on a page. This is the opposite: buttons, tooltips, labels, empty
 * states and the two sentences a user sees when a run succeeds or
 * fails. It is the last substantial block of that document still
 * unimplemented, and the only one that belongs in the app rather than
 * on the site.
 *
 * WHY IT MATTERS MORE THAN THE MARKETING COPY. A visitor reads the
 * homepage once. A customer reads "No insights yet — run a diagnostic
 * to reveal clarity" every time they open an empty suite. Microcopy is
 * where a brand voice is actually kept or lost, and it is normally the
 * part written ad-hoc at the moment a component needs a string.
 *
 * ── ONE INFERENCE, STATED ──
 * The document lists five buttons per module but never names the slots
 * they fill, and the four lists are not parallel — CORE opens with
 * "Reveal Insights", GROW with "Build Pathway". Rendering them as an
 * unkeyed array would make them undisplayable in any real component, so
 * the five keys below are assigned by matching the verb each label
 * performs. The STRINGS are the document's, unaltered; only the keys
 * are mine.
 *
 * `run` is the one that carries weight: it is the primary compute
 * action, and it is the label the diagnostic runner uses per suite.
 */

export type ModuleMicrocopy = {
  buttons: {
    /** The primary compute action. Costs points; charged on completion. */
    run: string;
    /** Act on what the run produced. */
    advance: string;
    /** Open a narrower view of the result. */
    inspect: string;
    /** Watch a measure over time. */
    track: string;
    /** Open the artefact the suite produced. */
    open: string;
  };
  /** Term → what it means. Attached to the labels below where shown. */
  tooltips: { term: string; body: string }[];
  /** The suite's own nouns, as the document names them. */
  labels: string[];
  /** Confirmations after a state change. Present tense, no exclamation. */
  interactions: string[];
  /** Shown when the suite has nothing to display yet. */
  emptyState: string;
  success: string;
  error: string;
};

export const MODULE_MICROCOPY: Record<PrimarySuite["id"], ModuleMicrocopy> = {
  core: {
    buttons: {
      run: "Run Diagnostic",
      advance: "Reveal Insights",
      inspect: "View Blind Spots",
      track: "Generate Clarity Map",
      open: "Open CORE Report",
    },
    tooltips: [
      { term: "Diagnostic Node", body: "This node represents a diagnostic signal detected by CORE." },
      { term: "Blind Spot", body: "Blind spots are areas where performance drivers are hidden." },
      { term: "Insight Stream", body: "Insight streams show how patterns emerge across the organisation." },
      { term: "Clarity Map", body: "Clarity Map organises strategic priorities in real time." },
    ],
    labels: ["Diagnostic Node", "Insight Stream", "Blind Spot", "Clarity Map", "Priority Driver"],
    interactions: ["New insight detected.", "Blind spot revealed.", "Diagnostic updated."],
    emptyState: "No insights yet — run a diagnostic to reveal clarity.",
    success: "Diagnostic complete — clarity generated.",
    error: "Signal interruption — unable to complete diagnostic.",
  },

  grow: {
    buttons: {
      run: "Build Pathway",
      advance: "Accelerate Movement",
      inspect: "Sync Teams",
      track: "Track Momentum",
      open: "Open Transformation Flow",
    },
    tooltips: [
      { term: "Transformation Pathway", body: "Pathways show how strategy becomes coordinated execution." },
      { term: "Execution Stream", body: "Execution streams represent synchronised team movement." },
      { term: "Momentum Indicator", body: "Momentum indicators track transformation velocity." },
      { term: "Alignment Score", body: "Alignment score shows cross-functional coherence." },
    ],
    labels: ["Transformation Pathway", "Execution Stream", "Momentum Indicator", "Alignment Score", "Movement Flow"],
    interactions: ["Pathway updated.", "Execution synchronised.", "Momentum increased."],
    emptyState: "No pathways yet — start by selecting a strategic priority.",
    success: "Pathway created — execution synchronised.",
    error: "Unable to generate pathway — missing clarity input.",
  },

  talent: {
    buttons: {
      run: "Map Capability",
      advance: "Accelerate Skills",
      inspect: "Strengthen Workforce",
      track: "View Leadership Pipeline",
      open: "Open Capability Profile",
    },
    tooltips: [
      { term: "Capability Ring", body: "Capability rings represent workforce strength and gaps." },
      { term: "Skill Acceleration", body: "Skill acceleration shows targeted development flows." },
      { term: "Leadership Node", body: "Leadership nodes highlight emerging leaders." },
      { term: "Readiness Score", body: "Readiness score reflects workforce transformation alignment." },
    ],
    labels: ["Capability Ring", "Skill Acceleration", "Leadership Node", "Readiness Score", "Capability Gap"],
    interactions: ["Capability updated.", "Skill accelerated.", "Leadership pipeline strengthened."],
    emptyState: "No capability data yet — begin by mapping workforce needs.",
    success: "Capability map updated — workforce strengthened.",
    error: "Unable to map capability — missing transformation input.",
  },

  finance: {
    buttons: {
      run: "Model Scenario",
      advance: "Reveal Financial Impact",
      inspect: "Optimize Capital",
      track: "View Performance Forecast",
      open: "Open Financial Foresight",
    },
    tooltips: [
      { term: "Forecast Curve", body: "Forecast curves show projected financial outcomes." },
      { term: "Scenario Simulation", body: "Scenario dots represent alternative futures." },
      { term: "Capital Flow", body: "Capital flow arrows indicate value-aligned investment." },
      { term: "Impact Score", body: "Impact score shows decision-level financial effect." },
    ],
    labels: ["Forecast Curve", "Scenario Simulation", "Capital Flow", "Impact Score", "Financial Strength"],
    interactions: ["Scenario modelled.", "Financial impact revealed.", "Capital allocation optimised."],
    emptyState: "No financial foresight yet — model a scenario to begin.",
    success: "Scenario complete — financial foresight generated.",
    error: "Unable to model scenario — missing OS intelligence input.",
  },
};

/**
 * Microcopy for a module code (Q44, G03, A22…), resolved through the
 * suite that owns it and then the primary suite that owns that suite.
 *
 * Returns null rather than a default for DOCUSHARE-backed or unmapped
 * codes: a wrong suite's voice is worse than the neutral string the
 * caller already has. Callers fall back rather than mis-attribute.
 */
export function microcopyForSuite(suiteId: string | undefined): ModuleMicrocopy | null {
  if (!suiteId) return null;
  return MODULE_MICROCOPY[suiteId as PrimarySuite["id"]] ?? null;
}
