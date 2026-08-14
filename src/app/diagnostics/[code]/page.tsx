"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { authHeaders } from "@/lib/useApi";
import type { Delta } from "@/lib/engineExport";
import { primarySuiteForSuite } from "@/content/aios";
import { microcopyForSuite } from "@/content/microcopy";
import { DecisionQualityRunner } from "@/components/diagnostics/DecisionQualityRunner";
import { GrowthPathwaysRunner } from "@/components/diagnostics/GrowthPathwaysRunner";
import { RunRecord } from "@/components/diagnostics/RunRecord";
import { BenchStrengthRunner } from "@/components/diagnostics/BenchStrengthRunner";
import { ScenarioDecisionRunner } from "@/components/diagnostics/ScenarioDecisionRunner";
import type { ScenarioDecisionResult } from "@/lib/intelligence/scenarioDecision";
import { RoadmapRunner } from "@/components/diagnostics/RoadmapRunner";
import { OptimisationRunner } from "@/components/diagnostics/OptimisationRunner";
import { SelectionRunner } from "@/components/diagnostics/SelectionRunner";
import { ConflictRunner } from "@/components/diagnostics/ConflictRunner";
import { TimeSeriesRunner } from "@/components/diagnostics/TimeSeriesRunner";
import { FinancialRunner } from "@/components/diagnostics/FinancialRunner";
import { RosterRunner } from "@/components/diagnostics/RosterRunner";
import { ScenarioOptionsRunner } from "@/components/diagnostics/ScenarioOptionsRunner";
import type { RoadmapResult } from "@/lib/intelligence/roadmap";
import type { OptimisationResult } from "@/lib/intelligence/optimisation";
import type { SelectionResult } from "@/lib/intelligence/selector";
import type { ConflictResult } from "@/lib/intelligence/conflict";
import type { GrowthPathwaysResult, PathwayInput } from "@/lib/intelligence/growthPathways";
import type { BenchStrengthResult } from "@/lib/intelligence/benchStrength";
import type { DQQuestion, RequirementMeta, DecisionQualityResult, Consequence, Reversibility } from "@/lib/intelligence/decisionQuality";
import type { SeriesMetric, SeriesStats } from "@/lib/intelligence/inputSpec";
import type { FinancialSummary } from "@/lib/intelligence/financial";
import type { RosterSummary } from "@/lib/intelligence/roster";
import type { ScenarioSummary } from "@/lib/intelligence/scenario";

/**
 * THE PUBLIC DIAGNOSTIC RUNNER.
 *
 * Same engine, same form, same scoring as /dashboard/engines/[code] —
 * but reachable with no account. Anyone can open a suite's diagnostic
 * from the marketing page and fill it in; only the RESULT requires
 * signing in. Filling in a form is investment a visitor has already
 * made by the time they hit "Run diagnostic" — asking for an account
 * before that investment exists is what kills conversion, not asking
 * for one after.
 *
 * `POST /api/engines/{code}` already 401s for anonymous callers
 * (identity.userId required) — this page is the difference between
 * that 401 blocking the whole page (the dashboard route's behaviour)
 * and it blocking only the result, with the filled-in form preserved.
 */

