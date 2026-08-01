"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useDashboard } from "@/components/dashboard/DashboardShell";
import { useApi, authHeaders } from "@/lib/useApi";

type Bid = {
  id: string; projectId: string; expertId: string; amount: number; currency: string;
  duration: number; pitch: string; boosted: boolean;
  status: "submitted" | "shortlisted" | "accepted" | "declined" | "withdrawn";
  createdAt: number;
};
type Project = {
  id: string; clientId: string; title: string; brief: string; status: string;
  awardedExpertId?: string; budget: { min: number; max: number; currency: string };
};

/**
 * Project detail — where "receive bids" actually turns into "hire
 * someone." Before this page and its award/withdraw wiring, there was
 * no way anywhere in the app to accept a bid; a client could only ever
 * look at a pile of submissions.
 */
export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const id = String(params.id);
  const v = useDashboard();
  const { data, error, loading, reload } = useApi<{ project: Project | null; bids: Bid[] }>(`/api/projects/${id}/bids`);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function award(bidId: string) {
    setBusyId(bidId);
    setActionError(null);
    try {
      const res = await fetch(`/api/projects/${id}/award`, { method: "POST", headers: authHeaders(), body: JSON.stringify({ bidId }) });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error ?? "Could not award this bid.");
      reload();
    } catch (e) {
      setActionError((e as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  async function withdraw(bidId: string) {
    setBusyId(bidId);
    setActionError(null);
    try {
      const res = await fetch(`/api/bids/${bidId}`, { method: "PATCH", headers: authHeaders(), body: JSON.stringify({ action: "withdraw" }) });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error ?? "Could not withdraw this bid.");
      reload();
    } catch (e) {
      setActionError((e as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <div className="card h-64 animate-pulse" style={{ background: "var(--line-soft)" }} />;
  if (error || !data?.project) return <p className="muted text-sm">{error ?? "Project not found."}</p>;

  const { project, bids } = data;
  const canAward = v.role !== "expert" && project.status === "open";

  return (
    <div className="space-y-8">
      <div>
        <p className="faint text-xs font-semibold uppercase tracking-wide capitalize">{project.status.replace("_", " ")}</p>
        <h1 className="font-display text-2xl">{project.title}</h1>
        <p className="muted mt-2 max-w-2xl text-sm leading-relaxed">{project.brief}</p>
        <p className="faint mt-2 text-xs">
          Budget {project.budget.currency} {project.budget.min.toLocaleString()}–{project.budget.max.toLocaleString()}
        </p>
      </div>

      {actionError && <p className="text-sm" style={{ color: "var(--bad)" }}>{actionError}</p>}

      <div>
        <h2 className="mb-4 font-display text-xl">Bids ({bids.length})</h2>
        {bids.length === 0 ? (
          <p className="muted text-sm">No bids yet.</p>
        ) : (
          <div className="grid gap-3">
            {bids.map((b) => (
              <div key={b.id} className="card p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-semibold">
                      {b.currency} {b.amount.toLocaleString()} · {b.duration} working days
                      {b.boosted && <span className="ml-2 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase" style={{ background: "var(--brand-soft)", color: "var(--brand)" }}>Boosted</span>}
                    </p>
                    <p className="muted mt-2 text-sm leading-relaxed">{b.pitch}</p>
                  </div>
                  <BidStatus status={b.status} />
                </div>

                <div className="mt-4 flex gap-2">
                  {canAward && (b.status === "submitted" || b.status === "shortlisted") && (
                    <button type="button" onClick={() => award(b.id)} disabled={busyId === b.id} className="btn btn-primary !px-3 !py-1.5 text-xs disabled:opacity-50">
                      {busyId === b.id ? "Awarding…" : "Award this bid"}
                    </button>
                  )}
                  {v.role === "expert" && (b.status === "submitted" || b.status === "shortlisted") && (
                    <button type="button" onClick={() => withdraw(b.id)} disabled={busyId === b.id} className="btn btn-ghost !px-3 !py-1.5 text-xs disabled:opacity-50">
                      {busyId === b.id ? "Withdrawing…" : "Withdraw"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const STATUS_TONE: Record<Bid["status"], string> = {
  submitted: "var(--ink-muted)", shortlisted: "var(--brand)", accepted: "var(--good)",
  declined: "var(--bad)", withdrawn: "var(--ink-faint)",
};

function BidStatus({ status }: { status: Bid["status"] }) {
  return (
    <span
      className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize"
      style={{ color: STATUS_TONE[status], border: `1px solid ${STATUS_TONE[status]}` }}
    >
      {status}
    </span>
  );
}
