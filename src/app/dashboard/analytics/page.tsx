"use client";

import { useState } from "react";
import { useDashboard } from "@/components/dashboard/DashboardShell";
import { useApi } from "@/lib/useApi";

/**
 * Analytics — Growth and above. Spend, throughput and outcomes.
 *
 * The report builder below replaced two illustrative mock charts.
 * Every row comes from `/api/reports`, which reads the same lib
 * functions (listProjects, listCompleted, historyAsync, listTickets)
 * every other dashboard page reads — not a separate analytics
 * dataset that could disagree with them.
 */
const SOURCES = [
  { id: "points", label: "Points spend" },
  { id: "projects", label: "Projects by status" },
  { id: "completed", label: "Completed engagements by month" },
  { id: "tickets", label: "Support tickets by status" },
] as const;

type Row = { key: string; count: number; sum?: number };

export default function AnalyticsPage() {
  const v = useDashboard();
  const [source, setSource] = useState<(typeof SOURCES)[number]["id"]>("points");
  const { data, loading, error } = useApi<{ rows: Row[]; total: number }>(`/api/reports?source=${source}`);

  const max = data?.rows.length ? Math.max(...data.rows.map((r) => r.count)) : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl">Analytics</h1>
        <p className="muted mt-1 text-sm">Spend, throughput and outcomes over time.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        {v.headline.map((s) => (
          <div key={s.label} className="card p-5">
            <p className="faint text-xs font-medium uppercase tracking-wide">{s.label}</p>
            <p className="stat-value mt-1 text-2xl">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold">Report builder</h2>
          <div className="flex flex-wrap gap-1.5">
            {SOURCES.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSource(s.id)}
                className="rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
                style={source === s.id
                  ? { background: "var(--brand)", color: "var(--brand-ink)" }
                  : { background: "var(--line-soft)" }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6">
          {loading && <div className="h-40 animate-pulse rounded-lg" style={{ background: "var(--line-soft)" }} />}
          {error && <p className="text-sm" style={{ color: "var(--bad)" }}>{error}</p>}
          {data && data.rows.length === 0 && <p className="muted text-sm">Nothing to report on yet.</p>}
          {data && data.rows.length > 0 && (
            <div className="space-y-3">
              {data.rows.map((r) => (
                <div key={r.key} className="flex items-center gap-3">
                  <span className="w-32 shrink-0 truncate text-xs font-medium capitalize">{r.key.replace(/_/g, " ")}</span>
                  <div className="h-6 flex-1 overflow-hidden rounded-md" style={{ background: "var(--line-soft)" }}>
                    <div
                      className="h-full rounded-md bg-brand transition-all"
                      style={{ width: max > 0 ? `${(r.count / max) * 100}%` : "0%" }}
                    />
                  </div>
                  <span className="w-24 shrink-0 text-right text-xs tabular-nums">
                    {r.count} {typeof r.sum === "number" && `· ${r.sum >= 0 ? "+" : ""}${r.sum.toLocaleString()}`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