type EngineSpec = {
  code: string; suite: string; engineName: string; seriesName: string;
  purpose: string;
  inputs: { kind?: string; periodLabel?: string; periods?: number; metrics?: SeriesMetric[] } | null;
  dimensionLabels: string[]; registered: boolean;
  minTier: string | null;
  /* Present only for modules that ship a fixed anchored question bank
     instead of free-form dimension sliders — see Q44. */
  decisionQuality?: { requirements: RequirementMeta[]; questions: DQQuestion[] };
  growthPathways?: { quadrants: { id: string; label: string; what: string }[] };
  benchStrength?: boolean;
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

export default function PublicDiagnosticPage() {
  const params = useParams<{ code: string }>();
  const code = String(params.code ?? "").toLowerCase();

  const [spec, setSpec] = useState<EngineSpec | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [result, setResult] = useState<RunResult | null>(null);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [needsUpgrade, setNeedsUpgrade] = useState<string | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  /* Set by every submit path, so the export-and-compare strip below
     works identically whichever runner produced the result. */
  const [comparison, setComparison] = useState<{ ranAt: string; deltas: Delta[] } | null>(null);
  const [ran, setRan] = useState(false);
  const [dqResult, setDqResult] = useState<DecisionQualityResult | null>(null);
  const [gpResult, setGpResult] = useState<GrowthPathwaysResult | null>(null);
  const [bsResult, setBsResult] = useState<BenchStrengthResult | null>(null);
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
     own dedicated budget tool rather than the generic financial runner —
     same exclusion the dashboard engine page applies. */
  const isF02 = spec?.code === "F02";

  /* The primary suite's own voice for this module — its run label, its
     empty state, and the sentence shown when a run fails. Resolved from
     the suite the module rolls up into, so CORE modules speak as CORE and
     FINANCE modules as FINANCE without any per-module wiring.
     Null for anything outside the four suites; every use falls back to
     the neutral string rather than borrowing another suite's voice. */
  const mc = microcopyForSuite(primarySuiteForSuite(spec?.suite ?? "")?.id);

  /* Which structured runner this module uses, if any. Keeps the render
     branch to one condition instead of eight near-identical blocks. */
  const structuredKind = spec?.roadmap ? "roadmap"
    : spec?.optimisation ? "optimisation"
    : spec?.selection ? "selection"
    : spec?.conflict ? "conflict"
    : spec?.financial && !isF02 ? "financial"
    : spec?.timeseries ? "timeseries"
    : spec?.roster ? "roster"
    : spec?.scenario ? "scenario"
    : null;

  /* Structured-input modules post their own payload shape and render
     their own result, so they share this submit path rather than
     bending the generic rows/ratings one. */
  async function runStructured(payload: Record<string, unknown>, onOk: (summary: unknown) => void) {
    setBusy(true); setRunError(null); setNeedsAuth(false); setNeedsUpgrade(null);
    try {
      const res = await fetch(`/api/engines/${code}`, {
        method: "POST", headers: authHeaders(), body: JSON.stringify({ input: payload }),
      });
      const body = await res.json();
      if (res.status === 401) { setNeedsAuth(true); return; }
      if (res.status === 403 && body?.code === "tier_required") { setNeedsUpgrade(body.remedy?.tier ?? spec?.minTier ?? null); return; }
      if (!res.ok) throw new Error(body?.error ?? mc?.error ?? "The engine could not complete.");
      setComparison(body.comparison ?? null); setRan(true);
      onOk(body.summary);
    } catch (e) {
      setRunError((e as Error).message);
    } finally { setBusy(false); }
  }

  /* Anchored-question modules post a different payload shape and render
     their own result, so they get their own submit path rather than
     bending the generic rows/ratings one. */
  async function runDecisionQuality(payload: {
    answers: Record<string, number>; consequence: Consequence; reversibility: Reversibility;
  }) {
    setBusy(true); setRunError(null); setNeedsAuth(false); setNeedsUpgrade(null);
    try {
      const res = await fetch(`/api/engines/${code}`, {
        method: "POST", headers: authHeaders(), body: JSON.stringify({ input: payload }),
      });
      const body = await res.json();
      if (res.status === 401) { setNeedsAuth(true); return; }
      if (res.status === 403 && body?.code === "tier_required") { setNeedsUpgrade(body.remedy?.tier ?? spec?.minTier ?? null); return; }
      if (!res.ok) throw new Error(body?.error ?? mc?.error ?? "The engine could not complete.");
      setComparison(body.comparison ?? null); setRan(true);
      setDqResult(body.summary as DecisionQualityResult);
    } catch (e) {
      setRunError((e as Error).message);
    } finally { setBusy(false); }
  }

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/engines/${code}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((d: EngineSpec) => {
        if (cancelled) return;
        setSpec(d);
        setRows(d.dimensionLabels.map((label) => ({ label, rating: 0, weight: 2, evidence: 0, note: "" })));
      })
      .catch(async (r) => {
        if (cancelled) return;
        const body = await r.json?.().catch(() => null);
        setLoadError(body?.error ?? "Could not load this diagnostic.");
      });
    return () => { cancelled = true; };
  }, [code]);

  async function run() {
    setBusy(true);
    setRunError(null);
    setNeedsAuth(false);
    setNeedsUpgrade(null);
    try {
      const res = await fetch(`/api/engines/${code}`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ input: { rows: rows.map(({ label, rating, weight, evidence, note }) => ({
          label, rating, weight, evidence, ...(note ? { note } : {}),
        })) } }),
      });
      const body = await res.json();
      if (res.status === 401) { setNeedsAuth(true); return; }
      if (res.status === 403 && body?.code === "tier_required") { setNeedsUpgrade(body.remedy?.tier ?? spec?.minTier ?? null); return; }
      if (!res.ok) throw new Error(body?.error ?? mc?.error ?? "The engine could not complete.");
      setComparison(body.comparison ?? null); setRan(true);
      setResult(body);
    } catch (e) {
      setRunError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Header />
      <main id="main">
        <div className="shell py-16">
          {loadError && (
            <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
              <p className="h-section">{loadError}</p>
              <Link href="/suites" className="link-underline mt-4 text-sm">Browse suites</Link>
            </div>
          )}

          {!loadError && !spec && (
            <div className="card mx-auto h-64 max-w-2xl animate-pulse" style={{ background: "var(--line-soft)" }} />
          )}

          {spec?.decisionQuality && (
            <div className="mx-auto max-w-3xl space-y-8">
              <div>
                <p className="faint text-xs font-semibold uppercase tracking-wide">{spec.seriesName}</p>
                <h1 className="h-section mt-2">{spec.engineName}</h1>
                <p className="lead mt-3">{spec.purpose}</p>
              </div>

              {needsAuth && (
                <div className="card p-6 text-center" style={{ borderColor: "var(--brand)" }}>
                  <p className="font-display text-lg">Create a free account to see the score.</p>
                  <p className="muted mt-2 text-sm">Your answers stay as they are — sign up in another tab and score it again.</p>
                  <div className="mt-4 flex justify-center gap-3">
                    <Link href="/signup" target="_blank" className="btn btn-primary">Create a free account</Link>
                    <Link href="/signin" target="_blank" className="btn btn-ghost">Sign in</Link>
                  </div>
                </div>
              )}
              {needsUpgrade && (
                <div className="card p-6 text-center" style={{ borderColor: "var(--brand)" }}>
                  <p className="font-display text-lg">This one needs the {needsUpgrade} plan.</p>
                  <Link href="/pricing" target="_blank" className="btn btn-primary mt-4">See plans</Link>
                </div>
              )}
              {runError && <p className="text-sm" style={{ color: "var(--bad)" }}>{runError}</p>}

              <DecisionQualityRunner
                requirements={spec.decisionQuality.requirements}
                questions={spec.decisionQuality.questions}
                busy={busy} result={dqResult}
                onRun={runDecisionQuality}
                onReset={() => setDqResult(null)}
              />
            </div>
          )}

          {spec?.growthPathways && (
            <div className="mx-auto max-w-3xl space-y-8">
              <div>
                <p className="faint text-xs font-semibold uppercase tracking-wide">{spec.seriesName}</p>
                <h1 className="h-section mt-2">{spec.engineName}</h1>
                <p className="lead mt-3">{spec.purpose}</p>
              </div>

              {needsAuth && (
                <div className="card p-6 text-center" style={{ borderColor: "var(--brand)" }}>
                  <p className="font-display text-lg">Create a free account to see the sequence.</p>
                  <p className="muted mt-2 text-sm">Your pathways stay as they are — sign up in another tab and run it again.</p>
                  <div className="mt-4 flex justify-center gap-3">
                    <Link href="/signup" target="_blank" className="btn btn-primary">Create a free account</Link>
                    <Link href="/signin" target="_blank" className="btn btn-ghost">Sign in</Link>
                  </div>
                </div>
              )}
              {needsUpgrade && (
                <div className="card p-6 text-center" style={{ borderColor: "var(--brand)" }}>
                  <p className="font-display text-lg">This one needs the {needsUpgrade} plan.</p>
                  <Link href="/pricing" target="_blank" className="btn btn-primary mt-4">See plans</Link>
                </div>
              )}
              {runError && <p className="text-sm" style={{ color: "var(--bad)" }}>{runError}</p>}

              <GrowthPathwaysRunner
                busy={busy} result={gpResult}
                onRun={(payload) => runStructured(payload as never, (s) => setGpResult(s as GrowthPathwaysResult))}
                onReset={() => setGpResult(null)}
              />
            </div>
          )}

          {spec?.benchStrength && (
            <div className="mx-auto max-w-3xl space-y-8">
              <div>
                <p className="faint text-xs font-semibold uppercase tracking-wide">{spec.seriesName}</p>
                <h1 className="h-section mt-2">{spec.engineName}</h1>
                <p className="lead mt-3">{spec.purpose}</p>
              </div>

              {needsAuth && (
                <div className="card p-6 text-center" style={{ borderColor: "var(--brand)" }}>
                  <p className="font-display text-lg">Create a free account to see the cover.</p>
                  <p className="muted mt-2 text-sm">Your seats stay as they are — sign up in another tab and run it again.</p>
                  <div className="mt-4 flex justify-center gap-3">
                    <Link href="/signup" target="_blank" className="btn btn-primary">Create a free account</Link>
                    <Link href="/signin" target="_blank" className="btn btn-ghost">Sign in</Link>
                  </div>
                </div>
              )}
              {needsUpgrade && (
                <div className="card p-6 text-center" style={{ borderColor: "var(--brand)" }}>
                  <p className="font-display text-lg">This one needs the {needsUpgrade} plan.</p>
                  <Link href="/pricing" target="_blank" className="btn btn-primary mt-4">See plans</Link>
                </div>
              )}
              {runError && <p className="text-sm" style={{ color: "var(--bad)" }}>{runError}</p>}

              <BenchStrengthRunner
                busy={busy} result={bsResult}
                onRun={(payload) => runStructured(payload as never, (x) => setBsResult(x as BenchStrengthResult))}
                onReset={() => setBsResult(null)}
              />
            </div>
          )}


          {structuredKind && (
            <div className="mx-auto max-w-4xl space-y-8">
              <div>
                <p className="faint text-xs font-semibold uppercase tracking-wide">{spec!.seriesName}</p>
                <h1 className="h-section mt-2">{spec!.engineName}</h1>
                <p className="lead mt-3">{spec!.purpose}</p>
              </div>

              {needsAuth && (
                <div className="card p-6 text-center" style={{ borderColor: "var(--brand)" }}>
                  <p className="font-display text-lg">Create a free account to see the result.</p>
                  <p className="muted mt-2 text-sm">Everything you entered stays as it is — sign up in another tab and run it again.</p>
                  <div className="mt-4 flex justify-center gap-3">
                    <Link href="/signup" target="_blank" className="btn btn-primary">Create a free account</Link>
                    <Link href="/signin" target="_blank" className="btn btn-ghost">Sign in</Link>
                  </div>
                </div>
              )}
              {needsUpgrade && (
                <div className="card p-6 text-center" style={{ borderColor: "var(--brand)" }}>
                  <p className="font-display text-lg">This one needs the {needsUpgrade} plan.</p>
                  <Link href="/pricing" target="_blank" className="btn btn-primary mt-4">See plans</Link>
                </div>
              )}
              {runError && <p className="text-sm" style={{ color: "var(--bad)" }}>{runError}</p>}

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
                  periodLabel={spec!.inputs?.periodLabel ?? "Month"} periods={spec!.inputs?.periods ?? 6}
                  busy={busy} result={finResult}
                  onRun={(p) => runStructured(p as never, (s) => setFinResult(s as FinancialSummary))}
                  onReset={() => setFinResult(null)} />
              )}
              {structuredKind === "timeseries" && (
                <TimeSeriesRunner
                  metrics={spec!.inputs?.metrics ?? []} periodLabel={spec!.inputs?.periodLabel ?? "Period"}
                  periods={spec!.inputs?.periods ?? 6}
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
            </div>
          )}

          {spec?.financial && isF02 && (
            <div className="mx-auto max-w-2xl">
              <div className="card p-6 text-center">
                <p className="font-display text-lg">This is a budget calculator, not an assessment.</p>
                <p className="muted mt-2 text-sm">F02 runs its own line-item budget tool.</p>
                <Link href="/diagnostics/budget" className="btn btn-primary mt-4 inline-flex">Open the budget calculator</Link>
              </div>
            </div>
          )}

          {spec?.scenarioDecision && (
            <div className="mx-auto max-w-4xl space-y-8">
              <div>
                <p className="faint text-xs font-semibold uppercase tracking-wide">{spec.seriesName}</p>
                <h1 className="h-section mt-2">{spec.engineName}</h1>
                <p className="lead mt-3">{spec.purpose}</p>
              </div>

              {needsAuth && (
                <div className="card p-6 text-center" style={{ borderColor: "var(--brand)" }}>
                  <p className="font-display text-lg">Create a free account to see the analysis.</p>
                  <p className="muted mt-2 text-sm">Your matrix stays as it is — sign up in another tab and run it again.</p>
                  <div className="mt-4 flex justify-center gap-3">
                    <Link href="/signup" target="_blank" className="btn btn-primary">Create a free account</Link>
                    <Link href="/signin" target="_blank" className="btn btn-ghost">Sign in</Link>
                  </div>
                </div>
              )}
              {needsUpgrade && (
                <div className="card p-6 text-center" style={{ borderColor: "var(--brand)" }}>
                  <p className="font-display text-lg">This one needs the {needsUpgrade} plan.</p>
                  <Link href="/pricing" target="_blank" className="btn btn-primary mt-4">See plans</Link>
                </div>
              )}
              {runError && <p className="text-sm" style={{ color: "var(--bad)" }}>{runError}</p>}

              <ScenarioDecisionRunner
                busy={busy} result={sdResult}
                onRun={(p) => runStructured(p as never, (s) => setSdResult(s as ScenarioDecisionResult))}
                onReset={() => setSdResult(null)}
              />
            </div>
          )}

          {spec && !spec.decisionQuality && !spec.growthPathways && !spec.benchStrength && !spec.scenarioDecision && !structuredKind && !isF02 && !result && (
            <div className="mx-auto max-w-2xl space-y-8">
              <div>
                <div className="flex items-center gap-2">
                  <p className="faint text-xs font-semibold uppercase tracking-wide">{spec.seriesName}</p>
                  {spec.minTier && (
                    <span className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide capitalize" style={{ background: "var(--brand-soft)", color: "var(--brand)" }}>
                      {spec.minTier}+ plan
                    </span>
                  )}
                </div>
                <h1 className="h-section mt-2">{spec.engineName}</h1>
                <p className="lead mt-3">{spec.purpose}</p>
              </div>

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
                  </div>
                ))}
              </div>

              {needsAuth && (
                <div className="card p-6 text-center" style={{ borderColor: "var(--brand)" }}>
                  <p className="font-display text-lg">Create a free account to see the score.</p>
                  <p className="muted mt-2 text-sm">
                    Your ratings above stay as you left them — sign up in another tab, then come back
                    and run it again, or sign in if you already have an account.
                  </p>
                  <div className="mt-4 flex justify-center gap-3">
                    <Link href="/signup" target="_blank" className="btn btn-primary">Create a free account</Link>
                    <Link href="/signin" target="_blank" className="btn btn-ghost">Sign in</Link>
                  </div>
                </div>
              )}
              {needsUpgrade && (
                <div className="card p-6 text-center" style={{ borderColor: "var(--brand)" }}>
                  <p className="font-display text-lg">This one needs the {needsUpgrade} plan.</p>
                  <p className="muted mt-2 text-sm">
                    Your ratings above stay as you left them — upgrade in another tab, then come back and run it.
                  </p>
                  <div className="mt-4 flex justify-center gap-3">
                    <Link href="/pricing" target="_blank" className="btn btn-primary">See plans</Link>
                  </div>
                </div>
              )}
              {runError && <p className="text-sm" style={{ color: "var(--bad)" }}>{runError}</p>}

              <div className="flex items-center gap-3">
                <button type="button" onClick={run} disabled={busy} className="btn btn-primary disabled:opacity-50">
                  {busy ? "Running…" : mc?.buttons.run ?? "Run diagnostic"}
                </button>
                <span className="faint text-xs">Free to fill in. 40 points to see the score, charged only on completion.</span>
              </div>
            </div>
          )}

          {result && <ResultView result={result} onRunAgain={() => setResult(null)} />}

          {/* One strip for every module. Placed here rather than inside
              each result renderer so a runner added later inherits the
              export and the comparison without anyone remembering to
              wire them — which is how the budget calculator ended up
              being the only tool on the platform that could export. */}
          {ran && (
            <div className="mx-auto mt-8 max-w-4xl">
              <RunRecord code={code} comparison={comparison} successNote={mc?.success} />
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

function ResultView({ result, onRunAgain }: { result: RunResult; onRunAgain: () => void }) {
  const s = result.summary;
  return (
    <div className="mx-auto max-w-3xl space-y-6">
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

      <div className="flex items-center gap-3">
        <button type="button" onClick={onRunAgain} className="btn btn-ghost">Run again</button>
        <span className="faint text-xs">Charged {result.charged} points · {result.balance.available.toLocaleString()} remaining</span>
        <Link href="/dashboard" className="link-underline ml-auto text-sm">Go to your dashboard</Link>
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
