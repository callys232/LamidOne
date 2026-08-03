"use client";

import { useState } from "react";
import { Plus, Trash2, AlertTriangle, Ban } from "lucide-react";
import type { ProcessStep, OptimisationResult } from "@/lib/intelligence/optimisation";

/**
 * Runner for the optimisation archetype (P14, P21, F04).
 *
 * Takes the STEPS OF A PROCESS IN ORDER, because throughput is set by
 * the slowest one and no per-step rating can express that. Effectiveness
 * is separate from capacity on purpose: capacity you have and do not get
 * is the cheapest capacity to recover.
 */

type Row = ProcessStep & { key: string };

const blank = (n: number): Row => ({
  key: Math.random().toString(36).slice(2, 9),
  id: `s${n}_${Math.random().toString(36).slice(2, 6)}`,
  name: "", capacity: 100, efficiencyPct: 100,
});

export function OptimisationRunner({ busy, result, onRun, onReset }: {
  busy: boolean;
  result: OptimisationResult | null;
  onRun: (p: { steps: ProcessStep[] }) => void;
  onReset: () => void;
}) {
  const [rows, setRows] = useState<Row[]>([blank(1), blank(2), blank(3)]);
  const [withCost, setWithCost] = useState(false);

  if (result) return <OptimisationResultView r={result} onReset={onReset} />;

  const upd = (k: string, p: Partial<Row>) => setRows((rs) => rs.map((r) => (r.key === k ? { ...r, ...p } : r)));
  const named = rows.filter((r) => r.name.trim());

  return (
    <div className="space-y-6">
      <section className="card p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-lg">The process, in order</h2>
          <label className="faint flex items-center gap-1.5 text-xs">
            <input type="checkbox" checked={withCost} onChange={(e) => setWithCost(e.target.checked)} />
            Include cost
          </label>
        </div>
        <p className="muted mt-1 text-sm leading-relaxed">
          Capacity is what a step could process per period at full effectiveness. Effectiveness is
          the share you actually get — yield, uptime, quality.
        </p>

        <div className="mt-4 space-y-3">
          {rows.map((r, i) => (
            <div key={r.key} className="rounded-lg border p-3" style={{ borderColor: "var(--line-soft)" }}>
              <div className="flex items-center gap-2">
                <span className="faint text-xs tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                <input value={r.name} onChange={(e) => upd(r.key, { name: e.target.value })}
                       placeholder="Step" aria-label="Step name" className="input flex-1" />
                <span className="faint w-24 shrink-0 text-right text-xs tabular-nums">
                  {Math.round((Number(r.capacity) || 0) * ((Number(r.efficiencyPct) || 0) / 100))} effective
                </span>
                <button type="button" onClick={() => setRows((rs) => rs.filter((x) => x.key !== r.key))}
                        aria-label="Remove step" className="faint shrink-0 hover:text-brand">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className={`mt-2 grid gap-2 ${withCost ? "sm:grid-cols-4" : "sm:grid-cols-2"}`}>
                <label className="block text-sm">
                  <span className="muted mb-1 block text-xs">Capacity per period</span>
                  <input type="number" min={0} value={r.capacity}
                         onChange={(e) => upd(r.key, { capacity: Number(e.target.value) || 0 })}
                         aria-label="Capacity" className="input" />
                </label>
                <label className="block text-sm">
                  <span className="muted mb-1 flex justify-between text-xs">
                    Effectiveness <span className="tabular-nums">{r.efficiencyPct}%</span>
                  </span>
                  <input type="range" min={0} max={100} value={r.efficiencyPct}
                         onChange={(e) => upd(r.key, { efficiencyPct: Number(e.target.value) })}
                         aria-label="Effectiveness" className="w-full accent-brand" />
                </label>
                {withCost && (
                  <>
                    <label className="block text-sm">
                      <span className="muted mb-1 block text-xs">Cost per period</span>
                      <input type="number" min={0} value={r.cost ?? ""}
                             onChange={(e) => upd(r.key, { cost: e.target.value === "" ? undefined : Number(e.target.value) })}
                             aria-label="Cost per period" className="input" />
                    </label>
                    <label className="block text-sm">
                      <span className="muted mb-1 block text-xs">Cost per +1 capacity</span>
                      <input type="number" min={0} value={r.costPerUnitUplift ?? ""}
                             onChange={(e) => upd(r.key, { costPerUnitUplift: e.target.value === "" ? undefined : Number(e.target.value) })}
                             aria-label="Cost per unit uplift" className="input" />
                    </label>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
        <button type="button" onClick={() => setRows((rs) => [...rs, blank(rs.length + 1)])}
                className="btn btn-ghost mt-3 !px-3 !py-1.5 text-xs">
          <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Add step
        </button>
      </section>

      <button type="button" disabled={busy || named.length < 2} className="btn btn-primary disabled:opacity-50"
              onClick={() => onRun({ steps: named.map(({ key: _k, ...s }) => s) })}>
        {busy ? "Analysing…" : "Find the constraint"}
      </button>
    </div>
  );
}

function OptimisationResultView({ r, onReset }: { r: OptimisationResult; onReset: () => void }) {
  const max = Math.max(...r.steps.map((s) => s.effectiveCapacity), 1);

  return (
    <div className="space-y-6">
      <section className="card p-6" style={{ borderColor: "var(--brand)" }}>
        <p className="faint text-xs font-semibold uppercase tracking-wide">The constraint</p>
        <p className="font-display mt-2 text-xl leading-snug">{r.headline}</p>
        <div className="mt-4 flex flex-wrap gap-6">
          <div>
            <p className="faint text-xs">System throughput</p>
            <p className="stat-value text-2xl">{r.throughput}</p>
          </div>
          {r.costPerUnit !== null && (
            <div>
              <p className="faint text-xs">Cost per unit of output</p>
              <p className="stat-value text-2xl">{r.costPerUnit}</p>
            </div>
          )}
          {r.totalIdleCapacity > 0 && (
            <div>
              <p className="faint text-xs">Capacity you cannot use</p>
              <p className="stat-value text-2xl">{r.totalIdleCapacity}</p>
            </div>
          )}
        </div>
      </section>

      <section className="card p-6">
        <h3 className="font-display text-lg">Where the work actually stops</h3>
        <div className="mt-4 space-y-3">
          {r.steps.map((s) => (
            <div key={s.id}>
              <div className="flex items-baseline justify-between text-sm">
                <span className={s.isConstraint ? "font-semibold text-brand" : "font-medium"}>
                  {s.name}
                  {s.isConstraint && <span className="ml-2 text-[10px] uppercase tracking-wide">constraint</span>}
                </span>
                <span className="faint text-xs tabular-nums">
                  {s.effectiveCapacity} effective · {s.utilisationPct}% used
                  {s.idleCapacity > 0 && ` · ${s.idleCapacity} idle`}
                </span>
              </div>
              <div className="mt-1 h-2.5 rounded-full" style={{ background: "var(--line-soft)" }}>
                <div className="h-2.5 rounded-full"
                     style={{
                       width: `${(s.effectiveCapacity / max) * 100}%`,
                       background: s.isConstraint ? "var(--brand)" : "var(--line)",
                     }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {r.upliftOptions.length > 0 && (
        <section className="card p-6">
          <h3 className="font-display text-lg">Worth buying</h3>
          <ul className="mt-3 space-y-3">
            {r.upliftOptions.map((u) => (
              <li key={u.stepId} className="text-sm">
                <p className="font-medium">
                  {u.name}: +{u.maxUsefulUplift} useful capacity → {u.newThroughput} throughput
                  {u.cost !== null && <span className="faint"> · costs {u.cost.toLocaleString()}</span>}
                </p>
                <p className="muted mt-0.5 text-xs leading-relaxed">{u.note}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {r.wastedImprovements.length > 0 && (
        <section className="card p-6">
          <p className="flex items-center gap-2 font-display text-lg">
            <Ban className="h-4 w-4" aria-hidden="true" /> Do not spend here
          </p>
          <p className="muted mt-1 text-sm">
            These are already faster than the system can use. Improving them produces queue, not output.
          </p>
          <ul className="mt-3 space-y-2">
            {r.wastedImprovements.map((w) => (
              <li key={w.name} className="text-sm">
                <span className="font-medium">{w.name}</span>
                <span className="faint"> — {w.why}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {(r.guidance.length > 0 || r.warnings.length > 0) && (
        <section className="card p-5" style={r.warnings.length ? { borderColor: "var(--warn)" } : undefined}>
          {r.warnings.length > 0 && (
            <p className="flex items-center gap-2 text-sm font-semibold">
              <AlertTriangle className="h-4 w-4" aria-hidden="true" /> Worth checking
            </p>
          )}
          <ul className="mt-2 space-y-1.5">
            {[...r.guidance, ...r.warnings].map((g) => (
              <li key={g} className="muted text-sm leading-relaxed">• {g}</li>
            ))}
          </ul>
        </section>
      )}

      <button type="button" onClick={onReset} className="btn btn-ghost">Analyse another process</button>
    </div>
  );
}
