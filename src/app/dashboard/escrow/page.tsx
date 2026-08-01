"use client";

import { useDashboard } from "@/components/dashboard/DashboardShell";
import { EmptyState } from "@/app/dashboard/page";

/**
 * Escrow.
 *
 * `held` is reported as 0 until the escrow service is wired in — see
 * the note in dashboardData.ts. A wrong number about money someone is
 * trusting the platform with is worse than an honest zero, so this page
 * shows the zero rather than a plausible-looking estimate.
 */
export default function EscrowPage() {
  const v = useDashboard();

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="card p-5">
          <p className="faint text-xs font-medium uppercase tracking-wide">Currently held</p>
          <p className="stat-value mt-1 text-3xl">${v.escrow.held.toLocaleString()}</p>
          <p className="faint mt-1 text-xs">{v.escrow.currency}</p>
        </div>
        <div className="card p-5">
          <p className="faint text-xs font-medium uppercase tracking-wide">Released to date</p>
          <p className="stat-value mt-1 text-3xl" style={{ color: "var(--good)" }}>
            ${v.escrow.released.toLocaleString()}
          </p>
          <p className="faint mt-1 text-xs">{v.escrow.note}</p>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="font-display text-lg">How this works</h2>
        <p className="muted mt-2 text-sm leading-relaxed">
          Funds are held against a milestone before work begins and release only when the client
          approves the deliverable. A disputed milestone goes to Arbiter, which assembles evidence
          from both sides before anything moves.
        </p>
      </div>

      {v.work.completed === 0 && (
        <EmptyState text="No engagements have settled through escrow yet." />
      )}
    </div>
  );
}
