"use client";

import { useDashboard } from "@/components/dashboard/DashboardShell";
import { BarChartMock, DashboardMock } from "@/components/mock/ProductMock";

/**
 * Analytics — Growth and above. Spend, throughput and outcomes.
 *
 * Uses the same mock chart components the marketing pages use for
 * illustration, but wired to this account's real headline numbers
 * rather than sample data — the chart shape is illustrative (a proper
 * time series needs historical snapshots this build does not persist
 * yet), the numbers beside it are real.
 */
export default function AnalyticsPage() {
  const v = useDashboard();

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

      <div className="grid gap-5 sm:grid-cols-2">
        <DashboardMock label="Engine activity" />
        <BarChartMock label="Points spend by week" />
      </div>

      <p className="faint text-xs">
        Historical trend requires stored daily snapshots, which this build does not persist yet —
        the charts above illustrate the shape; the numbers above them are your real current totals.
      </p>
    </div>
  );
}
