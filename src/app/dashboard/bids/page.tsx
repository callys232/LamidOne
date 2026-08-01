"use client";

import { useApi } from "@/lib/useApi";
import { EmptyState } from "@/app/dashboard/page";

type Row = {
  bid: { id: string; amount: number; currency: string; duration: number; boosted: boolean; status: string; createdAt: number };
  project: { title: string } | null;
};

const STATUS_TONE: Record<string, string> = {
  submitted: "var(--brand)", shortlisted: "var(--warn)", accepted: "var(--good)",
  declined: "var(--bad)", withdrawn: "var(--ink-faint)",
};

export default function BidsPage() {
  const { data, loading } = useApi<{ bids: Row[] }>("/api/bids/mine");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl">My bids</h1>
        <p className="muted mt-1 text-sm">Every bid you have placed, and where it stands.</p>
      </div>

      {loading ? (
        <p className="muted text-sm">Loading…</p>
      ) : !data?.bids.length ? (
        <EmptyState text="You have not bid on anything yet." cta={{ label: "Browse open briefs", href: "/dashboard/experts" }} />
      ) : (
        <div className="divide-hairline card overflow-hidden">
          {data.bids.map(({ bid, project }) => (
            <div key={bid.id} className="flex items-center justify-between gap-4 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{project?.title ?? "Project no longer available"}</p>
                <p className="faint mt-0.5 text-xs">
                  {bid.currency} {bid.amount.toLocaleString()} · {bid.duration} days
                  {bid.boosted && <span className="ml-1.5" style={{ color: "var(--brand)" }}>· boosted</span>}
                </p>
              </div>
              <span
                className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize"
                style={{ color: STATUS_TONE[bid.status], border: `1px solid ${STATUS_TONE[bid.status]}` }}
              >
                {bid.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
