"use client";

import { useState } from "react";
import { Plus, Trash2, AlertTriangle } from "lucide-react";
import type {
  PathwayInput, GrowthPathwaysResult, AnsoffQuadrant, Horizon, Confidence,
} from "@/lib/intelligence/growthPathways";

/**
 * G03 runner.
 *
 * Enters CANDIDATE PATHWAYS, not ratings — the module compares options
 * against each other under a capacity constraint, so the input has to
 * be a set of options rather than a set of sliders. The quadrant field
 * is the important one: it sets structural risk the user cannot argue
 * with, only change by changing what the pathway actually is.
 */

const QUADRANTS: { id: AnsoffQuadrant; label: string; hint: string }[] = [
  { id: "penetration",         label: "Market penetration",  hint: "Existing offer → existing market. Safest." },
  { id: "market_development",  label: "Market development",  hint: "Existing offer → new market." },
  { id: "product_development", label: "Product development", hint: "New offer → existing market." },
  { id: "diversification",     label: "Diversification",     hint: "New offer → new market. Both unknowns at once." },
];

const HORIZONS: { id: Horizon; label: string }[] = [
  { id: 1, label: "H1 — defend the core" },
  { id: 2, label: "H2 — build the emerging" },
  { id: 3, label: "H3 — option on the future" },
];

const CONFIDENCE: { id: Confidence; label: string }[] = [
  { id: 0, label: "Asserted" },
  { id: 1, label: "Indicative" },
  { id: 2, label: "Evidenced" },
];

type Row = PathwayInput;

const blank = (): Row => ({
  id: `pw_${Math.random().toString(36).slice(2, 9)}`,
  name: "", quadrant: "penetration", horizon: 1,
  marketAttractiveness: 3, capabilityFit: 3, investmentLevel: 2,
  timeToRevenueMonths: 6, confidence: 1, load: 1,
});

export function GrowthPathwaysRunner({
  busy, result, onRun, onReset,
}: {
  busy: boolean;
  result: GrowthPathwaysResult | null;
  onRun: (payload: { pathways: Row[]; capacity: number }) => void;
  onReset: () => void;
}) {
  const [rows, setRows] = useState<Row[]>([blank(), blank()]);
  const [capacity, setCapacity] = useState(3);

  if (result) return <PathwaysResult r={result} onReset={onReset} />;

  const upd = (id: string, p: Partial<Row>) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...p } : r)));

  return (
    <div className="space-y-6">
      <section className="card p-6">
        <h2 className="font-display text-lg">How much can you actually run?</h2>
        <p className="muted mt-1 text-sm leading-relaxed">
          Growth strategies fail on execution bandwidth far more often than on idea quality.
          Ranking without a limit produces a wish list; this returns a sequence.
        </p>
        <label className="mt-4 block max-w-xs text-sm">
          <span className="muted mb-1.5 block text-xs font-medium">Concurrent pathways you can resource</span>
          <input type="number" min={1} max={12} value={capacity}
                 onChange={(e) => setCapacity(Math.max(1, Number(e.target.value) || 1))}
                 aria-label="Execution capacity" className="input" />
        </label>
      </section>

      <section className="card p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-lg">Candidate pathways</h2>
          <span className="faint text-xs">{rows.length} candidates</span>
        </div>
        <p className="muted mt-1 text-sm">
          Include the ones you expect to reject. A single option is a proposal, not a choice.
        </p>

        <div className="mt-5 space-y-5">
          {rows.map((r, i) => (
            <div key={r.id} className="rounded-lg border p-4" style={{ borderColor: "var(--line-soft)" }}>
              <div className="flex items-center gap-2">
                <span className="faint text-xs font-semibold tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                <input value={r.name} onChange={(e) => upd(r.id, { name: e.target.value })}
                       placeholder="e.g. Enter East Africa with the existing offer"
                       aria-label="Pathway name" className="input flex-1" />
                <button type="button" onClick={() => setRows((rs) => rs.filter((x) => x.id !== r.id))}
                        aria-label="Remove pathway" className="faint shrink-0 hover:text-brand">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="block text-sm">
                  <span className="muted mb-1 block text-xs font-medium">What kind of move is it</span>
                  <select value={r.quadrant} onChange={(e) => upd(r.id, { quadrant: e.target.value as AnsoffQuadrant })}
                          aria-label="Ansoff quadrant" className="input">
                    {QUADRANTS.map((q) => <option key={q.id} value={q.id}>{q.label}</option>)}
                  </select>
                  <span className="faint mt-1 block text-[11px]">
                    {QUADRANTS.find((q) => q.id === r.quadrant)?.hint}
                  </span>
                </label>
                <label className="block text-sm">
                  <span className="muted mb-1 block text-xs font-medium">Horizon</span>
                  <select value={r.horizon} onChange={(e) => upd(r.id, { horizon: Number(e.target.value) as Horizon })}
                          aria-label="Horizon" className="input">
                    {HORIZONS.map((h) => <option key={h.id} value={h.id}>{h.label}</option>)}
                  </select>
                </label>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <Slider label="Market attractiveness" value={r.marketAttractiveness}
                        onChange={(v) => upd(r.id, { marketAttractiveness: v })} />
                <Slider label="Capability fit" value={r.capabilityFit}
                        onChange={(v) => upd(r.id, { capabilityFit: v })} />
                <Slider label="Investment needed" value={r.investmentLevel}
                        onChange={(v) => upd(r.id, { investmentLevel: v })} />
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <label className="block text-sm">
                  <span className="muted mb-1 block text-xs font-medium">Months to revenue</span>
                  <input type="number" min={0} value={r.timeToRevenueMonths}
                         onChange={(e) => upd(r.id, { timeToRevenueMonths: Number(e.target.value) || 0 })}
                         aria-label="Months to revenue" className="input" />
                </label>
                <label className="block text-sm">
                  <span className="muted mb-1 block text-xs font-medium">Evidence behind the case</span>
                  <select value={r.confidence} onChange={(e) => upd(r.id, { confidence: Number(e.target.value) as Confidence })}
                          aria-label="Confidence" className="input">
                    {CONFIDENCE.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                </label>
                <label className="block text-sm">
                  <span className="muted mb-1 block text-xs font-medium">Capacity slots it consumes</span>
                  <input type="number" min={1} value={r.load ?? 1}
                         onChange={(e) => upd(r.id, { load: Math.max(1, Number(e.target.value) || 1) })}
                         aria-label="Capacity load" className="input" />
                </label>
              </div>
            </div>
          ))}
        </div>

        <button type="button" onClick={() => setRows((rs) => [...rs, blank()])}
                className="btn btn-ghost mt-4 !px-3 !py-1.5 text-xs">
          <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Add pathway
        </button>
      </section>

      <button type="button" disabled={busy || rows.every((r) => !r.name.trim())}
              onClick={() => onRun({ pathways: rows.filter((r) => r.name.trim()), capacity })}
              className="btn btn-primary disabled:opacity-50">
        {busy ? "Comparing…" : "Compare and sequence"}
      </button>
    </div>
  );
}

