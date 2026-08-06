"use client";

import { useState } from "react";
import { Plus, Trash2, AlertTriangle, Trophy, Shield } from "lucide-react";
import type { ScenarioOption, ScenarioSummary } from "@/lib/intelligence/scenario";

/**
 * Runner for the (plain) scenario archetype — Q05, Q24, Q46, Q59, Q60,
 * Q61, Q69: modules that weigh discrete options rather than assess a
 * capability. Distinct from the scenario-DECISION archetype (options
 * against possible futures) — here each option gets one probability,
 * one upside, one downside, and the engine ranks by expected value with
 * a breakeven sensitivity check.
 */

type Row = ScenarioOption & { key: string };

const blank = (n: number): Row => ({
  key: Math.random().toString(36).slice(2, 9),
  id: `opt${n}_${Math.random().toString(36).slice(2, 6)}`,
  name: "", probability: 50, upside: 0, downside: 0, cost: 0, horizon: 3,
});

export function ScenarioOptionsRunner({ busy, result, onRun, onReset }: {
  busy: boolean;
  result: ScenarioSummary | null;
  onRun: (p: { options: ScenarioOption[] }) => void;
  onReset: () => void;
}) {
  const [rows, setRows] = useState<Row[]>([blank(1), blank(2)]);

  if (result) return <ScenarioResultView r={result} onReset={onReset} />;

  const upd = (k: string, p: Partial<Row>) => setRows((rs) => rs.map((r) => (r.key === k ? { ...r, ...p } : r)));
  const named = rows.filter((r) => r.name.trim());

  return (
    <div className="space-y-6">
      <section className="card p-6">
        <h2 className="font-display text-lg">The options on the table</h2>
        <p className="muted mt-1 text-sm leading-relaxed">
          Upside is the value if it lands, downside the loss if it does not, both in your own unit.
          Probability is your honest estimate of the upside landing.
        </p>

        <div className="mt-4 space-y-3">
          {rows.map((r, i) => (
            <div key={r.key} className="rounded-lg border p-3" style={{ borderColor: "var(--line-soft)" }}>
              <div className="flex items-center gap-2">
                <span className="faint text-xs tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                <input
                  value={r.name} onChange={(e) => upd(r.key, { name: e.target.value })}
                  placeholder="Option" aria-label="Option name" className="input flex-1"
                />
                <button
                  type="button" onClick={() => setRows((rs) => rs.filter((x) => x.key !== r.key))}
                  aria-label="Remove option" className="faint shrink-0 hover:text-brand"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-2 grid gap-2 sm:grid-cols-5">
                <label className="block text-sm">
                  <span className="muted mb-1 flex justify-between text-xs">
                    Probability <span className="tabular-nums">{r.probability}%</span>
                  </span>
                  <input
                    type="range" min={0} max={100} value={r.probability}
                    onChange={(e) => upd(r.key, { probability: Number(e.target.value) })}
                    aria-label="Probability" className="w-full accent-brand"
                  />
                </label>
                <label className="block text-sm">
                  <span className="muted mb-1 block text-xs">Upside</span>
                  <input
                    type="number" value={r.upside}
                    onChange={(e) => upd(r.key, { upside: Number(e.target.value) || 0 })}
                    aria-label="Upside" className="input"
                  />
                </label>
                <label className="block text-sm">
                  <span className="muted mb-1 block text-xs">Downside</span>
                  <input
                    type="number" min={0} value={r.downside}
                    onChange={(e) => upd(r.key, { downside: Number(e.target.value) || 0 })}
                    aria-label="Downside" className="input"
                  />
                </label>
                <label className="block text-sm">
                  <span className="muted mb-1 block text-xs">Cost</span>
                  <input
                    type="number" min={0} value={r.cost}
                    onChange={(e) => upd(r.key, { cost: Number(e.target.value) || 0 })}
                    aria-label="Cost" className="input"
                  />
                </label>
                <label className="block text-sm">
                  <span className="muted mb-1 block text-xs">Horizon (months)</span>
                  <input
                    type="number" min={1} value={r.horizon}
                    onChange={(e) => upd(r.key, { horizon: Number(e.target.value) || 1 })}
                    aria-label="Horizon in months" className="input"
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
        <button
          type="button" onClick={() => setRows((rs) => [...rs, blank(rs.length + 1)])}
          className="btn btn-ghost mt-3 !px-3 !py-1.5 text-xs"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Add option
        </button>
      </section>

      <button
        type="button" disabled={busy || named.length < 2} className="btn btn-primary disabled:opacity-50"
        onClick={() => onRun({ options: named.map(({ key: _k, ...o }) => o) })}
      >
        {busy ? "Comparing…" : "Compare the options"}
      </button>
    </div>
  );
}

function ScenarioResultView({ r, onReset }: { r: ScenarioSummary; onReset: () => void }) {
  return (
    <div className="space-y-6">
      <section className="card p-6">
        <div className="space-y-3">
          {r.options.map((o) => (
            <div
              key={o.id} className="rounded-lg border p-4"
              style={{ borderColor: o.id === r.best?.id ? "var(--brand)" : "var(--line-soft)" }}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-semibold">
                  #{o.rank} {o.name}
                  {o.id === r.best?.id && (
                    <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-brand">
                      <Trophy className="h-3 w-3" aria-hidden="true" /> highest value
                    </span>
                  )}
                  {o.id === r.safest?.id && o.id !== r.best?.id && (
                    <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide">
                      <Shield className="h-3 w-3" aria-hidden="true" /> safest
                    </span>
                  )}
                </span>
                <span className="faint text-xs tabular-nums">
                  EV {o.expectedValue.toLocaleString()} · net {o.netExpected.toLocaleString()} · {o.probability}% likely
                </span>
              </div>
              <p className="muted mt-1 text-xs">
                Risk spread {o.range.toLocaleString()} · {o.horizon}mo horizon · value/month {o.valuePerMonth.toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </section>

      {r.sensitivity.some((s) => s.breakevenPct !== null) && (
        <section className="card p-6">
          <h3 className="font-display text-lg">How fragile the ranking is</h3>
          <ul className="mt-3 space-y-2">
            {r.sensitivity.filter((s) => s.breakevenPct !== null).map((s) => (
              <li key={s.challenger} className="text-sm">
                <span className="font-medium">{s.challenger}</span> overtakes{" "}
                <span className="font-medium">{s.leader}</span> at {s.breakevenPct}% probability
                (currently {s.currentPct}%{s.flipsEasily && <span style={{ color: "var(--warn)" }}> — fragile</span>})
              </li>
            ))}
          </ul>
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

      <button type="button" onClick={onReset} className="btn btn-ghost">Compare another set</button>
    </div>
  );
}
