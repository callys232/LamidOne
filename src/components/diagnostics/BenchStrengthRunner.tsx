"use client";

import { useState } from "react";
import { Plus, Trash2, AlertTriangle, UserPlus } from "lucide-react";
import type {
  RoleInput, SuccessorInput, BenchStrengthResult, Readiness, FlightRisk, CoverState,
} from "@/lib/intelligence/benchStrength";

/**
 * A22 runner.
 *
 * Enters SEATS AND THE PEOPLE BEHIND THEM, not ratings. Succession
 * cover is answered per seat, so the input has to be a set of seats —
 * a slider for "bench depth" would ask the user to summarise the very
 * thing the engine exists to compute.
 *
 * The readiness field is the important one: it is a DATE, not a rating.
 * "Ready in 24 months" is not a weaker "ready now", and a successor who
 * arrives after the seat is empty is not cover at all.
 */

const READINESS: { id: Readiness; label: string; hint: string }[] = [
  { id: "now", label: "Ready now", hint: "Could hold the seat this quarter." },
  { id: "12m", label: "Within 12 months", hint: "With the development already under way." },
  { id: "24m", label: "Within 24 months", hint: "Identified, but a way off." },
  { id: "development", label: "In development", hint: "No date set. Does not count as cover." },
];

const RISK: { id: FlightRisk; label: string }[] = [
  { id: "low", label: "Stable" },
  { id: "medium", label: "Some risk" },
  { id: "high", label: "High risk" },
  { id: "leaving", label: "Leaving" },
];

const COVER_STYLE: Record<CoverState, { label: string; tone: string }> = {
  covered: { label: "Covered", tone: "var(--good)" },
  thin: { label: "Thin", tone: "var(--warn)" },
  uncovered: { label: "Uncovered", tone: "var(--bad)" },
};

const rid = () => `r_${Math.random().toString(36).slice(2, 8)}`;

const blankSuccessor = (): SuccessorInput => ({ person: "", readiness: "now" });
const blankRole = (): RoleInput => ({
  id: rid(),
  title: "",
  criticality: 4,
  incumbentFlightRisk: "medium",
  noticeMonths: 6,
  successors: [blankSuccessor()],
});

