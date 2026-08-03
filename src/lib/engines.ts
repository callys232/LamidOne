import {
  getModuleConfig, buildFallbackConfig, MODULE_REGISTRY,
  type ModuleConfig,
} from "./intelligence/moduleRegistry";
import { FEATURE_MATRIX, type TierId } from "@/content/tiers";
import { computeAssessment, assessmentToPrompt, type AssessmentRow } from "./intelligence/assessment";
import { computeDecisionQuality, decisionQualityToPrompt } from "./intelligence/decisionQuality";
import { computeGrowthPathways, growthPathwaysToPrompt } from "./intelligence/growthPathways";
import { computeScenarioDecision, scenarioDecisionToPrompt } from "./intelligence/scenarioDecision";
import { computeRoadmap, roadmapToPrompt } from "./intelligence/roadmap";
import { computeOptimisation, optimisationToPrompt } from "./intelligence/optimisation";
import { computeSelection, selectionToPrompt } from "./intelligence/selector";
import { computeConflicts, conflictsToPrompt } from "./intelligence/conflict";
import { computeFinancials, financialsToPrompt, type FinancialInputs } from "./intelligence/financial";
import { computeRoster, rosterToPrompt, type RoleRow } from "./intelligence/roster";
import { computeScenarios, scenariosToPrompt } from "./intelligence/scenario";
import { computeSeriesStats, seriesStatsToPrompt } from "./intelligence/inputSpec";
import { computeBudget, budgetToCSV } from "./budget/compute";
import type { LineItem, BudgetSettings } from "./budget/types";

/**
 * THE ENGINE LAYER — running in-process.
 *
 * All 225 intelligence modules are cloned into this app under
 * `lib/intelligence`, `lib/budget` and `lib/talent`. They were already
 * pure TypeScript with no database dependency, which is why they move
 * cleanly: the compute has no infrastructure attached to it.
 *
 * Nothing here recomputes anything. This module only DISPATCHES to the
 * existing compute functions and normalises their envelope, because a
 * second implementation of the same score is how two systems start
 * disagreeing about one number.
 *
 * Every result is arithmetic. No figure on this path is produced by a
 * language model — that is what makes "the arithmetic is shown"
 * defensible rather than a slogan.
 */

export type EngineRef = { code: string; series: string; suiteId: string };

/** Which suite a module series rolls up into. */
export const SERIES_TO_SUITE: Record<string, string> = {
  Q: "core", R: "core", S: "core", P: "core", X: "core", Z: "core",
  A: "talent", F: "finance", G: "grow", C: "core",
};

/** `q44` / `Q44` → normalised reference, or null when not a module code. */
export function parseEngineCode(input: string): EngineRef | null {
  const m = /^([A-Za-z])(\d{2})$/.exec(String(input).trim());
  if (!m) return null;
  const series = m[1].toUpperCase();
  return { code: `${series}${m[2]}`, series, suiteId: SERIES_TO_SUITE[series] ?? "core" };
}

export function configFor(ref: EngineRef): ModuleConfig {
  return (
    getModuleConfig?.(ref.code) ??
    MODULE_REGISTRY[ref.code] ??
    buildFallbackConfig(ref.code, `${ref.series}-Series`, `${ref.code} Engine`)
  );
}

export const REGISTERED_CODES = Object.keys(MODULE_REGISTRY);

/**
 * Per-engine tier gate, DERIVED from FEATURE_MATRIX's own `ref` and
 * `values` fields rather than declared a second time — the matrix
 * already says "Decision path simulator (q03) is Growth and up", but
 * nothing enforced that at the API. A caller on Free or Starter could
 * run q03 through /api/engines/q03 as long as they had the points,
 * regardless of what the pricing page promised.
 *
 * Parses two ref shapes: a plain code ("q44"), and a range joined by
 * an en dash ("p01–p02", expanded to both). Multiple refs in one row
 * are comma/·-separated. A code with no matching row is left
 * ungated — the matrix does not claim a restriction for it, so
 * neither does this; inventing one would be a restriction nobody
 * actually specified.
 */
const RANK_BY_TIER: Record<TierId, number> = { free: 0, starter: 1, growth: 2, enterprise: 3, concierge: 4 };
const TIER_BY_RANK: TierId[] = ["free", "starter", "growth", "enterprise", "concierge"];

function expandRefCodes(ref: string): string[] {
  const codes: string[] = [];
  for (const part of ref.split(/[·,]/).map((s) => s.trim())) {
    const range = /^([A-Za-z])(\d{2})[–-]([A-Za-z])?(\d{2})$/.exec(part);
    if (range && (!range[3] || range[3] === range[1])) {
      const series = range[1].toUpperCase();
      const from = Number(range[2]);
      const to = Number(range[4]);
      for (let n = from; n <= to; n++) codes.push(`${series}${String(n).padStart(2, "0")}`);
      continue;
    }
    if (/^[A-Za-z]\d{2}$/.test(part)) codes.push(part.toUpperCase());
  }
  return codes;
}

