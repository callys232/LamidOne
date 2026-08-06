"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { authHeaders } from "@/lib/useApi";
import { DecisionQualityRunner } from "@/components/diagnostics/DecisionQualityRunner";
import { GrowthPathwaysRunner } from "@/components/diagnostics/GrowthPathwaysRunner";
import { ScenarioDecisionRunner } from "@/components/diagnostics/ScenarioDecisionRunner";
import { RoadmapRunner } from "@/components/diagnostics/RoadmapRunner";
import { OptimisationRunner } from "@/components/diagnostics/OptimisationRunner";
import { SelectionRunner } from "@/components/diagnostics/SelectionRunner";
import { ConflictRunner } from "@/components/diagnostics/ConflictRunner";
import { TimeSeriesRunner } from "@/components/diagnostics/TimeSeriesRunner";
import { FinancialRunner } from "@/components/diagnostics/FinancialRunner";
import { RosterRunner } from "@/components/diagnostics/RosterRunner";
import { ScenarioOptionsRunner } from "@/components/diagnostics/ScenarioOptionsRunner";
import type { ScenarioDecisionResult } from "@/lib/intelligence/scenarioDecision";
import type { RoadmapResult } from "@/lib/intelligence/roadmap";
import type { OptimisationResult } from "@/lib/intelligence/optimisation";
import type { SelectionResult } from "@/lib/intelligence/selector";
import type { ConflictResult } from "@/lib/intelligence/conflict";
import type { GrowthPathwaysResult } from "@/lib/intelligence/growthPathways";
import type { DQQuestion, RequirementMeta, DecisionQualityResult, Consequence, Reversibility } from "@/lib/intelligence/decisionQuality";
import type { SeriesMetric, SeriesStats } from "@/lib/intelligence/inputSpec";
import type { FinancialSummary } from "@/lib/intelligence/financial";
import type { RosterSummary } from "@/lib/intelligence/roster";
import type { ScenarioSummary } from "@/lib/intelligence/scenario";

/**
 * THE ASSESSMENT ENGINE RUNNER.
 *
 * One page, driven entirely by what `GET /api/engines/{code}` returns —
 * covers all 225 modules, not just the assessment-kind majority. Same
 * engine, same runners, same scoring as the public `/diagnostics/[code]`
 * page — this route just assumes the visitor is already signed in, so
 * there is no auth/upgrade gate in front of the result.
 */

type EngineSpec = {
  code: string;
  suite: string;
  engineName: string;
  seriesName: string;
  purpose: string;
  inputs: { kind?: string; periodLabel?: string; periods?: number; metrics?: SeriesMetric[] } | null;
  dimensionLabels: string[];
  registered: boolean;
  decisionQuality?: { requirements: RequirementMeta[]; questions: DQQuestion[] };
  growthPathways?: { quadrants: { id: string; label: string; what: string }[] };
  scenarioDecision?: boolean;
  roadmap?: boolean;
  optimisation?: boolean;
  selection?: boolean;
  conflict?: boolean;
  financial?: boolean;
  timeseries?: boolean;
  roster?: boolean;
  scenario?: boolean;
};

type Row = { label: string; rating: number; weight: number; evidence: 0 | 1 | 2; note: string };

type AssessmentDimension = {
  label: string; scorePct: number; adjustedPct: number; weight: number;
  evidence: 0 | 1 | 2; unsupported: boolean;
};
type RunResult = {
  engineName: string; kind: string;
  summary: {
    dimensions: AssessmentDimension[]; indexPct: number; adjustedIndexPct: number;
    evidenceGapPts: number; weakest: AssessmentDimension | null; strongest: AssessmentDimension | null;
    spreadPts: number; priorities: string[]; documentedCount: number; warnings: string[];
  };
  charged: number;
  balance: { available: number };
};

const EVIDENCE_LABELS = ["No evidence", "Anecdotal", "Documented"];