export function BenchStrengthRunner({
  busy, result, onRun, onReset,
}: {
  busy: boolean;
  result: BenchStrengthResult | null;
  onRun: (payload: { roles: RoleInput[] }) => void;
  onReset: () => void;
}) {
  const [roles, setRoles] = useState<RoleInput[]>([blankRole()]);

  if (result) return <BenchResult r={result} onReset={onReset} />;

  const patch = (i: number, next: Partial<RoleInput>) =>
    setRoles((rs) => rs.map((r, n) => (n === i ? { ...r, ...next } : r)));

  const patchSuccessor = (ri: number, si: number, next: Partial<SuccessorInput>) =>
    setRoles((rs) =>
      rs.map((r, n) =>
        n === ri ? { ...r, successors: r.successors.map((s, m) => (m === si ? { ...s, ...next } : s)) } : r,
      ),
    );

  const ready = roles.some((r) => r.title.trim());

  return (
    <div className="space-y-5">
      {roles.map((role, i) => (
        <section key={role.id} className="card p-6">
          <div className="flex items-start gap-3">
            <input
              value={role.title}
              onChange={(e) => patch(i, { title: e.target.value })}
              placeholder="The seat — e.g. Chief Financial Officer"
              className="input flex-1"
              aria-label={`Role ${i + 1} title`}
            />
            {roles.length > 1 && (
              <button
                type="button"
                onClick={() => setRoles((rs) => rs.filter((_, n) => n !== i))}
                className="btn btn-ghost shrink-0"
                aria-label={`Remove ${role.title || `role ${i + 1}`}`}
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>

          <div className="mt-5 grid gap-5 sm:grid-cols-3">
            <label className="block text-sm">
              <span className="muted mb-1.5 flex justify-between">
                How badly it hurts if empty <span className="tabular-nums">{role.criticality}/5</span>
              </span>
              <input
                type="range" min={1} max={5} step={1} value={role.criticality}
                onChange={(e) => patch(i, { criticality: Number(e.target.value) })}
                className="w-full accent-brand"
              />
            </label>

            <label className="block text-sm">
              <span className="muted mb-1.5 block">Incumbent</span>
              <select
                value={role.incumbentFlightRisk}
                onChange={(e) => patch(i, { incumbentFlightRisk: e.target.value as FlightRisk })}
                className="input w-full"
              >
                {RISK.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
              </select>
            </label>

            <label className="block text-sm">
              <span className="muted mb-1.5 block">Notice you would get (months)</span>
              <input
                type="number" min={0} max={36} value={role.noticeMonths ?? 6}
                onChange={(e) => patch(i, { noticeMonths: Number(e.target.value) })}
                className="input w-full"
              />
            </label>
          </div>

          <div className="mt-6 border-t pt-5" style={{ borderColor: "var(--line-soft)" }}>
            <p className="faint text-xs font-semibold uppercase tracking-wide">Who is behind this seat</p>
            <div className="mt-3 space-y-2.5">
              {role.successors.map((s, si) => (
                <div key={si} className="flex flex-col gap-2.5 sm:flex-row">
                  <input
                    value={s.person}
                    onChange={(e) => patchSuccessor(i, si, { person: e.target.value })}
                    placeholder="Name"
                    className="input flex-1"
                    aria-label={`Successor ${si + 1} for ${role.title || `role ${i + 1}`}`}
                  />
                  <select
                    value={s.readiness}
                    onChange={(e) => patchSuccessor(i, si, { readiness: e.target.value as Readiness })}
                    className="input sm:w-56"
                    aria-label={`Readiness of successor ${si + 1}`}
                  >
                    {READINESS.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
                  </select>
                  {role.successors.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setRoles((rs) => rs.map((r, n) => n === i ? { ...r, successors: r.successors.filter((_, m) => m !== si) } : r))}
                      className="btn btn-ghost shrink-0"
                      aria-label="Remove successor"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setRoles((rs) => rs.map((r, n) => n === i ? { ...r, successors: [...r.successors, blankSuccessor()] } : r))}
              className="link-underline mt-3 inline-flex items-center gap-1.5 text-sm"
            >
              <UserPlus className="h-4 w-4" aria-hidden="true" /> Add a successor
            </button>
            <p className="faint mt-3 text-xs leading-relaxed">
              Leave it empty if there genuinely is nobody. An empty seat is the finding — filling it
              with a name that is not ready is how a succession grid flatters itself.
            </p>
          </div>
        </section>
      ))}

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => setRoles((rs) => [...rs, blankRole()])} className="btn btn-secondary">
          <Plus className="h-4 w-4" aria-hidden="true" /> Add a seat
        </button>
        <button
          type="button"
          disabled={busy || !ready}
          onClick={() => onRun({ roles: roles.filter((r) => r.title.trim()) })}
          className="btn btn-primary disabled:opacity-50"
        >
          {busy ? "Scoring…" : "Score the bench"}
        </button>
        <span className="faint text-xs">
          Free to fill in. 40 points to see the result, charged only on completion.
        </span>
      </div>
    </div>
  );
}

function BenchResult({ r, onReset }: { r: BenchStrengthResult; onReset: () => void }) {
  return (
    <div className="space-y-6">
      <section className="card p-6" style={{ borderColor: "var(--brand)" }}>
        <p className="faint text-xs font-semibold uppercase tracking-wide">Cover</p>
        <p className="font-display mt-2 text-xl leading-snug">{r.headline}</p>
        <p className="faint mt-2 text-xs">
          {r.coveredPct}% of seats have two or more successors ready inside the notice period.
          {r.criticalSeats > 0 && ` ${r.criticalSeats} seat(s) rated critical.`}
        </p>
      </section>

      {r.planWarnings.length > 0 && (
        <section className="card p-5" style={{ borderColor: "var(--warn)" }}>
          <p className="flex items-center gap-2 text-sm font-semibold">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" /> The plan, not the seats
          </p>
          <p className="faint mt-1 text-xs">Each of these can be true while every individual seat looks defensible.</p>
          <ul className="mt-2 space-y-1.5">
            {r.planWarnings.map((w) => <li key={w} className="muted text-sm leading-relaxed">• {w}</li>)}
          </ul>
        </section>
      )}

      {r.priorities.length > 0 && (
        <section className="card p-6">
          <h3 className="font-display text-lg">Work in this order</h3>
          <p className="faint mt-1 text-xs">
            Exposure is criticality × how likely the incumbent is to go × how short the cover is.
          </p>
          <ol className="mt-4 space-y-4">
            {r.priorities.map((p, i) => (
              <li key={p.id} className="flex gap-4">
                <span className="stat-value shrink-0 text-2xl text-brand">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-baseline gap-x-3 font-semibold">
                    {p.title}
                    <span
                      className="rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide"
                      style={{ border: `1px solid ${COVER_STYLE[p.cover].tone}`, color: COVER_STYLE[p.cover].tone }}
                    >
                      {COVER_STYLE[p.cover].label}
                    </span>
                  </p>
                  <p className="faint mt-0.5 text-xs">
                    Criticality {p.criticality}/5 · {p.flightRiskLabel} · {p.noticeMonths} months notice · exposure{" "}
                    <span className="tabular-nums">{p.exposure}</span>
                  </p>
                  <p className="muted mt-1.5 text-xs leading-relaxed">{p.reading}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {r.concentration.length > 0 && (
        <section className="card p-6">
          <h3 className="font-display text-lg">Named on more than one seat</h3>
          <p className="faint mt-1 text-xs">They can only take one of them.</p>
          <ul className="mt-3 space-y-2">
            {r.concentration.map((c) => (
              <li key={c.person} className="text-sm">
                <span className="font-medium">{c.person}</span>
                <span className="faint"> — {c.seats.join(", ")}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="card p-6">
        <h3 className="font-display text-lg">Every seat</h3>
        <div className="mt-3 divide-hairline">
          {r.roles.map((role) => (
            <div key={role.id} className="flex flex-col gap-1 py-3.5 sm:flex-row sm:items-baseline sm:gap-6">
              <span className="font-medium sm:w-64 sm:shrink-0">{role.title}</span>
              <span className="text-sm tabular-nums" style={{ color: COVER_STYLE[role.cover].tone }}>
                {role.coverDepth} ready in time
              </span>
              <span className="muted text-xs leading-relaxed">{role.reading}</span>
            </div>
          ))}
        </div>
      </section>

      {r.warnings.length > 0 && (
        <section className="card p-5">
          <ul className="space-y-1.5">
            {r.warnings.map((w) => <li key={w} className="muted text-sm leading-relaxed">• {w}</li>)}
          </ul>
        </section>
      )}

      <button type="button" onClick={onReset} className="btn btn-ghost">Score another bench</button>
    </div>
  );
}
