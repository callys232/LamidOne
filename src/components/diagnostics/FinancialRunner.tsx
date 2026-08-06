"use client";

import { useState } from "react";
import { Plus, Trash2, AlertTriangle } from "lucide-react";
import { OPEX_CATEGORIES, type FinancialPeriodInput, type FinancialSummary, type OpexCategory } from "@/lib/intelligence/financial";

/**
 * Runner for the financial archetype (F01, F03, F05, F06, F07 — every
 * F-Series module except F02, which runs the dedicated budget tool).
 *
 * Takes revenue, cost of delivery and operating expense PER PERIOD,
 * because margin, runway and cost concentration are only visible across
 * a run — a single-period rating cannot show a line growing faster than
 * revenue.
 */

type Payload = {
  currency: string; periodLabel: string; periods: FinancialPeriodInput[];
  cashBalance: number; headcount: number;
};

type PeriodRow = FinancialPeriodInput & { key: string };

const blankPeriod = (): PeriodRow => ({
  key: Math.random().toString(36).slice(2, 9), revenue: 0, cogs: 0, opex: 0,
});

export function FinancialRunner({ periodLabel, periods: periodCount, busy, result, onRun, onReset }: {
  periodLabel: string;
  periods: number;
  busy: boolean;
  result: FinancialSummary | null;
  onRun: (p: Payload) => void;
  onReset: () => void;
}) {
  const [currency, setCurrency] = useState("USD");
  const [cashBalance, setCashBalance] = useState(0);
  const [headcount, setHeadcount] = useState(0);
  const [withBreakdown, setWithBreakdown] = useState(false);
  const [rows, setRows] = useState<PeriodRow[]>(Array.from({ length: Math.max(1, periodCount) }, blankPeriod));

  if (result) return <FinancialResultView r={result} onReset={onReset} />;

  const upd = (k: string, p: Partial<PeriodRow>) => setRows((rs) => rs.map((r) => (r.key === k ? { ...r, ...p } : r)));
  const updBreakdown = (k: string, cat: OpexCategory, v: number) =>
    setRows((rs) => rs.map((r) => (r.key === k ? { ...r, opexBreakdown: { ...r.opexBreakdown, [cat]: v } } : r)));

  return (
    <div className="space-y-6">
      <section className="card p-6">
        <h2 className="font-display text-lg">The business, in brief</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <label className="block text-sm">
            <span className="muted mb-1.5 block text-xs font-medium">Currency</span>
            <input value={currency} onChange={(e) => setCurrency(e.target.value)} aria-label="Currency" className="input" />
          </label>
          <label className="block text-sm">
            <span className="muted mb-1.5 block text-xs font-medium">Cash on hand</span>
            <input
              type="number" value={cashBalance}
              onChange={(e) => setCashBalance(Number(e.target.value) || 0)}
              aria-label="Cash balance" className="input"
            />
          </label>
          <label className="block text-sm">
            <span className="muted mb-1.5 block text-xs font-medium">Headcount</span>
            <input
              type="number" min={0} value={headcount}
              onChange={(e) => setHeadcount(Number(e.target.value) || 0)}
              aria-label="Headcount" className="input"
            />
          </label>
        </div>
      </section>

      <section className="card p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-lg">
            Revenue, cost of delivery and operating expense — per {periodLabel.toLowerCase()}
          </h2>
          <label className="faint flex items-center gap-1.5 text-xs">
            <input type="checkbox" checked={withBreakdown} onChange={(e) => setWithBreakdown(e.target.checked)} />
            Split operating expense by category
          </label>
        </div>

        <div className="mt-4 space-y-3">
          {rows.map((r, i) => (
            <div key={r.key} className="rounded-lg border p-3" style={{ borderColor: "var(--line-soft)" }}>
              <div className="flex items-center justify-between">
                <p className="faint text-xs tabular-nums">{periodLabel} {i + 1}</p>
                <button
                  type="button" onClick={() => setRows((rs) => (rs.length > 1 ? rs.filter((x) => x.key !== r.key) : rs))}
                  aria-label="Remove period" className="faint hover:text-brand"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                <label className="block text-sm">
                  <span className="muted mb-1 block text-xs">Revenue</span>
                  <input
                    type="number" value={r.revenue}
                    onChange={(e) => upd(r.key, { revenue: Number(e.target.value) || 0 })}
                    aria-label={`Revenue — ${periodLabel} ${i + 1}`} className="input"
                  />
                </label>
                <label className="block text-sm">
                  <span className="muted mb-1 block text-xs">Cost of delivery</span>
                  <input
                    type="number" value={r.cogs}
                    onChange={(e) => upd(r.key, { cogs: Number(e.target.value) || 0 })}
                    aria-label={`Cost of delivery — ${periodLabel} ${i + 1}`} className="input"
                  />
                </label>
                <label className="block text-sm">
                  <span className="muted mb-1 block text-xs">Operating expense</span>
                  <input
                    type="number" value={r.opex}
                    onChange={(e) => upd(r.key, { opex: Number(e.target.value) || 0 })}
                    aria-label={`Operating expense — ${periodLabel} ${i + 1}`} className="input"
                  />
                </label>
              </div>
              {withBreakdown && (
                <div className="mt-2 grid gap-2 sm:grid-cols-4">
                  {OPEX_CATEGORIES.map((cat) => (
                    <label key={cat} className="block text-sm">
                      <span className="muted mb-1 block text-[11px]">{cat}</span>
                      <input
                        type="number" value={r.opexBreakdown?.[cat] ?? ""}
                        onChange={(e) => updBreakdown(r.key, cat, e.target.value === "" ? 0 : Number(e.target.value))}
                        aria-label={`${cat} — ${periodLabel} ${i + 1}`} className="input"
                      />
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        <button
          type="button" onClick={() => setRows((rs) => [...rs, blankPeriod()])}
          className="btn btn-ghost mt-3 !px-3 !py-1.5 text-xs"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Add {periodLabel.toLowerCase()}
        </button>
      </section>

      <button
        type="button" disabled={busy} className="btn btn-primary disabled:opacity-50"
        onClick={() => onRun({
          currency, periodLabel, cashBalance, headcount,
          periods: rows.map(({ key: _k, ...p }) => p),
        })}
      >
        {busy ? "Computing…" : "Run the numbers"}
      </button>
    </div>
  );
}

function FinancialResultView({ r, onReset }: { r: FinancialSummary; onReset: () => void }) {
  return (
    <div className="space-y-6">
      <section className="card p-6" style={{ borderColor: r.warnings.length ? "var(--warn)" : "var(--brand)" }}>
        <div className="flex flex-wrap gap-6">
          <div>
            <p className="faint text-xs">Gross margin</p>
            <p className="stat-value text-2xl">{r.grossMarginPct}%</p>
          </div>
          <div>
            <p className="faint text-xs">Operating margin</p>
            <p className="stat-value text-2xl">{r.operatingMarginPct}%</p>
          </div>
          <div>
            <p className="faint text-xs">Revenue growth</p>
            <p className="stat-value text-2xl">{r.revenueGrowthPct >= 0 ? "+" : ""}{r.revenueGrowthPct}%</p>
          </div>
          {r.runwayPeriods !== null ? (
            <div>
              <p className="faint text-xs">Runway</p>
              <p className="stat-value text-2xl">{r.runwayPeriods} {r.periodLabel.toLowerCase()}s</p>
            </div>
          ) : (
            <div>
              <p className="faint text-xs">Position</p>
              <p className="stat-value text-2xl">Profitable</p>
            </div>
          )}
        </div>
      </section>

      <section className="card p-6">
        <h3 className="font-display text-lg">By {r.periodLabel.toLowerCase()}</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: "var(--line-soft)" }}>
                {[r.periodLabel, "Revenue", "Gross profit", "Gross margin", "Operating profit", "Operating margin"].map((h) => (
                  <th key={h} className="whitespace-nowrap px-3 py-2 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {r.periodsDerived.map((p) => (
                <tr key={p.index} className="border-b" style={{ borderColor: "var(--line-soft)" }}>
                  <td className="px-3 py-2 tabular-nums">{p.index}</td>
                  <td className="whitespace-nowrap px-3 py-2 tabular-nums">{r.currency} {p.revenue.toLocaleString()}</td>
                  <td className="whitespace-nowrap px-3 py-2 tabular-nums">{r.currency} {p.grossProfit.toLocaleString()}</td>
                  <td className="px-3 py-2 tabular-nums">{p.grossMarginPct}%</td>
                  <td className="whitespace-nowrap px-3 py-2 tabular-nums">{r.currency} {p.operatingProfit.toLocaleString()}</td>
                  <td className="px-3 py-2 tabular-nums">{p.operatingMarginPct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {r.revenuePerHead > 0 && (
          <p className="muted mt-3 text-xs">Revenue per head: {r.currency} {r.revenuePerHead.toLocaleString()}</p>
        )}
      </section>

      {r.opexLines.length > 0 && (
        <section className="card p-6">
          <h3 className="font-display text-lg">Where operating expense sits</h3>
          <ul className="mt-4 space-y-3">
            {r.opexLines.map((l) => (
              <li key={l.category} className="text-sm">
                <div className="flex items-baseline justify-between gap-2">
                  <span
                    className={l.outpacingRevenue ? "font-semibold" : "font-medium"}
                    style={l.outpacingRevenue ? { color: "var(--warn)" } : undefined}
                  >
                    {l.category}
                    {l.outpacingRevenue && <span className="ml-2 text-[10px] uppercase tracking-wide">outpacing revenue</span>}
                  </span>
                  <span className="faint whitespace-nowrap text-xs tabular-nums">
                    {r.currency} {l.total.toLocaleString()} · {l.pctOfOpex}% of opex
                  </span>
                </div>
              </li>
            ))}
          </ul>
          <p className="faint mt-3 text-xs">Concentration: {r.concentrationPct}% sits in the largest line.</p>
        </section>
      )}

      {r.warnings.length > 0 && (
        <section className="card p-5" style={{ borderColor: "var(--warn)" }}>
          <p className="flex items-center gap-2 text-sm font-semibold">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" /> Worth checking
          </p>
          <ul className="mt-2 space-y-1.5">
            {r.warnings.map((w) => <li key={w} className="muted text-sm leading-relaxed">• {w}</li>)}
          </ul>
        </section>
      )}

      <button type="button" onClick={onReset} className="btn btn-ghost">Run another set of figures</button>
    </div>
  );
}
