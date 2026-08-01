"use client";

import Link from "next/link";
import { useDashboard } from "@/components/dashboard/DashboardShell";
import { TIERS_BY_ID } from "@/content/tiers";

export default function BillingPage() {
  const v = useDashboard();
  const tier = TIERS_BY_ID[v.tier];

  return (
    <div className="space-y-8">
      <div className="card p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="faint text-xs font-medium uppercase tracking-wide">Current plan</p>
            <p className="mt-1 font-display text-2xl">{tier.name}</p>
            <p className="muted mt-1 text-sm">{tier.positioning}</p>
          </div>
          <Link href="/pricing" className="btn btn-secondary shrink-0 !px-4 !py-2 text-xs">Compare plans</Link>
        </div>

        <dl className="mt-6 grid gap-4 border-t pt-5 sm:grid-cols-3" style={{ borderColor: "var(--line-soft)" }}>
          <div>
            <dt className="faint text-xs">Price</dt>
            <dd className="mt-0.5 text-sm font-semibold">
              {tier.price.monthly === null ? "Custom" : tier.price.monthly === 0 ? "Free" : `$${tier.price.annual}/mo billed annually`}
            </dd>
          </div>
          <div>
            <dt className="faint text-xs">Seats</dt>
            <dd className="mt-0.5 text-sm font-semibold">
              {tier.seatsIncluded ? `${tier.seatsIncluded} included` : "Per seat"}
            </dd>
          </div>
          <div>
            <dt className="faint text-xs">Monthly points</dt>
            <dd className="mt-0.5 text-sm font-semibold">{tier.pointsMonthly.toLocaleString()}</dd>
          </div>
        </dl>
      </div>

      <div className="card p-6">
        <h2 className="font-display text-lg">Seat pricing</h2>
        <p className="muted mt-2 text-sm leading-relaxed">
          Seat price follows your account tier, not the number of suites you use. Adding a suite
          never re-prices a seat you already pay for — only moving to a higher tier does.
        </p>
        {tier.extraSeat && (
          <p className="mt-3 text-sm">
            Additional seat: <span className="font-semibold">${tier.extraSeat} / month</span>
          </p>
        )}
      </div>

      <div className="card p-6">
        <h2 className="font-display text-lg">Invoices</h2>
        <p className="muted mt-2 text-sm">
          No invoices yet — this account has not been billed. Invoices will appear here once a
          subscription payment is taken.
        </p>
      </div>
    </div>
  );
}
