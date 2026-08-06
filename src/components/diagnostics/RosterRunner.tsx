"use client";

import { useState } from "react";
import { Plus, Trash2, AlertTriangle, ShieldAlert } from "lucide-react";
import type { RoleRow, RosterSummary } from "@/lib/intelligence/roster";

/**
 * Runner for the roster archetype (A02, A03, A04, A06, A21, A22, A24,
 * A25, A26, A28, A30, A31 — the A-Series modules that assess workforce
 * STRUCTURE rather than sentiment).
 *
 * Takes the roles that make up the workforce, because capability gaps,
 * attrition exposure and succession risk are properties of a roster —
 * no single rating can express "who covers this role if they leave."
 */

type Row = RoleRow & { key: string };

const blank = (): Row => ({
  key: Math.random().toString(36).slice(2, 9),
  id: `role_${Math.random().toString(36).slice(2, 6)}`,
  role: "", headcount: 1, capability: 3, attritionRisk: 2, successors: 0, critical: false,
});

export function RosterRunner({ busy, result, onRun, onReset }: {
  busy: boolean;
  result: RosterSummary | null;
  onRun: (p: { roles: RoleRow[] }) => void;
  onReset: () => void;
}) {
  const [rows, setRows] = useState<Row[]>([blank(), blank(), blank()]);

  if (result) return <RosterResultView r={result} onReset={onReset} />;

  const upd = (k: string, p: Partial<Row>) => setRows((rs) => rs.map((r) => (r.key === k ? { ...r, ...p } : r)));
  const named = rows.filter((r) => r.role.trim() && r.headcount > 0);

  return (
    <div className="space-y-6">
      <section className="card p-6">
        <h2 className="font-display text-lg">The roles that make up the workforce</h2>
        <p className="muted mt-1 text-sm leading-relaxed">
          Capability and attrition risk are rated 1–5. Mark a role critical when losing it would stop
          real work — that is what makes a missing successor a single point of failure.
        </p>

        <div className="mt-4 space-y-3">
          {rows.map((r, i) => (
            <div key={r.key} className="rounded-lg border p-3" style={{ borderColor: "var(--line-soft)" }}>
              <div className="flex items-center gap-2">
                <span className="faint text-xs tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                <input
                  value={r.role} onChange={(e) => upd(r.key, { role: e.target.value })}
                  placeholder="Role" aria-label="Role" className="input flex-1"
                />
                <label className="faint flex shrink-0 items-center gap-1.5 text-xs">
                  <input type="checkbox" checked={r.critical} onChange={(e) => upd(r.key, { critical: e.target.checked })} />
                  Critical
                </label>
                <button
                  type="button" onClick={() => setRows((rs) => rs.filter((x) => x.key !== r.key))}
                  aria-label="Remove role" className="faint shrink-0 hover:text-brand"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-2 grid gap-2 sm:grid-cols-4">
                <label className="block text-sm">
                  <span className="muted mb-1 block text-xs">Headcount</span>
                  <input
                    type="number" min={0} value={r.headcount}
                    onChange={(e) => upd(r.key, { headcount: Number(e.target.value) || 0 })}
                    aria-label="Headcount" className="input"
                  />
                </label>
                <label className="block text-sm">
                  <span className="muted mb-1 flex justify-between text-xs">
                    Capability <span className="tabular-nums">{r.capability}/5</span>
                  </span>
                  <input
                    type="range" min={1} max={5} value={r.capability}
                    onChange={(e) => upd(r.key, { capability: Number(e.target.value) })}
                    aria-label="Capability" className="w-full accent-brand"
                  />
                </label>
                <label className="block text-sm">
                  <span className="muted mb-1 flex justify-between text-xs">
                    Attrition risk <span className="tabular-nums">{r.attritionRisk}/5</span>
                  </span>
                  <input
                    type="range" min={1} max={5} value={r.attritionRisk}
                    onChange={(e) => upd(r.key, { attritionRisk: Number(e.target.value) })}
                    aria-label="Attrition risk" className="w-full accent-brand"
                  />
                </label>
                <label className="block text-sm">
                  <span className="muted mb-1 block text-xs">Ready successors</span>
                  <input
                    type="number" min={0} value={r.successors}
                    onChange={(e) => upd(r.key, { successors: Number(e.target.value) || 0 })}
                    aria-label="Ready successors" className="input"
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
        <button type="button" onClick={() => setRows((rs) => [...rs, blank()])} className="btn btn-ghost mt-3 !px-3 !py-1.5 text-xs">
          <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Add role
        </button>
      </section>

      <button
        type="button" disabled={busy || named.length === 0} className="btn btn-primary disabled:opacity-50"
        onClick={() => onRun({ roles: named.map(({ key: _k, ...role }) => role) })}
      >
        {busy ? "Scoring…" : "Score the roster"}
      </button>
    </div>
  );
}

function RosterResultView({ r, onReset }: { r: RosterSummary; onReset: () => void }) {
  return (
    <div className="space-y-6">
      <section className="card p-6" style={{ borderColor: r.warnings.length ? "var(--warn)" : "var(--brand)" }}>
        <div className="flex flex-wrap gap-6">
          <div>
            <p className="faint text-xs">Weighted capability</p>
            <p className="stat-value text-2xl">{r.weightedCapability}/5</p>
          </div>
          <div>
            <p className="faint text-xs">Headcount at risk</p>
            <p className="stat-value text-2xl">{r.atRiskPct}%</p>
          </div>
          <div>
            <p className="faint text-xs">Bench coverage</p>
            <p className="stat-value text-2xl">{r.benchCoveragePct}%</p>
          </div>
          <div>
            <p className="faint text-xs">Workforce</p>
            <p className="stat-value text-2xl">{r.totalHeadcount}</p>
          </div>
        </div>
      </section>

      {r.singlePointRoles.length > 0 && (
        <section className="card p-6" style={{ borderColor: "var(--warn)" }}>
          <p className="flex items-center gap-2 font-display text-lg">
            <ShieldAlert className="h-4 w-4" aria-hidden="true" /> Single points of failure
          </p>
          <p className="muted mt-1 text-sm">Critical roles with no ready successor.</p>
          <ul className="mt-3 space-y-1.5">
            {r.singlePointRoles.map((role) => <li key={role} className="text-sm font-medium">{role}</li>)}
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

      <button type="button" onClick={onReset} className="btn btn-ghost">Score another roster</button>
    </div>
  );
}
