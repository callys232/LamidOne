"use client";

import Link from "next/link";

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
          <p className="faint text-xs font-medium uppercase tracking-wide">Approved to date</p>
          <p className="stat-value mt-1 text-3xl" style={{ color: "var(--good)" }}>
            ${v.escrow.released.toLocaleString()}
          </p>
          <p className="faint mt-1 text-xs">{v.escrow.note}</p>
        </div>
      </div>

      {/* This card previously described fund holds in the present
          tense — "funds are held against a milestone before work
          begins" — on the page a user opens to check their money. No
          hold exists: lib/milestones.ts imports no payment or ledger
          module, and `held` above is a literal 0 for that reason, not
          because the account is empty. Split into what runs today and
          what does not, because a user checking this page is entitled
          to know which half they are looking at. */}
      <div className="card p-6">
        <h2 className="font-display text-lg">What runs today</h2>
        <p className="muted mt-2 text-sm leading-relaxed">
          Every milestone carries a status that is enforced end to end: submitted, then approved by
          the client or approved automatically if they do not respond in the review window. A
          dispute stops that clock immediately and goes to Arbiter, which assembles the evidence
          from both sides. Deliverables, approvals and disputes are all written to the audit trail.
        </p>

        <h2 className="font-display mt-6 text-lg">What does not run yet</h2>
        <p className="muted mt-2 text-sm leading-relaxed">
          Fund holds. No balance is held against a milestone and none is transferred when one is
          approved — approval clears an amount for payout, it does not move it. That is why
          &ldquo;Currently held&rdquo; reads zero rather than a figure. It is listed on the{" "}
          <Link href="/trust" className="link-underline">trust centre</Link> alongside everything
          else we have not built, and this page will say &ldquo;released&rdquo; on the day it is
          true and not before.
        </p>
      </div>

      {v.work.completed === 0 && (
        <EmptyState text="No engagements have completed yet." />
      )}
    </div>
  );
}