const ENGINE_MIN_TIER: Record<string, TierId> = {};
for (const group of FEATURE_MATRIX) {
  for (const row of group.rows) {
    if (!row.ref) continue;
    const minRank = row.values.findIndex((v) => v !== false);
    if (minRank === -1) continue; // not available on any tier — not a "minimum", so skip
    for (const code of expandRefCodes(row.ref)) {
      const existing = ENGINE_MIN_TIER[code];
      // If a code appears in more than one row, the more permissive (lower) tier wins.
      if (!existing || RANK_BY_TIER[TIER_BY_RANK[minRank]] < RANK_BY_TIER[existing]) {
        ENGINE_MIN_TIER[code] = TIER_BY_RANK[minRank];
      }
    }
  }
}

/** null = the matrix does not specify a restriction for this code. */
export function minTierForEngine(code: string): TierId | null {
  return ENGINE_MIN_TIER[code.toUpperCase()] ?? null;
}

export function meetsEngineTier(code: string, callerTier: TierId): boolean {
  const required = minTierForEngine(code);
  if (!required) return true;
  return RANK_BY_TIER[callerTier] >= RANK_BY_TIER[required];
}

export type EngineResult = {
  code: string;
  engineName: string;
  seriesName: string;
  /** What kind of compute produced this. */
  kind: string;
  /** The computed output, in the engine's own shape — untouched. */
  summary: unknown;
  /** Narrative-ready rendering of the same numbers, for agents. */
  working: string;
  warnings: string[];
};

export class EngineInputError extends Error {
  constructor(msg: string) { super(msg); this.name = "EngineInputError"; }
}

const arr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

const clamp = (n: unknown, lo: number, hi: number, fallback: number) => {
  const v = Number(n);
  return Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : fallback;
};

/**
 * Builds the assessment rows for a module from ITS OWN dimensions.
 *
 * Accepts the caller's ratings in either form:
 *   · `ratings: { "Field Coherence": { rating, weight, evidence } }`
 *   · `rows: [...]` positionally, matched to the declared labels in order
 *
 * A row whose label is not one of the module's dimensions is dropped
 * rather than scored, because a score is only meaningful against the
 * question the engine claims to ask. Missing dimensions are included
 * unrated so the output always has the full declared shape and the gaps
 * are visible instead of silently absent.
 */
function alignToDimensions(config: ModuleConfig, input: Record<string, unknown>): AssessmentRow[] {
  const labels = config.dimensionLabels?.length
    ? config.dimensionLabels
    : ["Primary", "Secondary", "Tertiary", "Quaternary"];

  const supplied = arr<Partial<AssessmentRow>>(input.rows);
  const byLabel = new Map<string, Partial<AssessmentRow>>();
  const declared = new Set(labels.map((l) => l.trim().toLowerCase()));

  const unknownLabels: string[] = [];
  let anyLabelled = false;

  for (const r of supplied) {
    if (typeof r?.label !== "string" || !r.label.trim()) continue;
    anyLabelled = true;
    const key = r.label.trim().toLowerCase();
    if (declared.has(key)) byLabel.set(key, r);
    else unknownLabels.push(r.label.trim());
  }

  /* A label this engine does not assess is refused outright.
     Falling back to position here would silently score "Something I
     invented" as "Decision Field Clarity" — the caller would get a
     confident number for a question the engine never asked. */
  if (unknownLabels.length > 0) {
    throw new EngineInputError(
      `This engine does not assess: ${unknownLabels.join(", ")}. ` +
        `Its dimensions are: ${labels.join(", ")}.`,
    );
  }

  const ratings = (input.ratings ?? {}) as Record<string, Partial<AssessmentRow>>;

  const rows = labels.map((label, i) => {
    const match =
      byLabel.get(label.trim().toLowerCase()) ??
      ratings[label] ??
      /* Positional fallback ONLY when nothing was labelled — i.e. the
         caller is answering the engine's own questions in order. */
      (anyLabelled ? undefined : supplied[i]) ??
      {};

    return {
      id: String(i + 1),
      label,
      rating: clamp(match.rating, 0, 5, 0),
      weight: clamp(match.weight, 1, 3, 2),
      evidence: clamp(match.evidence, 0, 2, 0) as AssessmentRow["evidence"],
      ...(match.note ? { note: String(match.note).slice(0, 400) } : {}),
    } satisfies AssessmentRow;
  });

  if (rows.every((r) => r.rating === 0)) {
    throw new EngineInputError(
      `This engine assesses: ${labels.join(", ")}. Supply a rating (0-5) for at least one, as ` +
        `rows: [{ label, rating, weight, evidence }] or ratings: { "<dimension>": { rating } }.`,
    );
  }

  return rows;
}

