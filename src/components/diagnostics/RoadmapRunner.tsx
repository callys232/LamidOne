"use client";

import { useState } from "react";
import { Plus, Trash2, AlertTriangle } from "lucide-react";
import type { Initiative, RoadmapResult } from "@/lib/intelligence/roadmap";

/**
 * Runner for the roadmap archetype (A03, A26, C06, G04, G07, Q31, Q56).
 *
 * Takes INITIATIVES with dependencies and a per-period capacity, because
 * a plan that ignores either is a wish list. The dependency selector is
 * restricted to initiatives already named, so a plan cannot reference
 * something that does not exist.
 */

type Row = Initiative & { key: string };

const blank = (n: number): Row => ({
  key: Math.random().toString(36).slice(2, 9),
  id: `i${n}_${Math.random().toString(36).slice(2, 6)}`,
  name: "", value: 3, effort: 2, dependsOn: [], mandatory: false,
});

export function RoadmapRunner({ busy, result, onRun, onReset }: {
  busy: boolean;
  result: RoadmapResult | null;
  onRun: (p: { initiatives: Initiative[]; periods: number; capacityPerPeriod: number; periodLabel: string }) => void;
  onReset: () => void;
}) {
  const [rows, setRows] = useState<Row[]>([blank(1), blank(2), blank(3)]);
  const [periods, setPeriods] = useState(4);
  const [capacity, setCapacity] = useState(10);
  const [label, setLabel] = useState("Quarter");

  if (result) return <RoadmapResultView r={result} label={label} onReset={onReset} />;

  const upd = (k: string, p: Partial<Row>) => setRows((rs) => rs.map((r) => (r.key === k ? { ...r, ...p } : r)));
  const named = rows.filter((r) => r.name.trim());

  return (
    <div className="space-y-6">
      <section className="card p-6">
        <h2 className="font-display text-lg">The horizon</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <label className="block text-sm">
            <span className="muted mb-1.5 block text-xs font-medium">Period unit</span>
            <select value={label} onChange={(e) => setLabel(e.target.value)} aria-label="Period unit" className="input">
              {["Quarter", "Month", "Sprint", "Half", "Year"].map((x) => <option key={x}>{x}</option>)}
            </select>
          </label>
          <label className="block text-sm">
            <span className="muted mb-1.5 block text-xs font-medium">How many</span>
            <input type="number" min={1} max={24} value={periods}
                   onChange={(e) => setPeriods(Math.max(1, Number(e.target.value) || 1))}
                   aria-label="Number of periods" className="input" />
          </label>
          <label className="block text-sm">
            <span className="muted mb-1.5 block text-xs font-medium">Effort available each period</span>
            <input type="number" min={1} value={capacity}
                   onChange={(e) => setCapacity(Math.max(1, Number(e.target.value) || 1))}
                   aria-label="Capacity per period" className="input" />
          </label>
        </div>
        <p className="faint mt-3 text-xs leading-relaxed">
          Capacity is per period, not in total. Work that all needs the same period does not fit
          merely because it fits the year.
        </p>
      </section>

      <section className="card p-6">
        <h2 className="font-display text-lg">Initiatives</h2>
        <p className="muted mt-1 text-sm">
          Value is the benefit if delivered; effort uses the same unit as capacity.
        </p>
        <div className="mt-4 space-y-3">
          {rows.map((r, i) => (
            <div key={r.key} className="rounded-lg border p-3" style={{ borderColor: "var(--line-soft)" }}>
              <div className="flex items-center gap-2">
                <span className="faint text-xs tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                <input value={r.name} onChange={(e) => upd(r.key, { name: e.target.value })}
                       placeholder="Initiative" aria-label="Initiative name" className="input flex-1" />
                <button type="button" onClick={() => setRows((rs) => rs.filter((x) => x.key !== r.key))}
                        aria-label="Remove initiative" className="faint shrink-0 hover:text-brand">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-2 grid gap-2 sm:grid-cols-4">
                <label className="block text-sm">
                  <span className="muted mb-1 flex justify-between text-xs">
                    Value <span className="tabular-nums">{r.value}/5</span>
                  </span>
                  <input type="range" min={0} max={5} value={r.value}
                         onChange={(e) => upd(r.key, { value: Number(e.target.value) })}
                         aria-label="Value" className="w-full accent-brand" />
                </label>
                <label className="block text-sm">
                  <span className="muted mb-1 block text-xs">Effort</span>
                  <input type="number" min={0} value={r.effort}
                         onChange={(e) => upd(r.key, { effort: Number(e.target.value) || 0 })}
                         aria-label="Effort" className="input" />
                </label>
                <label className="block text-sm">
                  <span className="muted mb-1 block text-xs">Must follow</span>
                  <select value={r.dependsOn?.[0] ?? ""}
                          onChange={(e) => upd(r.key, { dependsOn: e.target.value ? [e.target.value] : [] })}
                          aria-label="Depends on" className="input">
                    <option value="">nothing</option>
                    {named.filter((o) => o.id !== r.id).map((o) => (
                      <option key={o.id} value={o.id}>{o.name}</option>
                    ))}
                  </select>
                </label>
                <label className="faint flex items-end gap-1.5 pb-2 text-xs">
                  <input type="checkbox" checked={Boolean(r.mandatory)}
                         onChange={(e) => upd(r.key, { mandatory: e.target.checked })} />
                  Mandatory
                </label>
              </div>
            </div>
          ))}
        </div>
        <button type="button" onClick={() => setRows((rs) => [...rs, blank(rs.length + 1)])}
                className="btn btn-ghost mt-3 !px-3 !py-1.5 text-xs">
          <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Add initiative
        </button>
      </section>

      <button type="button" disabled={busy || named.length === 0} className="btn btn-primary disabled:opacity-50"
              onClick={() => onRun({
                initiatives: named.map(({ key: _k, ...i }) => i),
                periods, capacityPerPeriod: capacity, periodLabel: label,
              })}>
        {busy ? "Sequencing…" : "Build the plan"}
      </button>
    </div>
  );
}

