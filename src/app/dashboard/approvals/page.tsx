"use client";

import { useApi, apiPost } from "@/lib/useApi";
import { EmptyState } from "@/app/dashboard/page";

/**
 * Approvals — pending milestones above a threshold that need sign-off.
 * Reuses the milestone `submitted` state rather than a parallel
 * approval-queue model; "approvals" is a view over engagements, not a
 * separate system that could disagree with them.
 */
type Engagement = { project: { id: string; title: string }; milestones: { id: string; title: string; amount: number; currency: string; status: string }[] };

export default function ApprovalsPage() {
  const { data, loading, reload } = useApi<{ engagements: Engagement[] }>("/api/engagements");
  const pending = (data?.engagements ?? [])
    .flatMap((e) => e.milestones.filter((m) => m.status === "submitted").map((m) => ({ ...m, project: e.project.title })));

  async function approve(id: string) {
    await apiPost("/api/milestones", { id, action: "approve" }).then(() => reload());
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl">Approvals</h1>
        <p className="muted mt-1 text-sm">Submitted milestones waiting on your sign-off.</p>
      </div>

      {loading ? (
        <p className="muted text-sm">Loading…</p>
      ) : pending.length === 0 ? (
        <EmptyState text="Nothing waiting on approval." />
      ) : (
        <div className="divide-hairline card overflow-hidden">
          {pending.map((m) => (
            <div key={m.id} className="flex items-center justify-between gap-4 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{m.title}</p>
                <p className="faint text-xs">{m.project} · {m.currency} {m.amount.toLocaleString()}</p>
              </div>
              <button onClick={() => approve(m.id)} className="btn btn-primary shrink-0 !px-3 !py-1.5 text-xs">Approve</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
