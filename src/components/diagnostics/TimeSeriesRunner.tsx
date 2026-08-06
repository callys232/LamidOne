"use client";

import { useState } from "react";
import { TrendingUp, TrendingDown, Minus, Activity } from "lucide-react";
import type { SeriesMetric, SeriesStats, SeriesTrend } from "@/lib/intelligence/inputSpec";

/**
 * Runner for the timeseries archetype (R-Series cadence, P-Series
 * productivity).
 *
 * Each module declares a fixed set of metrics to track, so the form asks
 * for a value PER PERIOD rather than a single rating — a trend needs at
 * least two points, and no rating can express one.
 */

type Payload = {
  series: { metric: SeriesMetric; values: number[]; target?: number | null }[];
  periodLabel: string;
};

export function TimeSeriesRunner({ metrics, periodLabel, periods, busy, result, onRun, onReset }: {
  metrics: SeriesMetric[];
  periodLabel: string;
  periods: number;
  busy: boolean;
  result: SeriesStats[] | null;
  onRun: (p: Payload) => void;
  onReset: () => void;
}) {
  const [values, setValues] = useState<number[][]>(
    metrics.map((m) => (m.sample && m.sample.length === periods ? [...m.sample] : Array(periods).fill(0))),
  );
  const [targets, setTargets] = useState<number[]>(metrics.map((m) => m.target ?? 0));

  if (result) return <TimeSeriesResultView r={result} onReset={onReset} />;

  const setCell = (mi: number, pi: number, v: number) =>
    setValues((vs) => vs.map((row, i) => (i === mi ? row.map((x, j) => (j === pi ? v : x)) : row)));

  return (
    <div className="space-y-6">
      {metrics.map((m, mi) => (
        <section key={m.key} className="card p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <h2 className="font-display text-lg">{m.label}</h2>
              {m.hint && <p className="muted text-sm">{m.hint}</p>}
            </div>
            <label className="flex items-center gap-1.5 text-xs">
              <span className="muted">Target</span>
              <input
                type="number" value={targets[mi]}
                onChange={(e) => setTargets((ts) => ts.map((t, i) => (i === mi ? Number(e.target.value) || 0 : t)))}
                aria-label={`Target for ${m.label}`} className="input w-20"
              />
              <span className="faint">{m.unit.trim()}</span>
            </label>
          </div>
          <div className="mt-4 grid gap-2" style={{ gridTemplateColumns: `repeat(${periods}, minmax(0,1fr))` }}>
            {values[mi].map((v, pi) => (
              <label key={pi} className="block text-sm">
                <span className="faint mb-1 block text-center text-[11px]">{periodLabel} {pi + 1}</span>
                <input
                  type="number" value={v}
                  onChange={(e) => setCell(mi, pi, Number(e.target.value) || 0)}
                  aria-label={`${m.label} — ${periodLabel} ${pi + 1}`} className="input text-center"
                />
              </label>
            ))}
          </div>
        </section>
      ))}

      <button
        type="button" disabled={busy} className="btn btn-primary disabled:opacity-50"
        onClick={() => onRun({
          series: metrics.map((m, mi) => ({ metric: m, values: values[mi], target: targets[mi] })),
          periodLabel,
        })}
      >
        {busy ? "Analysing…" : "Analyse the trend"}
      </button>
    </div>
  );
}

function trendIcon(t: SeriesTrend) {
  if (t === "rising") return TrendingUp;
  if (t === "falling") return TrendingDown;
  if (t === "volatile") return Activity;
  return Minus;
}

function TimeSeriesResultView({ r, onReset }: { r: SeriesStats[]; onReset: () => void }) {
  return (
    <div className="space-y-6">
      {r.map((s) => {
        const Icon = trendIcon(s.trend);
        const goodTrend = s.betterWhen === "higher" ? s.trend === "rising" : s.trend === "falling";
        const badTrend = s.betterWhen === "higher" ? s.trend === "falling" : s.trend === "rising";
        return (
          <section
            key={s.key} className="card p-6"
            style={{ borderColor: s.onTarget === false ? "var(--warn)" : undefined }}
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-display text-lg">{s.label}</p>
              <span
                className="faint flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide"
                style={{ color: goodTrend ? "var(--good)" : badTrend ? "var(--warn)" : undefined }}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden="true" /> {s.trend}
              </span>
            </div>
            <div className="mt-4 flex flex-wrap gap-6">
              <div>
                <p className="faint text-xs">First → last</p>
                <p className="stat-value text-2xl">{s.first}{s.unit} → {s.last}{s.unit}</p>
              </div>
              <div>
                <p className="faint text-xs">Change</p>
                <p className="stat-value text-2xl">{s.changePct >= 0 ? "+" : ""}{s.changePct}%</p>
              </div>
              {s.target !== null && (
                <div>
                  <p className="faint text-xs">Attainment vs target ({s.target}{s.unit})</p>
                  <p className="stat-value text-2xl">{s.attainment}%</p>
                </div>
              )}
            </div>
            <p className="muted mt-3 text-xs">
              Mean {s.mean}{s.unit} · range {s.min}{s.unit}–{s.max}{s.unit} · volatility {s.volatility}%
            </p>
          </section>
        );
      })}
      <button type="button" onClick={onReset} className="btn btn-ghost">Analyse another run</button>
    </div>
  );
}
