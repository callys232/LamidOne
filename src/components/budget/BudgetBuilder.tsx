"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Sparkles, Search, Plus, Trash2, Download, AlertTriangle } from "lucide-react";
import { authHeaders } from "@/lib/useApi";
import { SCurve } from "./SCurve";
import {
  PROJECT_TYPES, COST_CATEGORIES,
  type LineItem, type BudgetSettings, type ComputedBudget, type ProjectType,
} from "@/lib/budget/types";

/**
 * THE BUDGET BUILDER.
 *
 * Shared by the public tool (/diagnostics/budget) and the signed-in one
 * (/dashboard/budget) — they were near-identical copies, so the whole
 * builder lives here once and the two pages differ only in what happens
 * when the compute call returns 401.
 *
 * The flow is deliberately: STRUCTURE → RATES → RISK → RESULT. Most
 * budgets are wrong because a whole category was forgotten, not because
 * a rate was slightly off, so the tool leads with the work breakdown and
 * only then asks for money.
 */

type Driver = { key: string; label: string; help: string; unit: string; default: number; integer?: boolean };
type ScaffoldMeta = { projectType: string; summary: string; ratesNote: string; drivers: Driver[] };

type PlatformSuggestion = {
  count: number; median: number | null; p25: number | null; p75: number | null;
  confidence: "none" | "thin" | "moderate" | "good"; note: string; matchedOn: string[];
};
type WebSuggestion = {
  available: boolean; reason?: string; caveat: string;
  results: { title: string; url: string; snippet: string; figures: { value: number; currency: string; raw: string }[] }[];
};

const newLine = (): LineItem => ({
  id: `li_${Math.random().toString(36).slice(2, 9)}`,
  category: "Other Direct Costs", name: "", quantity: 1, unit: "days", unitCost: 0,
});

const CONFIDENCE_TONE: Record<string, string> = {
  none: "var(--ink-faint)", thin: "var(--warn)", moderate: "var(--ink)", good: "var(--good)",
};