function RoadmapResultView({ r, label, onReset }: { r: RoadmapResult; label: string; onReset: () => void }) {
  return (
    <div className="space-y-6">
      <section className="card p-6" style={{ borderColor: "var(--brand)" }}>
        <p className="faint text-xs font-semibold uppercase tracking-wide">The plan</p>
        <p className="font-display mt-2 text-xl leading-snug">{r.headline}</p>
        {r.criticalPathLength > 0 && (
          <p className="muted mt-3 text-sm">
            Critical path is {r.criticalPathLength} {label.toLowerCase()}
            {r.criticalPathLength === 1 ? "" : "s"}: {r.criticalPath.join(" → ")}. No amount of extra
            capacity compresses that.
          </p>
        )}
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {r.periods.map((p) => (
          <section key={p.period} className="card p-4">
            <div className="flex items-baseline justify-between">
              <p className="font-semibold">{label} {p.period}</p>
              <span className="faint text-xs tabular-nums">{p.utilisationPct}%</span>
            </div>
            <div className="mt-1.5 h-1.5 rounded-full" style={{ background: "var(--line-soft)" }}>
              <div className="h-1.5 rounded-full"
                   style={{ width: `${Math.min(100, p.utilisationPct)}%`, background: "var(--brand)" }} />
            </div>
            {p.items.length === 0 ? (
              <p className="faint mt-3 text-xs">Nothing scheduled.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {p.items.map((i) => (
                  <li key={i.id} className="text-sm">
                    <span className="font-medium">{i.name}</span>
                    {i.mandatory && <span className="faint ml-1.5 text-[10px] uppercase">must</span>}
                    <span className="faint block text-[11px] leading-snug">{i.reason}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>

      {r.unscheduled.length > 0 && (
        <section className="card p-5" style={{ borderColor: "var(--warn)" }}>
          <p className="flex items-center gap-2 text-sm font-semibold">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" /> Did not fit
          </p>
          <ul className="mt-2 space-y-1.5">
            {r.unscheduled.map((u) => (
              <li key={u.id} className="text-sm">
                <span className="font-medium">{u.name}</span>
                <span className="faint"> — {u.why}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {(r.guidance.length > 0 || r.warnings.length > 0) && (
        <section className="card p-5">
          <ul className="space-y-1.5">
            {[...r.guidance, ...r.warnings].map((g) => (
              <li key={g} className="muted text-sm leading-relaxed">• {g}</li>
            ))}
          </ul>
        </section>
      )}

      <button type="button" onClick={onReset} className="btn btn-ghost">Plan another</button>
    </div>
  );
}