export default function EnginePage() {
  const params = useParams<{ code: string }>();
  const code = String(params.code ?? "").toLowerCase();

  const [spec, setSpec] = useState<EngineSpec | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [result, setResult] = useState<RunResult | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [dqResult, setDqResult] = useState<DecisionQualityResult | null>(null);
  const [gpResult, setGpResult] = useState<GrowthPathwaysResult | null>(null);
  const [sdResult, setSdResult] = useState<ScenarioDecisionResult | null>(null);
  const [rmResult, setRmResult] = useState<RoadmapResult | null>(null);
  const [opResult, setOpResult] = useState<OptimisationResult | null>(null);
  const [selResult, setSelResult] = useState<SelectionResult | null>(null);
  const [cfResult, setCfResult] = useState<ConflictResult | null>(null);
  const [tsResult, setTsResult] = useState<SeriesStats[] | null>(null);
  const [finResult, setFinResult] = useState<FinancialSummary | null>(null);
  const [rosterResult, setRosterResult] = useState<RosterSummary | null>(null);
  const [scenarioResult, setScenarioResult] = useState<ScenarioSummary | null>(null);

  /* F02 is financial-kind by registry classification, but it runs its
     own dedicated line-item budget tool rather than this generic
     financial runner. */
  const isF02 = spec?.code === "F02";

  const structuredKind = spec?.roadmap ? "roadmap"
    : spec?.optimisation ? "optimisation"
    : spec?.selection ? "selection"
    : spec?.conflict ? "conflict"
    : spec?.financial && !isF02 ? "financial"
    : spec?.timeseries ? "timeseries"
    : spec?.roster ? "roster"
    : spec?.scenario ? "scenario"
    : null;

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/engines/${code}`, { headers: authHeaders() })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((d: EngineSpec) => {
        if (cancelled) return;
        setSpec(d);
        setRows(d.dimensionLabels.map((label) => ({ label, rating: 0, weight: 2, evidence: 0, note: "" })));
      })
      .catch(async (r) => {
        if (cancelled) return;
        const body = await r.json?.().catch(() => null);
        setLoadError(body?.error ?? "Could not load this engine.");
      });
    return () => { cancelled = true; };
  }, [code]);

  /* Structured- and anchored-input modules post their own payload shape
     and render their own result, so they share this submit path rather
     than bending the generic rows/ratings one. */
  async function runStructured(payload: Record<string, unknown>, onOk: (summary: unknown) => void) {
    setBusy(true); setRunError(null);
    try {
      const res = await fetch(`/api/engines/${code}`, {
        method: "POST", headers: authHeaders(), body: JSON.stringify({ input: payload }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error ?? "The engine could not complete.");
      onOk(body.summary);
    } catch (e) {
      setRunError((e as Error).message);
    } finally { setBusy(false); }
  }

  async function runDecisionQuality(payload: {
    answers: Record<string, number>; consequence: Consequence; reversibility: Reversibility;
  }) {
    await runStructured(payload as never, (s) => setDqResult(s as DecisionQualityResult));
  }

  async function run() {
    setBusy(true);
    setRunError(null);
    try {
      const res = await fetch(`/api/engines/${code}`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ input: { rows: rows.map(({ label, rating, weight, evidence, note }) => ({
          label, rating, weight, evidence, ...(note ? { note } : {}),
        })) } }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error ?? "The engine could not complete.");
      setResult(body);
    } catch (e) {
      setRunError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (loadError) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
        <p className="h-section">{loadError}</p>
        <Link href="/dashboard/engines" className="link-underline mt-4 text-sm">Back to engines</Link>
      </div>
    );
  }

  if (!spec) {
    return <div className="card h-64 animate-pulse" style={{ background: "var(--line-soft)" }} />;
  }

  if (isF02) {
    return (
      <div className="card p-6 text-center">
        <p className="font-display text-lg">This is a budget calculator, not an assessment.</p>
        <p className="muted mt-2 text-sm">F02 runs its own line-item budget tool.</p>
        <Link href="/dashboard/budget" className="btn btn-primary mt-4 inline-flex">Open the budget calculator</Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="faint text-xs font-semibold uppercase tracking-wide">{spec.seriesName}</p>
        <h1 className="font-display text-2xl">{spec.engineName}</h1>
        <p className="muted mt-2 max-w-2xl text-sm leading-relaxed">{spec.purpose}</p>
      </div>

      {runError && <p className="text-sm" style={{ color: "var(--bad)" }}>{runError}</p>}

      {spec.decisionQuality && (
        <DecisionQualityRunner
          requirements={spec.decisionQuality.requirements}
          questions={spec.decisionQuality.questions}
          busy={busy} result={dqResult}
          onRun={runDecisionQuality}
          onReset={() => setDqResult(null)}
        />
      )}

      {spec.growthPathways && (
        <GrowthPathwaysRunner
          busy={busy} result={gpResult}
          onRun={(p) => runStructured(p as never, (s) => setGpResult(s as GrowthPathwaysResult))}
          onReset={() => setGpResult(null)}
        />
      )}

      {spec.scenarioDecision && (
        <ScenarioDecisionRunner
          busy={busy} result={sdResult}
          onRun={(p) => runStructured(p as never, (s) => setSdResult(s as ScenarioDecisionResult))}
          onReset={() => setSdResult(null)}
        />
      )}

      {structuredKind === "roadmap" && (
        <RoadmapRunner busy={busy} result={rmResult}
          onRun={(p) => runStructured(p as never, (s) => setRmResult(s as RoadmapResult))}
          onReset={() => setRmResult(null)} />
      )}
      {structuredKind === "optimisation" && (
        <OptimisationRunner busy={busy} result={opResult}
          onRun={(p) => runStructured(p as never, (s) => setOpResult(s as OptimisationResult))}
          onReset={() => setOpResult(null)} />
      )}
      {structuredKind === "selection" && (
        <SelectionRunner busy={busy} result={selResult}
          onRun={(p) => runStructured(p as never, (s) => setSelResult(s as SelectionResult))}
          onReset={() => setSelResult(null)} />
      )}
      {structuredKind === "conflict" && (
        <ConflictRunner busy={busy} result={cfResult}
          onRun={(p) => runStructured(p as never, (s) => setCfResult(s as ConflictResult))}
          onReset={() => setCfResult(null)} />
      )}
      {structuredKind === "financial" && (
        <FinancialRunner
          periodLabel={spec.inputs?.periodLabel ?? "Month"} periods={spec.inputs?.periods ?? 6}
          busy={busy} result={finResult}
          onRun={(p) => runStructured(p as never, (s) => setFinResult(s as FinancialSummary))}
          onReset={() => setFinResult(null)} />
      )}
      {structuredKind === "timeseries" && (
        <TimeSeriesRunner
          metrics={spec.inputs?.metrics ?? []} periodLabel={spec.inputs?.periodLabel ?? "Period"}
          periods={spec.inputs?.periods ?? 6}
          busy={busy} result={tsResult}
          onRun={(p) => runStructured(p as never, (s) => setTsResult(Array.isArray(s) ? s as SeriesStats[] : [s as SeriesStats]))}
          onReset={() => setTsResult(null)} />
      )}
      {structuredKind === "roster" && (
        <RosterRunner busy={busy} result={rosterResult}
          onRun={(p) => runStructured(p as never, (s) => setRosterResult(s as RosterSummary))}
          onReset={() => setRosterResult(null)} />
      )}
      {structuredKind === "scenario" && (
        <ScenarioOptionsRunner busy={busy} result={scenarioResult}
          onRun={(p) => runStructured(p as never, (s) => setScenarioResult(s as ScenarioSummary))}
          onReset={() => setScenarioResult(null)} />
      )}

      {!spec.decisionQuality && !spec.growthPathways && !spec.scenarioDecision && !structuredKind && (
        !result ? (
          <div className="space-y-5">
            {rows.map((row, i) => (
              <div key={row.label} className="card p-5">
                <p className="font-semibold">{row.label}</p>

                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  <label className="block text-sm">
                    <span className="muted mb-1.5 flex items-center justify-between text-xs font-medium">
                      Rating <span className="tabular-nums">{row.rating} / 5</span>
                    </span>
                    <input
                      type="range" min={0} max={5} step={1} value={row.rating}
                      onChange={(e) => setRows((rs) => rs.map((r, j) => j === i ? { ...r, rating: Number(e.target.value) } : r))}
                      className="w-full accent-brand"
                    />
                  </label>

                  <label className="block text-sm">
                    <span className="muted mb-1.5 block text-xs font-medium">How much this matters</span>
                    <select
                      value={row.weight}
                      onChange={(e) => setRows((rs) => rs.map((r, j) => j === i ? { ...r, weight: Number(e.target.value) } : r))}
                      className="w-full rounded-lg border px-3 py-2 text-sm"
                      style={{ borderColor: "var(--line)", background: "var(--page)" }}
                    >
                      <option value={1}>Minor</option>
                      <option value={2}>Standard</option>
                      <option value={3}>Critical</option>
                    </select>
                  </label>

                  <label className="block text-sm">
                    <span className="muted mb-1.5 block text-xs font-medium">Evidence</span>
                    <select
                      value={row.evidence}
                      onChange={(e) => setRows((rs) => rs.map((r, j) => j === i ? { ...r, evidence: Number(e.target.value) as 0 | 1 | 2 } : r))}
                      className="w-full rounded-lg border px-3 py-2 text-sm"
                      style={{ borderColor: "var(--line)", background: "var(--page)" }}
                    >
                      {EVIDENCE_LABELS.map((l, v) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </label>
                </div>

                <input
                  value={row.note}
                  onChange={(e) => setRows((rs) => rs.map((r, j) => j === i ? { ...r, note: e.target.value.slice(0, 400) } : r))}
                  placeholder="Optional note — what makes this true"
                  className="mt-3 w-full rounded-lg border px-3 py-2 text-sm"
                  style={{ borderColor: "var(--line)", background: "var(--page)" }}
                />
              </div>
            ))}

            <div className="flex items-center gap-3">
              <button type="button" onClick={run} disabled={busy} className="btn btn-primary disabled:opacity-50">
                {busy ? "Running…" : "Run diagnostic"}
              </button>
              <span className="faint text-xs">40 points, charged only if this completes.</span>
            </div>
          </div>
        ) : (
          <ResultView result={result} onRunAgain={() => setResult(null)} />
        )
      )}
    </div>
  );
}

function ResultView({ result, onRunAgain }: { result: RunResult; onRunAgain: () => void }) {
  const s = result.summary;
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Raw index" value={`${s.indexPct}%`} />
        <Stat label="Evidence-adjusted" value={`${s.adjustedIndexPct}%`} tone={s.evidenceGapPts >= 15 ? "warn" : undefined} />
        <Stat label="Spread" value={`${s.spreadPts} pts`} hint={s.weakest ? `Weakest: ${s.weakest.label}` : undefined} />
      </div>

      {s.warnings.length > 0 && (
        <div className="card p-5" style={{ borderColor: "var(--warn)" }}>
          <p className="text-sm font-semibold">What this run flags</p>
          <ul className="mt-2 space-y-1.5">
            {s.warnings.map((w) => <li key={w} className="muted text-sm leading-relaxed">• {w}</li>)}
          </ul>
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b" style={{ borderColor: "var(--line-soft)" }}>
              <th className="px-4 py-3 font-medium">Dimension</th>
              <th className="px-4 py-3 font-medium">Score</th>
              <th className="px-4 py-3 font-medium">Adjusted</th>
              <th className="px-4 py-3 font-medium">Evidence</th>
            </tr>
          </thead>
          <tbody>
            {s.dimensions.map((d) => (
              <tr key={d.label} className="border-b" style={{ borderColor: "var(--line-soft)" }}>
                <td className="px-4 py-3">{d.label}{d.unsupported && <span className="ml-2 text-[10px] font-semibold" style={{ color: "var(--bad)" }}>UNSUPPORTED</span>}</td>
                <td className="px-4 py-3 tabular-nums">{d.scorePct}%</td>
                <td className="px-4 py-3 tabular-nums">{d.adjustedPct}%</td>
                <td className="px-4 py-3">{EVIDENCE_LABELS[d.evidence]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {s.priorities.length > 0 && (
        <div className="card p-5">
          <p className="text-sm font-semibold">Highest-return priorities</p>
          <p className="muted mt-2 text-sm">{s.priorities.join(" · ")}</p>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button type="button" onClick={onRunAgain} className="btn btn-ghost">Run again</button>
        <span className="faint text-xs">Charged {result.charged} points · {result.balance.available.toLocaleString()} remaining</span>
      </div>
    </div>
  );
}

function Stat({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone?: "warn" }) {
  return (
    <div className="card p-5">
      <p className="faint text-xs font-medium uppercase tracking-wide">{label}</p>
      <p className="stat-value mt-1 text-3xl" style={tone === "warn" ? { color: "var(--warn)" } : undefined}>{value}</p>
      {hint && <p className="faint mt-1 text-xs">{hint}</p>}
    </div>
  );
}
