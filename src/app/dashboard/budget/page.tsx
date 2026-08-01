"use client";

import { useState } from "react";
import { authHeaders } from "@/lib/useApi";
import { PROJECT_TYPES, COST_CATEGORIES, type LineItem, type BudgetSettings, type ComputedBudget } from "@/lib/budget/types";

/**
 * F02 — Budgeting & Forecasting, the one flagship diagnostic that is a
 * real calculator rather than an assessment. Free on every tier.
 *
 * Every number shown here is `computeBudget`'s own arithmetic, read
 * straight off the API response — this page formats and lays out, it
 * never recomputes a total client-side.
 */

const newLine = (): LineItem => ({
  id: `li_${Math.random().toString(36).slice(2, 9)}`,
  category: "Other Direct Costs", name: "", quantity: 1, unit: "units", unitCost: 0,
});

export default function BudgetPage() {
  const [settings, setSettings] = useState<BudgetSettings>({
    projectName: "", projectType: "Consulting Engagement", currency: "USD",
    periods: 3, periodLabel: "Month", overheadPct: 10, contingencyPct: 10, taxPct: 0, taxOnOverhead: false,
  });
  const [lines, setLines] = useState<LineItem[]>([newLine()]);
  const [computed, setComputed] = useState<ComputedBudget | null>(null);
  const [csv, setCsv] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateLine(id: string, patch: Partial<LineItem>) {
    setLines((ls) => ls.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }

  async function compute() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/budget", {
        method: "POST", headers: authHeaders(),
        body: JSON.stringify({ lineItems: lines, settings }),
      });
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
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${settings.projectName || "budget"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="faint text-xs font-semibold uppercase tracking-wide">F-Series · Financial Intelligence</p>
        <h1 className="font-display text-2xl">Budgeting &amp; Forecasting</h1>
        <p className="muted mt-2 max-w-2xl text-sm leading-relaxed">
          Build a costed budget line by line. Overhead, contingency and tax recalculate as you edit.
          Free on every tier — nothing here is metered.
        </p>
      </div>

      <div className="card p-6">
        <h2 className="font-semibold">Project settings</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Project name">
            <input value={settings.projectName} onChange={(e) => setSettings((s) => ({ ...s, projectName: e.target.value.slice(0, 160) }))}
              className="input" placeholder="e.g. Q3 platform rollout" />
          </Field>
          <Field label="Project type">
            <select value={settings.projectType} onChange={(e) => setSettings((s) => ({ ...s, projectType: e.target.value as BudgetSettings["projectType"] }))} className="input">
              {PROJECT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Currency">
            <input value={settings.currency} onChange={(e) => setSettings((s) => ({ ...s, currency: e.target.value.slice(0, 3).toUpperCase() }))} className="input" maxLength={3} />
          </Field>
          <Field label="Period label">
            <input value={settings.periodLabel} onChange={(e) => setSettings((s) => ({ ...s, periodLabel: e.target.value.slice(0, 20) }))} className="input" />
          </Field>
          <Field label="Number of periods">
            <input type="number" min={1} value={settings.periods} onChange={(e) => setSettings((s) => ({ ...s, periods: Number(e.target.value) }))} className="input" />
          </Field>
          <Field label="Overhead %">
            <input type="number" min={0} value={settings.overheadPct} onChange={(e) => setSettings((s) => ({ ...s, overheadPct: Number(e.target.value) }))} className="input" />
          </Field>
          <Field label="Contingency %">
            <input type="number" min={0} value={settings.contingencyPct} onChange={(e) => setSettings((s) => ({ ...s, contingencyPct: Number(e.target.value) }))} className="input" />
          </Field>
          <Field label="Tax %">
            <input type="number" min={0} value={settings.taxPct} onChange={(e) => setSettings((s) => ({ ...s, taxPct: Number(e.target.value) }))} className="input" />
          </Field>
        </div>
        <label className="mt-4 flex items-center gap-2 text-sm">
          <input type="checkbox" checked={settings.taxOnOverhead} onChange={(e) => setSettings((s) => ({ ...s, taxOnOverhead: e.target.checked }))} />
          Apply tax to overhead as well as direct costs and contingency
        </label>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Line items</h2>
          <button type="button" onClick={() => setLines((ls) => [...ls, newLine()])} className="btn btn-ghost !px-3 !py-1.5 text-xs">
            Add line
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {lines.map((li) => (
            <div key={li.id} className="grid gap-2 rounded-lg border p-3 sm:grid-cols-6" style={{ borderColor: "var(--line-soft)" }}>
              <input value={li.name} onChange={(e) => updateLine(li.id, { name: e.target.value.slice(0, 160) })} placeholder="Item" className="input sm:col-span-2" />
              <select value={li.category} onChange={(e) => updateLine(li.id, { category: e.target.value as LineItem["category"] })} className="input">
                {COST_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <input type="number" min={0} value={li.quantity} onChange={(e) => updateLine(li.id, { quantity: Number(e.target.value) })} placeholder="Qty" className="input" />
              <input value={li.unit} onChange={(e) => updateLine(li.id, { unit: e.target.value.slice(0, 20) })} placeholder="Unit" className="input" />
              <div className="flex gap-2">
                <input type="number" min={0} value={li.unitCost} onChange={(e) => updateLine(li.id, { unitCost: Number(e.target.value) })} placeholder="Unit cost" className="input" />
                <button type="button" onClick={() => setLines((ls) => ls.filter((l) => l.id !== li.id))} className="faint px-2 hover:text-brand" aria-label="Remove line">×</button>
              </div>
            </div>
          ))}
        </div>

        {error && <p className="mt-4 text-sm" style={{ color: "var(--bad)" }}>{error}</p>}

        <button type="button" onClick={compute} disabled={busy} className="btn btn-primary mt-5 disabled:opacity-50">
          {busy ? "Computing…" : "Compute budget"}
        </button>
      </div>

      {computed && <BudgetResult computed={computed} onDownload={downloadCsv} />}

      <style jsx>{`
        .input { border-radius: 0.5rem; border: 1px solid var(--line); background: var(--page); padding: 0.5rem 0.75rem; font-size: 0.875rem; width: 100%; }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="muted mb-1.5 block text-xs font-medium">{label}</span>
      {children}
    </label>
  );
}

function BudgetResult({ computed, onDownload }: { computed: ComputedBudget; onDownload: () => void }) {
  const { totals, categories, periods, variance, warnings } = computed;
  const money = (n: number) => `${computed.settings.currency} ${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <Stat label="Direct costs" value={money(totals.directCosts)} />
        <Stat label="Overhead" value={money(totals.overhead)} />
        <Stat label="Contingency" value={money(totals.contingency)} />
        <Stat label="Tax" value={money(totals.tax)} />
        <Stat label="Grand total" value={money(totals.grandTotal)} highlight />
      </div>

      {warnings.length > 0 && (
        <div className="card p-5" style={{ borderColor: "var(--warn)" }}>
          <p className="text-sm font-semibold">Worth checking</p>
          <ul className="mt-2 space-y-1.5">
            {warnings.map((w) => <li key={w} className="muted text-sm leading-relaxed">• {w}</li>)}
          </ul>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h3 className="font-semibold">By category</h3>
          <dl className="mt-3 space-y-2 text-sm">
            {categories.map((c) => (
              <div key={c.category} className="flex items-baseline justify-between gap-4">
                <dt className="muted">{c.category} <span className="faint">· {c.itemCount}</span></dt>
                <dd className="font-medium tabular-nums">{money(c.subtotal)} <span className="faint">({c.pctOfDirect}%)</span></dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold">By {computed.settings.periodLabel.toLowerCase()}</h3>
          <dl className="mt-3 space-y-2 text-sm">
            {periods.map((p) => (
              <div key={p.period} className="flex items-baseline justify-between gap-4">
                <dt className="muted">{p.label}</dt>
                <dd className="font-medium tabular-nums">{money(p.loaded)}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {variance.tracked && (
        <div className="card p-5">
          <h3 className="font-semibold">Plan versus actual</h3>
          <dl className="mt-3 grid gap-3 sm:grid-cols-3 text-sm">
            <div><dt className="muted text-xs">Budgeted to date</dt><dd className="font-medium tabular-nums">{money(variance.budgetedToDate)}</dd></div>
            <div><dt className="muted text-xs">Actual to date</dt><dd className="font-medium tabular-nums">{money(variance.actualToDate)}</dd></div>
            <div><dt className="muted text-xs">Variance</dt><dd className="font-medium tabular-nums">{money(variance.variance)} ({variance.variancePct}%)</dd></div>
          </dl>
        </div>
      )}

      <button type="button" onClick={onDownload} className="btn btn-ghost">Download CSV</button>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="card p-5" style={highlight ? { borderColor: "var(--brand)", borderWidth: 1.5 } : undefined}>
      <p className="faint text-xs font-medium uppercase tracking-wide">{label}</p>
      <p className="stat-value mt-1 text-2xl">{value}</p>
    </div>
  );
}
