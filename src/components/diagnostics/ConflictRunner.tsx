"use client";

import { useState } from "react";
import { Plus, Trash2, AlertTriangle, Scale } from "lucide-react";
import type { Objective, ConflictResult, Impact } from "@/lib/intelligence/conflict";

/**
 * Runner for the conflict archetype (Q06).
 *
 * Each objective declares the METRICS it moves and the RESOURCES it
 * claims, because conflict is a property of pairs — no per-objective
 * rating can surface that two of them pull the same lever opposite ways.
 */

type Row = Objective & { key: string };

const nid = () => Math.random().toString(36).slice(2, 9);
const blank = (n: number): Row => ({
  key: nid(), id: `o${nid()}`, name: "", priority: 3,
  effects: [{ metric: "", direction: "increases", magnitude: 3 }],
  claims: [],
});

export function ConflictRunner({ busy, result, onRun, onReset }: {
  busy: boolean;
  result: ConflictResult | null;
  onRun: (p: { objectives: Objective[] }) => void;
  onReset: () => void;
}) {
  const [rows, setRows] = useState<Row[]>([blank(1), blank(2)]);

  if (result) return <ConflictResultView r={result} onReset={onReset} />;

  const upd = (k: string, p: Partial<Row>) => setRows((rs) => rs.map((r) => (r.key === k ? { ...r, ...p } : r)));

  return (
    <div className="space-y-6">
      <section className="card p-6">
        <h2 className="font-display text-lg">The objectives you are holding at once</h2>
        <p className="muted mt-1 text-sm leading-relaxed">
          For each one, name the shared things it moves — cost, cycle time, headcount — and which
          way. Two objectives moving the same metric in opposite directions is a conflict no amount
          of effort resolves.
        </p>

        <div className="mt-4 space-y-4">
          {rows.map((r, i) => (
            <div key={r.key} className="rounded-lg border p-4" style={{ borderColor: "var(--line-soft)" }}>
              <div className="flex items-center gap-2">
                <span className="faint text-xs tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                <input value={r.name} onChange={(e) => upd(r.key, { name: e.target.value })}
                       placeholder="e.g. Cut operating cost by 20%" aria-label="Objective" className="input flex-1" />
                <label className="flex shrink-0 items-center gap-1.5 text-xs">
                  <span className="muted">Priority</span>
                  <input type="number" min={1} max={5} value={r.priority}
                         onChange={(e) => upd(r.key, { priority: Number(e.target.value) || 3 })}
                         aria-label="Priority" className="input w-16" />
                </label>
                <button type="button" onClick={() => setRows((rs) => rs.filter((x) => x.key !== r.key))}
                        aria-label="Remove objective" className="faint shrink-0 hover:text-brand">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <p className="faint mt-3 text-[11px] font-semibold uppercase tracking-wide">Metrics it moves</p>
              <div className="mt-1.5 space-y-1.5">
                {(r.effects ?? []).map((e, ei) => (
                  <div key={ei} className="grid gap-2 sm:grid-cols-12">
                    <input value={e.metric}
                           onChange={(ev) => upd(r.key, { effects: (r.effects ?? []).map((x, xi) => xi === ei ? { ...x, metric: ev.target.value } : x) })}
                           placeholder="Metric" aria-label="Metric" className="input sm:col-span-6" />
                    <select value={e.direction}
                            onChange={(ev) => upd(r.key, { effects: (r.effects ?? []).map((x, xi) => xi === ei ? { ...x, direction: ev.target.value as Impact } : x) })}
                            aria-label="Direction" className="input sm:col-span-3">
                      <option value="increases">increases it</option>
                      <option value="decreases">decreases it</option>
                    </select>
                    <input type="number" min={1} max={5} value={e.magnitude}
                           onChange={(ev) => upd(r.key, { effects: (r.effects ?? []).map((x, xi) => xi === ei ? { ...x, magnitude: Number(ev.target.value) || 1 } : x) })}
                           aria-label="Magnitude" className="input sm:col-span-2" />
                    <button type="button" aria-label="Remove metric" className="faint sm:col-span-1 hover:text-brand"
                            onClick={() => upd(r.key, { effects: (r.effects ?? []).filter((_x, xi) => xi !== ei) })}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <button type="button" className="faint mt-1.5 text-[11px] hover:text-brand"
                      onClick={() => upd(r.key, { effects: [...(r.effects ?? []), { metric: "", direction: "increases", magnitude: 3 }] })}>
                + metric
              </button>

              <p className="faint mt-3 text-[11px] font-semibold uppercase tracking-wide">Resources it claims</p>
              <div className="mt-1.5 space-y-1.5">
                {(r.claims ?? []).map((c, ci) => (
                  <div key={ci} className="grid gap-2 sm:grid-cols-12">
                    <input value={c.resource}
                           onChange={(ev) => upd(r.key, { claims: (r.claims ?? []).map((x, xi) => xi === ci ? { ...x, resource: ev.target.value } : x) })}
                           placeholder="Resource" aria-label="Resource" className="input sm:col-span-8" />
                    <div className="flex items-center gap-1 sm:col-span-3">
                      <input type="number" min={0} max={100} value={c.sharePct}
                             onChange={(ev) => upd(r.key, { claims: (r.claims ?? []).map((x, xi) => xi === ci ? { ...x, sharePct: Number(ev.target.value) || 0 } : x) })}
                             aria-label="Share needed" className="input" />
                      <span className="faint text-xs">%</span>
                    </div>
                    <button type="button" aria-label="Remove claim" className="faint sm:col-span-1 hover:text-brand"
                            onClick={() => upd(r.key, { claims: (r.claims ?? []).filter((_x, xi) => xi !== ci) })}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <button type="button" className="faint mt-1.5 text-[11px] hover:text-brand"
                      onClick={() => upd(r.key, { claims: [...(r.claims ?? []), { resource: "", sharePct: 50 }] })}>
                + resource
              </button>
            </div>
          ))}
        </div>

        <button type="button" onClick={() => setRows((rs) => [...rs, blank(rs.length + 1)])}
                className="btn btn-ghost mt-4 !px-3 !py-1.5 text-xs">
          <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Add objective
        </button>
      </section>

      <button type="button" disabled={busy} className="btn btn-primary disabled:opacity-50"
              onClick={() => onRun({
                objectives: rows.filter((r) => r.name.trim()).map(({ key: _k, ...o }) => ({
                  ...o,
                  effects: (o.effects ?? []).filter((e) => e.metric.trim()),
                  claims: (o.claims ?? []).filter((c) => c.resource.trim()),
                })),
              })}>
        {busy ? "Checking…" : "Check for contradictions"}
      </button>
    </div>
  );
}

function ConflictResultView({ r, onReset }: { r: ConflictResult; onReset: () => void }) {
  return (
    <div className="space-y-6">
      <section className="card p-6" style={{ borderColor: r.conflictCount > 0 ? "var(--warn)" : "var(--good)" }}>
        <p className="faint text-xs font-semibold uppercase tracking-wide">Coherence {r.coherencePct}%</p>
        <p className="font-display mt-2 text-xl leading-snug">{r.headline}</p>
      </section>

      {r.conflicts.length > 0 && (
        <section className="card p-6">
          <h3 className="font-display text-lg">Conflicts</h3>
          <ul className="mt-4 space-y-4">
            {r.conflicts.map((c, i) => (
              <li key={i} className="rounded-lg border p-4"
                  style={{ borderColor: c.unarbitrated ? "var(--warn)" : "var(--line-soft)" }}>
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="font-semibold">{c.metric}</span>
                  {c.unarbitrated && (
                    <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--warn)" }}>
                      nothing settles this
                    </span>
                  )}
                  <span className="faint ml-auto text-xs tabular-nums">severity {c.severity}</span>
                </div>
                <p className="muted mt-1.5 text-sm">
                  <strong>{c.aName}</strong> {c.aDirection} it (priority {c.aPriority}) ·{" "}
                  <strong>{c.bName}</strong> {c.bDirection} it (priority {c.bPriority})
                </p>
                <p className="mt-2 text-sm leading-relaxed">{c.resolution}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {r.overloads.length > 0 && (
        <section className="card p-6">
          <p className="flex items-center gap-2 font-display text-lg">
            <Scale className="h-4 w-4" aria-hidden="true" /> Over-committed resources
          </p>
          <ul className="mt-3 space-y-3">
            {r.overloads.map((o) => (
              <li key={o.resource} className="text-sm">
                <p className="font-medium">
                  {o.resource} — {o.claimedPct}% claimed, over by {o.overBy}
                </p>
                <p className="faint mt-0.5 text-xs">
                  {o.claimants.map((c) => `${c.name} ${c.sharePct}%`).join(" · ")}
                </p>
                <p className="muted mt-1 text-xs leading-relaxed">{o.suggestion}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {r.independent.length > 0 && (
        <section className="card p-5">
          <p className="text-sm font-semibold">Independent</p>
          <p className="muted mt-1 text-sm">
            {r.independent.join(", ")} — these touch nothing else in the set and are safe to run in
            parallel.
          </p>
        </section>
      )}

      {(r.guidance.length > 0 || r.warnings.length > 0) && (
        <section className="card p-5">
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

      <button type="button" onClick={onReset} className="btn btn-ghost">Check another set</button>
    </div>
  );
}
