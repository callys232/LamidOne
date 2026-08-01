import {
  getModuleConfig, buildFallbackConfig, MODULE_REGISTRY,
  type ModuleConfig,
} from "./intelligence/moduleRegistry";
import { computeAssessment, assessmentToPrompt, type AssessmentRow } from "./intelligence/assessment";
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
  return { computed, csv: budgetToCSV(computed as never) };
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
