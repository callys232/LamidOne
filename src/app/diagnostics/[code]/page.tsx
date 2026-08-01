"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { authHeaders } from "@/lib/useApi";

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
  purpose: string; inputs: { kind?: string } | null; dimensionLabels: string[]; registered: boolean;
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
  const [runError, setRunError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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
      if (!res.ok) throw new Error(body?.error ?? "The engine could not complete.");
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

          {spec && !result && (
            <div className="mx-auto max-w-2xl space-y-8">
              <div>
                <p className="faint text-xs font-semibold uppercase tracking-wide">{spec.seriesName}</p>
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
              {runError && <p className="text-sm" style={{ color: "var(--bad)" }}>{runError}</p>}

              <div className="flex items-center gap-3">
                <button type="button" onClick={run} disabled={busy} className="btn btn-primary disabled:opacity-50">
                  {busy ? "Running…" : "Run diagnostic"}
                </button>
                <span className="faint text-xs">Free to fill in. 40 points to see the score, charged only on completion.</span>
              </div>
            </div>
          )}

          {result && <ResultView result={result} onRunAgain={() => setResult(null)} />}
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
