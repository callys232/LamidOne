"use client";

import { useDashboard } from "@/components/dashboard/DashboardShell";
import { responseTargetFor, type TierId } from "@/content/tiers";

/**
 * SLA — the tier's own published commitment, restated here rather than
 * a second number. Actual response-time measurement against tickets is
 * not built (no timestamped ticket resolution yet), so this shows the
 * commitment honestly rather than a fabricated "actual" column.
 */
export default function SlaPage() {
  const v = useDashboard();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl">SLA tracker</h1>
        <p className="muted mt-1 text-sm">Your plan&apos;s response commitment.</p>
      </div>

      <div className="card p-6">
        <p className="faint text-xs font-medium uppercase tracking-wide">First response target</p>
        <p className="stat-value mt-1 text-3xl">{responseTargetFor(v.tier as TierId)}</p>
        <p className="muted mt-3 text-sm">
          Measured resolution times against tickets are not yet tracked here — raise a ticket from
          Support and we will surface actuals once that history exists.
        </p>
      </div>
    </div>
  );
}