export function BudgetBuilder({ onNeedsAuth }: { onNeedsAuth?: () => void }) {
  const [settings, setSettings] = useState<BudgetSettings>({
    projectName: "", projectType: "Consulting Engagement", currency: "USD",
    periods: 6, periodLabel: "Month",
    overheadPct: 12, contingencyPct: 10, taxPct: 0, taxOnOverhead: false,
    useProbabilisticContingency: true, targetConfidence: 80,
    costCorrelation: 0.3, simulationSeed: 20260801, iterations: 10000,
    escalation: { annualPct: 0, periodsPerYear: 12, basePeriod: 1 },
  });

  const [lines, setLines] = useState<LineItem[]>([newLine()]);
  const [computed, setComputed] = useState<ComputedBudget | null>(null);
  const [csv, setCsv] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [meta, setMeta] = useState<ScaffoldMeta | null>(null);
  const [drivers, setDrivers] = useState<Record<string, number>>({});
  const [scaffolding, setScaffolding] = useState(false);

  const set = <K extends keyof BudgetSettings>(k: K, v: BudgetSettings[K]) =>
    setSettings((s) => ({ ...s, [k]: v }));

  const updateLine = useCallback((id: string, patch: Partial<LineItem>) => {
    setLines((ls) => ls.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }, []);

  /* Driver definitions follow the chosen archetype. */
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/budget/scaffold?projectType=${encodeURIComponent(settings.projectType)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: ScaffoldMeta | null) => {
        if (cancelled || !d) return;
        setMeta(d);
        setDrivers(Object.fromEntries(d.drivers.map((x) => [x.key, x.default])));
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [settings.projectType]);

  async function generateStructure() {
    setScaffolding(true);
    setError(null);
    try {
      const res = await fetch("/api/budget/scaffold", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ projectType: settings.projectType, drivers }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error ?? "Could not generate a structure.");
      setLines(body.lineItems);
      setComputed(null);
      if (drivers.periods) set("periods", Math.max(1, Math.round(drivers.periods)));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setScaffolding(false);
    }
  }

  async function compute() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/budget", {
        method: "POST", headers: authHeaders(),
        body: JSON.stringify({ lineItems: lines, settings }),
      });
      if (res.status === 401) { onNeedsAuth?.(); return; }
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error ?? "Could not compute the budget.");
      setComputed(body.computed);
      setCsv(body.csv);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function downloadCsv() {
    if (!csv) return;
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${settings.projectName || "budget"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const money = useCallback(
    (n: number) => {
      try {
        return new Intl.NumberFormat(undefined, {
          style: "currency", currency: settings.currency, maximumFractionDigits: 0,
        }).format(n);
      } catch { return `${settings.currency} ${Math.round(n).toLocaleString()}`; }
    },
    [settings.currency],
  );

  const directPreview = useMemo(
    () => lines.reduce((s, l) => s + (Number(l.quantity) || 0) * Math.abs(Number(l.unitCost) || 0) * (l.isCredit ? -1 : 1), 0),
    [lines],
  );

  const unpriced = lines.filter((l) => !l.isCredit && !(Number(l.unitCost) > 0)).length;

  return (
    <div className="space-y-8">
      {/* ── 1. Setup ────────────────────────────────────────── */}
      <section className="card p-6">
        <h2 className="font-display text-lg">1 · The project</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Project name">
            <input value={settings.projectName} onChange={(e) => set("projectName", e.target.value)}
                   placeholder="Operating model review" className="input" />
          </Field>
          <Field label="Project type">
            <select value={settings.projectType} onChange={(e) => set("projectType", e.target.value as ProjectType)}
                    aria-label="Project type" className="input">
              {PROJECT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Currency">
            <input value={settings.currency} onChange={(e) => set("currency", e.target.value.toUpperCase().slice(0, 3))}
                   className="input" maxLength={3} />
          </Field>
          <Field label={`${settings.periodLabel}s`}>
            <div className="flex gap-2">
              <input type="number" min={1} value={settings.periods}
                     onChange={(e) => set("periods", Math.max(1, Number(e.target.value) || 1))}
                     className="input w-20" />
              <select value={settings.periodLabel} onChange={(e) => set("periodLabel", e.target.value)}
                      aria-label="Period unit" className="input flex-1">
                <option>Month</option><option>Quarter</option><option>Phase</option>
              </select>
            </div>
          </Field>
        </div>
        {meta && <p className="muted mt-4 text-sm leading-relaxed">{meta.summary}</p>}
      </section>

      {/* ── 2. Generate the structure ───────────────────────── */}
      {meta && meta.drivers.length > 0 && (
        <section className="card p-6">
          <h2 className="font-display text-lg">2 · Generate the work breakdown</h2>
          <p className="muted mt-2 text-sm leading-relaxed">
            Answer these and the tool builds the line structure with real quantities.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {meta.drivers.map((d) => (
              <Field key={d.key} label={`${d.label} (${d.unit})`} help={d.help}>
                <input type="number" value={drivers[d.key] ?? d.default}
                       step={d.integer ? 1 : "any"}
                       onChange={(e) => setDrivers((x) => ({ ...x, [d.key]: Number(e.target.value) }))}
                       className="input" />
              </Field>
            ))}
          </div>
          <button type="button" onClick={generateStructure} disabled={scaffolding}
                  className="btn btn-primary mt-5 disabled:opacity-50">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            {scaffolding ? "Generating…" : "Generate structure"}
          </button>
          {lines.length > 1 && <span className="faint ml-3 text-xs">Replaces the current lines.</span>}
        </section>
      )}

      {/* ── 3. Lines ────────────────────────────────────────── */}
      <section className="card p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="font-display text-lg">3 · Line items</h2>
          <span className="faint text-xs tabular-nums">
            {lines.length} lines · direct {money(directPreview)}
            {unpriced > 0 && <span style={{ color: "var(--warn)" }}> · {unpriced} unpriced</span>}
          </span>
        </div>

        <div className="mt-4 space-y-3">
          {lines.map((l) => (
            <LineRow key={l.id} line={l} currency={settings.currency}
                     onChange={(p) => updateLine(l.id, p)}
                     onRemove={() => setLines((ls) => ls.filter((x) => x.id !== l.id))} />
          ))}
        </div>

        <button type="button" onClick={() => setLines((ls) => [...ls, newLine()])}
                className="btn btn-ghost mt-4 !px-3 !py-1.5 text-xs">
          <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Add line
        </button>
      </section>

      {/* ── 4. Loading and risk ─────────────────────────────── */}
      <section className="card p-6">
        <h2 className="font-display text-lg">4 · Loading, risk and escalation</h2>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Field label="Overhead %" help="Applied to direct costs.">
            <input type="number" min={0} value={settings.overheadPct}
                   onChange={(e) => set("overheadPct", Number(e.target.value) || 0)} className="input" />
          </Field>
          <Field label="Tax %" help="Applied to the taxable base.">
            <input type="number" min={0} value={settings.taxPct}
                   onChange={(e) => set("taxPct", Number(e.target.value) || 0)} className="input" />
          </Field>
          <Field label="Tax treatment">
            <label className="flex items-center gap-2 pt-2 text-sm">
              <input type="checkbox" checked={settings.taxOnOverhead}
                     onChange={(e) => set("taxOnOverhead", e.target.checked)} />
              Tax applies to overhead
            </label>
          </Field>
        </div>

        <div className="mt-6 rounded-lg p-4" style={{ background: "var(--line-soft)" }}>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" checked={Boolean(settings.useProbabilisticContingency)}
                   onChange={(e) => set("useProbabilisticContingency", e.target.checked)} />
            Size contingency from simulated risk instead of a flat percentage
          </label>
          <p className="muted mt-2 text-xs leading-relaxed">
            Runs a seeded Monte Carlo over the ranges on your lines and sets contingency at the
            confidence level you choose. Needs a range on at least one line. P80 is the standard
            for a control budget.
          </p>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {settings.useProbabilisticContingency ? (
              <>
                <Field label={`Target confidence P${settings.targetConfidence}`}>
                  <input type="range" min={50} max={95} step={5} value={settings.targetConfidence}
                         onChange={(e) => set("targetConfidence", Number(e.target.value))} className="w-full accent-brand" />
                </Field>
                <Field label="Cost correlation" help="How much lines move together. 0.2–0.4 typical. Zero understates risk badly.">
                  <input type="number" min={0} max={1} step={0.05} value={settings.costCorrelation}
                         onChange={(e) => set("costCorrelation", Number(e.target.value))} className="input" />
                </Field>
                <Field label="Iterations">
                  <input type="number" min={1000} max={50000} step={1000} value={settings.iterations}
                         onChange={(e) => set("iterations", Number(e.target.value))} className="input" />
                </Field>
              </>
            ) : (
              <Field label="Flat contingency %">
                <input type="number" min={0} value={settings.contingencyPct}
                       onChange={(e) => set("contingencyPct", Number(e.target.value) || 0)} className="input" />
              </Field>
            )}
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Field label="Annual escalation %" help="Compounds forward from the base period. 0 disables.">
            <input type="number" min={0} step={0.1} value={settings.escalation?.annualPct ?? 0}
                   onChange={(e) => set("escalation", { annualPct: Number(e.target.value) || 0,
                     periodsPerYear: settings.escalation?.periodsPerYear ?? 12,
                     basePeriod: settings.escalation?.basePeriod ?? 1 })}
                   className="input" />
          </Field>
          <Field label={`${settings.periodLabel}s per year`}>
            <input type="number" min={1} max={12} value={settings.escalation?.periodsPerYear ?? 12}
                   onChange={(e) => set("escalation", { annualPct: settings.escalation?.annualPct ?? 0,
                     periodsPerYear: Number(e.target.value) || 12,
                     basePeriod: settings.escalation?.basePeriod ?? 1 })}
                   className="input" />
          </Field>
          <Field label="Optimism bias %" help="Blank uses the published figure for this project type, where one exists.">
            <input type="number" min={0} placeholder="auto"
                   value={settings.optimismBiasPct ?? ""}
                   onChange={(e) => set("optimismBiasPct", e.target.value === "" ? undefined : Number(e.target.value))}
                   className="input" />
          </Field>
        </div>
      </section>

      {error && <p className="text-sm" style={{ color: "var(--bad)" }}>{error}</p>}

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={compute} disabled={busy} className="btn btn-primary disabled:opacity-50">
          {busy ? "Computing…" : "Compute budget"}
        </button>
        {csv && (
          <button type="button" onClick={downloadCsv} className="btn btn-secondary">
            <Download className="h-4 w-4" aria-hidden="true" /> Export CSV
          </button>
        )}
      </div>

      {computed && <Results b={computed} money={money} />}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════ */

function Field({ label, help, children }: { label: string; help?: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="muted mb-1.5 block text-xs font-medium">{label}</span>
      {children}
      {help && <span className="faint mt-1 block text-[11px] leading-snug">{help}</span>}
    </label>
  );
}

function LineRow({
  line, currency, onChange, onRemove,
}: {
  line: LineItem; currency: string;
  onChange: (p: Partial<LineItem>) => void;
  onRemove: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [sug, setSug] = useState<{ platform: PlatformSuggestion; web: WebSuggestion | null; webAvailable: boolean } | null>(null);
  const [loading, setLoading] = useState(false);

  async function findRate(includeWeb: boolean) {
    if (!line.name.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/budget/suggest", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ query: line.name, currency, kind: "day-rate", includeWeb }),
      });
      const b = await res.json();
      if (res.ok) { setSug(b); setOpen(true); }
    } finally { setLoading(false); }
  }

  const total = (Number(line.quantity) || 0) * Math.abs(Number(line.unitCost) || 0) * (line.isCredit ? -1 : 1);

  return (
    <div className="rounded-lg border p-3" style={{ borderColor: "var(--line-soft)" }}>
      <div className="grid gap-2 lg:grid-cols-12">
        <select value={line.category} onChange={(e) => onChange({ category: e.target.value as LineItem["category"] })}
                aria-label="Cost category" className="input lg:col-span-2">
          {COST_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <input value={line.name} onChange={(e) => onChange({ name: e.target.value })}
               placeholder="Line description" aria-label="Line description" className="input lg:col-span-3" />
        <input type="number" value={line.quantity} onChange={(e) => onChange({ quantity: Number(e.target.value) })}
               placeholder="Qty" aria-label="Quantity" className="input lg:col-span-1" />
        <input value={line.unit} onChange={(e) => onChange({ unit: e.target.value })}
               placeholder="unit" aria-label="Unit of measure" className="input lg:col-span-1" />
        <input type="number" value={line.unitCost} onChange={(e) => onChange({ unitCost: Number(e.target.value) })}
               placeholder="Rate" aria-label="Unit rate" className="input lg:col-span-2" />
        <input type="number" value={line.period ?? ""} onChange={(e) => onChange({ period: e.target.value === "" ? undefined : Number(e.target.value) })}
               placeholder="Period" aria-label="Period this cost lands in" className="input lg:col-span-1" />
        <div className="flex items-center justify-end gap-1 lg:col-span-2">
          <span className="faint mr-1 text-xs tabular-nums">{Math.round(total).toLocaleString()}</span>
          <button type="button" onClick={() => findRate(false)} disabled={loading || !line.name.trim()}
                  title="Find comparable rates" aria-label="Find comparable rates"
                  className="faint p-1 hover:text-brand disabled:opacity-30">
            <Search className="h-3.5 w-3.5" />
          </button>
          <button type="button" onClick={onRemove} title="Remove line" aria-label="Remove line"
                  className="faint p-1 hover:text-brand">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-4 text-[11px]">
        <span className="faint">Range</span>
        <label className="flex items-center gap-1">
          −<input type="number" min={0} max={100} value={line.uncertainty?.lowPct ?? ""}
                  onChange={(e) => onChange({ uncertainty: { lowPct: Number(e.target.value) || 0, highPct: line.uncertainty?.highPct ?? 0 } })}
                  placeholder="0" aria-label="Optimistic percentage below the estimate" className="input w-14 !py-0.5 !text-[11px]" />%
        </label>
        <label className="flex items-center gap-1">
          +<input type="number" min={0} value={line.uncertainty?.highPct ?? ""}
                  onChange={(e) => onChange({ uncertainty: { lowPct: line.uncertainty?.lowPct ?? 0, highPct: Number(e.target.value) || 0 } })}
                  placeholder="0" aria-label="Pessimistic percentage above the estimate" className="input w-14 !py-0.5 !text-[11px]" />%
        </label>
        <label className="faint flex items-center gap-1.5">
          <input type="checkbox" checked={Boolean(line.isCredit)} onChange={(e) => onChange({ isCredit: e.target.checked })} />
          Credit
        </label>
        <label className="faint flex items-center gap-1.5">
          <input type="checkbox" checked={Boolean(line.escalationExempt)} onChange={(e) => onChange({ escalationExempt: e.target.checked })} />
          No escalation
        </label>
        <label className="faint flex items-center gap-1.5">
          Actual
          <input type="number" value={line.actual ?? ""} onChange={(e) => onChange({ actual: e.target.value === "" ? undefined : Number(e.target.value) })}
                 placeholder="—" aria-label="Actual spent to date" className="input w-20 !py-0.5 !text-[11px]" />
        </label>
      </div>

      {open && sug && (
        <div className="mt-3 rounded-lg p-3 text-xs" style={{ background: "var(--line-soft)" }}>
          <div className="flex items-baseline justify-between gap-2">
            <strong>Comparable day rates on this platform</strong>
            <button type="button" onClick={() => setOpen(false)} className="faint hover:text-brand">close</button>
          </div>
          <p className="mt-1" style={{ color: CONFIDENCE_TONE[sug.platform.confidence] }}>{sug.platform.note}</p>
          {sug.platform.count > 0 && (
            <p className="mt-1 tabular-nums">
              P25 {Math.round(sug.platform.p25 ?? 0).toLocaleString()} ·{" "}
              <strong>median {Math.round(sug.platform.median ?? 0).toLocaleString()}</strong> ·{" "}
              P75 {Math.round(sug.platform.p75 ?? 0).toLocaleString()} {currency}
              {sug.platform.median !== null && (
                <button type="button" className="link-underline ml-2 text-brand"
                        onClick={() => onChange({ unitCost: Math.round(sug.platform.median!) })}>
                  use median
                </button>
              )}
            </p>
          )}
          {sug.platform.matchedOn.length > 0 && (
            <p className="faint mt-1">Matched on: {sug.platform.matchedOn.join(", ")}</p>
          )}

          {sug.webAvailable && !sug.web && (
            <button type="button" onClick={() => findRate(true)} className="link-underline mt-2 text-brand">
              Also search external sources
            </button>
          )}
          {sug.web && (
            <div className="mt-3 border-t pt-2" style={{ borderColor: "var(--line)" }}>
              <strong>External sources</strong>
              {!sug.web.available && <p className="faint mt-1">{sug.web.reason}</p>}
              {sug.web.results.map((r) => (
                <div key={r.url} className="mt-2">
                  <a href={r.url} target="_blank" rel="noopener noreferrer" className="link-underline text-brand">{r.title}</a>
                  <p className="faint mt-0.5">
                    {r.figures.map((f) => `${f.raw}`).join(" · ")}
                  </p>
                </div>
              ))}
              {sug.web.available && <p className="faint mt-2 leading-relaxed">{sug.web.caveat}</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════ */

function Results({ b, money }: { b: ComputedBudget; money: (n: number) => string }) {
  const c = b.classification;
  return (
    <div className="space-y-6">
      {/* Estimate class — deliberately first. */}
      <section className="card p-6" style={{ borderColor: "var(--brand)" }}>
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <p className="faint text-xs font-semibold uppercase tracking-wide">{c.label}</p>
            <p className="stat-value mt-1 text-4xl">{money(b.totals.grandTotal)}</p>
          </div>
          <div className="text-right">
            <p className="faint text-xs">Expected accuracy</p>
            <p className="text-lg font-semibold tabular-nums">
              {money(c.lowValue)} – {money(c.highValue)}
            </p>
            <p className="faint text-xs tabular-nums">{c.accuracy.lowPct}% / +{c.accuracy.highPct}% · {c.definitionPct}% defined</p>
          </div>
        </div>
        <p className="muted mt-3 text-sm leading-relaxed">{c.fitFor}</p>

        <details className="mt-4">
          <summary className="faint cursor-pointer text-xs">How this class was derived</summary>
          <ul className="mt-3 space-y-2">
            {c.signals.map((s) => (
              <li key={s.label} className="text-xs">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium">{s.label}</span>
                  <span className="tabular-nums">{s.scorePct}%</span>
                </div>
                <div className="mt-1 h-1 rounded-full" style={{ background: "var(--line-soft)" }}>
                  <div className="h-1 rounded-full" style={{ width: `${s.scorePct}%`, background: "var(--brand)" }} />
                </div>
                <p className="faint mt-1 leading-snug">{s.detail}</p>
              </li>
            ))}
          </ul>
        </details>
      </section>

      {b.warnings.length > 0 && (
        <section className="card p-5" style={{ borderColor: "var(--warn)" }}>
          <p className="flex items-center gap-2 text-sm font-semibold">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" /> What this budget flags
          </p>
          <ul className="mt-2 space-y-1.5">
            {b.warnings.map((w) => <li key={w} className="muted text-sm leading-relaxed">• {w}</li>)}
          </ul>
        </section>
      )}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Direct costs" value={money(b.totals.directCosts)}
              hint={b.totals.escalation !== 0 ? `includes ${money(b.totals.escalation)} escalation` : undefined} />
        <Stat label="Overhead" value={money(b.totals.overhead)} />
        <Stat label="Contingency" value={money(b.totals.contingency)}
              hint={b.simulation.ran && b.settings.useProbabilisticContingency
                ? `risk-based at P${b.simulation.targetP}` : `${b.settings.contingencyPct}% flat`} />
        <Stat label="Tax" value={money(b.totals.tax)} hint={`on ${money(b.totals.taxableBase)}`} />
      </section>

      {b.totals.optimismUplift > 0 && (
        <section className="card p-5">
          <p className="text-sm font-semibold">Optimism bias uplift · {money(b.totals.optimismUplift)}</p>
          <p className="muted mt-2 text-sm leading-relaxed">{b.referenceClass.basis}</p>
        </section>
      )}

      {b.simulation.ran && (
        <section className="card p-6">
          <h3 className="font-display text-lg">Cost risk</h3>
          <p className="muted mt-1 text-sm">
            {b.simulation.iterations.toLocaleString()} simulated outcomes · correlation {b.simulation.correlation} · seed {b.simulation.seed} (re-runs reproduce exactly)
          </p>
          <div className="mt-5 grid gap-6 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <SCurve curve={b.simulation.curve} targetP={b.simulation.targetP}
                      base={b.totals.directCosts} currency={b.settings.currency} />
            </div>
            <div className="space-y-3 lg:col-span-2">
              <div className="grid grid-cols-2 gap-3">
                <Stat label="P50" value={money(b.simulation.p50)} />
                <Stat label={`P${b.simulation.targetP}`} value={money(
                  b.simulation.targetP === 90 ? b.simulation.p90 : b.simulation.targetP === 50 ? b.simulation.p50 : b.simulation.p80,
                )} />
              </div>
              <div>
                <p className="faint text-xs font-semibold uppercase tracking-wide">Where the risk is</p>
                <ul className="mt-2 space-y-1.5">
                  {b.simulation.drivers.slice(0, 5).map((d) => (
                    <li key={d.id} className="flex items-center justify-between gap-3 text-xs">
                      <span className="truncate">{d.name || "Unnamed line"}</span>
                      <span className="tabular-nums">{d.contributionPct}%</span>
                    </li>
                  ))}
                </ul>
                <p className="faint mt-2 text-[11px] leading-snug">
                  Share of total variance — not size. The riskiest line is rarely the biggest one.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b" style={{ borderColor: "var(--line-soft)" }}>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Items</th>
              <th className="px-4 py-3 text-right font-medium">Subtotal</th>
              <th className="px-4 py-3 text-right font-medium">% of direct</th>
            </tr>
          </thead>
          <tbody>
            {b.categories.map((cat) => (
              <tr key={cat.category} className="border-b" style={{ borderColor: "var(--line-soft)" }}>
                <td className="px-4 py-2.5">{cat.category}</td>
                <td className="px-4 py-2.5 tabular-nums">{cat.itemCount}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{money(cat.subtotal)}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{cat.pctOfDirect}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="card p-6">
        <h3 className="font-display text-lg">Phasing</h3>
        <div className="mt-4 space-y-2">
          {b.periods.map((p) => {
            const max = Math.max(...b.periods.map((x) => x.loaded), 1);
            return (
              <div key={p.period} className="flex items-center gap-3 text-xs">
                <span className="faint w-20 shrink-0">{p.label}</span>
                <div className="h-4 flex-1 rounded" style={{ background: "var(--line-soft)" }}>
                  <div className="h-4 rounded" style={{ width: `${(p.loaded / max) * 100}%`, background: "var(--brand)" }} />
                </div>
                <span className="w-24 shrink-0 text-right tabular-nums">{money(p.loaded)}</span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="card p-4">
      <p className="faint text-xs font-medium uppercase tracking-wide">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums">{value}</p>
      {hint && <p className="faint mt-0.5 text-[11px]">{hint}</p>}
    </div>
  );
}