/**
 * Run a module against its declared input shape.
 *
 * The registry declares `inputs.kind` per module; this switch is the
 * only place that mapping lives. An unrecognised module still lands on
 * the assessment compute rather than on a model, which is exactly what
 * `buildFallbackConfig` intends.
 */
export function runEngine(ref: EngineRef, input: Record<string, unknown>): EngineResult {
  const config = configFor(ref);
  const kind = (config.inputs as { kind?: string })?.kind ?? "assessment";
  const warnings: string[] = [];

  let summary: unknown;
  let working: string;

  /* Q44 runs its own engine rather than the shared four-dimension
     archetype. Decision quality is a CHAIN limited by its weakest
     requirement, not a weighted mean — averaging lets a strong frame
     hide a missing owner, which is the exact failure the module
     exists to catch. See lib/intelligence/decisionQuality.ts. */
  if (ref.code === "Q44") {
    const dq = computeDecisionQuality(
      (input.answers ?? {}) as Record<string, number>,
      input.consequence as never,
      input.reversibility as never,
    );
    return {
      code: ref.code, suite: ref.suiteId,
      engineName: config.engineName, seriesName: config.seriesName,
      kind: "decision-quality",
      summary: dq,
      working: decisionQualityToPrompt(dq),
      warnings: [...dq.confidenceFlags, ...(dq.fatalIssues.length ? [`Fatal gaps: ${dq.fatalIssues.join("; ")}`] : [])],
    } as EngineResult;
  }

  /* G03 compares candidate pathways against each other and returns a
     sequenced portfolio under a capacity constraint — a recommendation,
     not a score. See lib/intelligence/growthPathways.ts. */
  if (ref.code === "G03") {
    const gp = computeGrowthPathways(
      (input.pathways ?? []) as never,
      Number(input.capacity) || 3,
    );
    return {
      code: ref.code, suite: ref.suiteId,
      engineName: config.engineName, seriesName: config.seriesName,
      kind: "growth-pathways",
      summary: gp,
      working: growthPathwaysToPrompt(gp),
      warnings: [...gp.warnings, ...gp.portfolioWarnings],
    } as EngineResult;
  }

  /* One archetype, four modules (Q03, Q46, Q47, Q68): options
     evaluated across futures under three decision rules, with EVPI.
     See lib/intelligence/scenarioDecision.ts. */
  if (kind === "scenario-decision") {
    const sd = computeScenarioDecision(
      (input.scenarios ?? []) as never,
      (input.options ?? []) as never,
    );
    return {
      code: ref.code, suite: ref.suiteId,
      engineName: config.engineName, seriesName: config.seriesName,
      kind: "scenario-decision",
      summary: sd,
      working: scenarioDecisionToPrompt(sd),
      warnings: sd.warnings,
    } as EngineResult;
  }

  /* One archetype, seven planner modules: initiatives sequenced into a
     phased plan under dependencies and per-period capacity, with the
     critical path reported. See lib/intelligence/roadmap.ts. */
  if (kind === "roadmap") {
    const rm = computeRoadmap(
      (input.initiatives ?? []) as never,
      Number(input.periods) || 4,
      Number(input.capacityPerPeriod) || 10,
      String(input.periodLabel ?? "Quarter"),
    );
    return {
      code: ref.code, suite: ref.suiteId,
      engineName: config.engineName, seriesName: config.seriesName,
      kind: "roadmap",
      summary: rm,
      working: roadmapToPrompt(rm),
      warnings: [...rm.warnings, ...rm.guidance],
    } as EngineResult;
  }

  /* One archetype, three optimisation modules: throughput is set by the
     constraint, so improving anything else is waste. See
     lib/intelligence/optimisation.ts. */
  if (kind === "optimisation") {
    const op = computeOptimisation((input.steps ?? []) as never);
    return {
      code: ref.code, suite: ref.suiteId,
      engineName: config.engineName, seriesName: config.seriesName,
      kind: "optimisation",
      summary: op,
      working: optimisationToPrompt(op),
      warnings: [...op.warnings, ...op.guidance],
    } as EngineResult;
  }

  /* Weighted choice with sensitivity — a score plus how fragile it is. */
  if (kind === "selection") {
    const sel = computeSelection((input.options ?? []) as never, (input.criteria ?? []) as never);
    return {
      code: ref.code, suite: ref.suiteId,
      engineName: config.engineName, seriesName: config.seriesName,
      kind: "selection", summary: sel, working: selectionToPrompt(sel),
      warnings: [...sel.warnings, ...sel.guidance],
    } as EngineResult;
  }

  /* Objectives checked pairwise — conflict is a property of pairs, so
     no per-objective score can surface it. */
  if (kind === "conflict") {
    const cf = computeConflicts((input.objectives ?? []) as never);
    return {
      code: ref.code, suite: ref.suiteId,
      engineName: config.engineName, seriesName: config.seriesName,
      kind: "conflict", summary: cf, working: conflictsToPrompt(cf),
      warnings: [...cf.warnings, ...cf.guidance],
    } as EngineResult;
  }

  switch (kind) {
    case "assessment": {
      /* THE ENGINE ASSESSES ITS OWN DECLARED DIMENSIONS.
         Every registry entry names four dimensions specific to that
         module — Q01 maps "Decision Field Clarity / Possibility Space
         Width / Field Coherence / Decision Readiness", Q44 maps a
         different four. Scoring whatever rows the caller happened to
         send would make all 225 engines structurally identical and the
         name a lie. So the declared labels are authoritative: the
         caller supplies ratings, the engine supplies the questions. */
      summary = computeAssessment(alignToDimensions(config, input));
      working = assessmentToPrompt(summary as never);
      break;
    }

    case "financial": {
      if (!input.periods) throw new EngineInputError("`periods` is required for a financial module.");
      summary = computeFinancials(input as unknown as FinancialInputs);
      working = financialsToPrompt(summary as never);
      break;
    }

    case "roster": {
      const roles = arr<RoleRow>(input.roles);
      if (roles.length === 0) throw new EngineInputError("`roles` is required for a roster module.");
      summary = computeRoster(roles);
      working = rosterToPrompt(summary as never);
      break;
    }

    case "scenario": {
      const options = arr(input.options);
      if (options.length === 0) throw new EngineInputError("`options` is required for a scenario module.");
      summary = computeScenarios(options as never);
      working = scenariosToPrompt(summary as never);
      break;
    }

    case "timeseries": {
      /* `computeSeriesStats` works one metric at a time, so a module
         with several tracked metrics is computed per series and the
         results collected. Accepts either a single `{metric, values}`
         or a `series` array of them. */
      const series = arr<{ metric: unknown; values: unknown; target?: number | null }>(
        input.series ?? (input.metric ? [{ metric: input.metric, values: input.values }] : []),
      );
      if (series.length === 0) {
        throw new EngineInputError(
          "A time-series module needs `series: [{ metric, values }]`, or a single `metric` with `values`.",
        );
      }

      const computed = series.map((s) => {
        const values = arr<number>(s.values).map(Number).filter(Number.isFinite);
        if (values.length === 0) {
          throw new EngineInputError("Each series needs at least one numeric value.");
        }
        return computeSeriesStats(s.metric as never, values, s.target ?? null);
      });

      summary = computed.length === 1 ? computed[0] : computed;
      working = seriesStatsToPrompt(
        computed as never,
        typeof input.periodLabel === "string" ? input.periodLabel : "period",
      );
      break;
    }

    case "narrative": {
      /* Narrative modules have no numeric compute by design. Say so
         rather than quietly handing the shape to a model — an engine
         that pretends to compute is worse than one that admits it
         does not. */
      warnings.push("This module is narrative: it structures input rather than scoring it.");
      summary = { narrative: input };
      working = JSON.stringify(input).slice(0, 4000);
      break;
    }

    default: {
      warnings.push(`Unknown input kind "${kind}" — fell back to assessment compute.`);
      const rows = arr<AssessmentRow>(input.rows);
      if (rows.length === 0) throw new EngineInputError("`rows` is required.");
      summary = computeAssessment(rows);
      working = assessmentToPrompt(summary as never);
    }
  }

  return {
    code: ref.code,
    engineName: config.engineName,
    seriesName: config.seriesName,
    kind,
    summary,
    working,
    warnings,
  };
}

/* ── Budget is its own surface: it has a CSV export ───────── */

export function runBudget(lineItems: LineItem[], settings: BudgetSettings) {
  if (!Array.isArray(lineItems)) throw new EngineInputError("`lineItems` must be an array.");
  const computed = computeBudget(lineItems, settings);
  return { computed, csv: budgetToCSV(computed) };
}

/** Engine count per suite, derived from the registry rather than typed by hand. */
export function engineCountBySuite(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const code of REGISTERED_CODES) {
    const suite = SERIES_TO_SUITE[code[0]] ?? "core";
    counts[suite] = (counts[suite] ?? 0) + 1;
  }
  return counts;
}