function Slider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="block text-sm">
      <span className="muted mb-1 flex items-center justify-between text-xs font-medium">
        {label} <span className="tabular-nums">{value}/5</span>
      </span>
      <input type="range" min={0} max={5} step={1} value={value}
             onChange={(e) => onChange(Number(e.target.value))}
             aria-label={label} className="w-full accent-brand" />
    </label>
  );
}

function PathwaysResult({ r, onReset }: { r: GrowthPathwaysResult; onReset: () => void }) {
  return (
    <div className="space-y-6">
      <section className="card p-6" style={{ borderColor: "var(--brand)" }}>
        <p className="faint text-xs font-semibold uppercase tracking-wide">The sequence</p>
        <p className="font-display mt-2 text-xl leading-snug">{r.headline}</p>
        <p className="faint mt-2 text-xs">
          Using {r.capacityUsed} of {r.capacity} capacity slots.
        </p>
      </section>

      {r.selected.length > 0 && (
        <section className="card p-6">
          <h3 className="font-display text-lg">Do these, in order</h3>
          <ol className="mt-4 space-y-4">
            {r.selected.map((s) => (
              <li key={s.pathway.id} className="flex gap-4">
                <span className="stat-value shrink-0 text-2xl text-brand">{s.sequence}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{s.pathway.name}</p>
                  <p className="faint mt-0.5 text-xs">
                    {s.pathway.quadrantLabel} · H{s.pathway.horizon} · {s.pathway.timeToRevenueMonths} months to revenue
                  </p>
                  <div className="mt-2 flex items-center gap-3">
                    <div className="h-1.5 flex-1 rounded-full" style={{ background: "var(--line-soft)" }}>
                      <div className="h-1.5 rounded-full" style={{ width: `${s.pathway.riskAdjustedPct}%`, background: "var(--brand)" }} />
                    </div>
                    <span className="shrink-0 text-xs tabular-nums">
                      {s.pathway.rawValuePct}% → <strong>{s.pathway.riskAdjustedPct}%</strong>
                    </span>
                  </div>
                  <p className="muted mt-1.5 text-xs leading-relaxed">{s.pathway.rationale}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {r.portfolioWarnings.length > 0 && (
        <section className="card p-5" style={{ borderColor: "var(--warn)" }}>
          <p className="flex items-center gap-2 text-sm font-semibold">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" /> The portfolio, not the pathways
          </p>
          <p className="faint mt-1 text-xs">Each of these can be true while every individual choice is sound.</p>
          <ul className="mt-2 space-y-1.5">
            {r.portfolioWarnings.map((w) => <li key={w} className="muted text-sm leading-relaxed">• {w}</li>)}
          </ul>
        </section>
      )}

      {r.deferred.length > 0 && (
        <section className="card p-6">
          <h3 className="font-display text-lg">Deferred, and why</h3>
          <ul className="mt-3 space-y-2">
            {r.deferred.map((d) => (
              <li key={d.pathway.id} className="text-sm">
                <span className="font-medium">{d.pathway.name}</span>
                <span className="faint"> — {d.why}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="card p-6">
        <h3 className="font-display text-lg">Horizon balance</h3>
        <div className="mt-3 space-y-2">
          {r.horizonMix.map((h) => (
            <div key={h.horizon} className="flex items-center gap-3 text-sm">
              <span className="muted w-64 shrink-0 text-xs">{h.label}</span>
              <div className="h-2 flex-1 rounded-full" style={{ background: "var(--line-soft)" }}>
                <div className="h-2 rounded-full" style={{ width: `${h.sharePct}%`, background: "var(--brand)" }} />
              </div>
              <span className="faint w-12 shrink-0 text-right text-xs tabular-nums">{h.count}</span>
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

      <button type="button" onClick={onReset} className="btn btn-ghost">Compare another set</button>
    </div>
  );
}
