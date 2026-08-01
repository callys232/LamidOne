"use client";

import { useState } from "react";
import { ShieldCheck, ShieldAlert, Clock } from "lucide-react";
import { useApi, apiPost } from "@/lib/useApi";
import { useDashboard } from "@/components/dashboard/DashboardShell";
import { EmptyState } from "@/app/dashboard/page";

type Milestone = {
  id: string; title: string; amount: number; currency: string; status: string;
  aiCertified?: boolean; aiScore?: number; autoReleaseAt?: number; autoReleased?: boolean;
};
type Engagement = { project: { id: string; title: string }; milestones: Milestone[] };

const MS_TONE: Record<string, string> = {
  pending: "var(--ink-faint)", in_progress: "var(--brand)", submitted: "var(--warn)",
  approved: "var(--good)", disputed: "var(--bad)",
};

function Countdown({ at }: { at: number }) {
  const remaining = at - Date.now();
  if (remaining <= 0) return <span className="text-[10px]" style={{ color: "var(--warn)" }}>Due for auto-release</span>;
  const days = Math.ceil(remaining / (24 * 60 * 60 * 1000));
  return <span className="faint text-[10px]">Auto-releases in {days} day{days === 1 ? "" : "s"} if untouched</span>;
}

export default function EngagementsPage() {
  const v = useDashboard();
  const asExpert = v.role === "expert";
  const { data, loading, reload } = useApi<{ engagements: Engagement[] }>(
    `/api/engagements${asExpert ? "?as=expert" : ""}`,
  );

  async function approve(id: string) {
    await apiPost("/api/milestones", { id, action: "approve" }).then(() => reload());
  }
  async function submit(id: string) {
    // eslint-disable-next-line no-alert
    const note = window.prompt("Briefly describe what you are submitting — Sentry certifies against this.") ?? "";
    await apiPost("/api/milestones", { id, action: "submit", note }).then(() => reload());
  }
  async function dispute(id: string) {
    await apiPost("/api/milestones", { id, action: "dispute" }).then(() => reload());
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl">Engagements</h1>
        <p className="muted mt-1 text-sm">
          Live delivery — milestones, submissions and approvals. Sentry automatically certifies a
          submission and starts a {" "}
          <span className="font-medium">silence-fallback release</span> unless you act on it.
        </p>
      </div>

      {loading ? (
        <p className="muted text-sm">Loading…</p>
      ) : !data?.engagements.length ? (
        <EmptyState text="Nothing in delivery yet. An engagement appears here once a bid is accepted." />
      ) : (
        <div className="space-y-4">
          {data.engagements.map((e) => (
            <div key={e.project.id} className="card p-5">
              <p className="font-semibold">{e.project.title}</p>
              {e.milestones.length === 0 ? (
                <p className="muted mt-2 text-xs">No milestones defined yet.</p>
              ) : (
                <div className="divide-hairline mt-3 -mx-1">
                  {e.milestones.map((m) => (
                    <div key={m.id} className="flex flex-col gap-2 px-1 py-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="truncate text-sm">{m.title}</p>
                        <p className="faint text-xs">{m.currency} {m.amount.toLocaleString()}</p>

                        {m.status === "submitted" && typeof m.aiScore === "number" && (
                          <div className="mt-1.5 flex items-center gap-1.5">
                            {m.aiCertified ? (
                              <ShieldCheck className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--good)" }} aria-hidden="true" />
                            ) : (
                              <ShieldAlert className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--warn)" }} aria-hidden="true" />
                            )}
                            <span className="text-[11px]" style={{ color: m.aiCertified ? "var(--good)" : "var(--warn)" }}>
                              Sentry: {m.aiScore}/100 {m.aiCertified ? "certified" : "not certified"}
                            </span>
                            {m.aiCertified && m.autoReleaseAt && (
                              <>
                                <Clock className="h-3 w-3 faint" aria-hidden="true" />
                                <Countdown at={m.autoReleaseAt} />
                              </>
                            )}
                          </div>
                        )}
                        {m.autoReleased && (
                          <p className="mt-1 text-[11px]" style={{ color: "var(--good)" }}>Released automatically — no response within the window.</p>
                        )}
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize"
                              style={{ color: MS_TONE[m.status], border: `1px solid ${MS_TONE[m.status]}` }}>
                          {m.status.replace("_", " ")}
                        </span>
                        {asExpert && (m.status === "pending" || m.status === "in_progress") && (
                          <button type="button" onClick={() => submit(m.id)} className="btn btn-ghost !px-2 !py-1 text-[11px]">Submit</button>
                        )}
                        {!asExpert && m.status === "submitted" && (
                          <>
                            <button type="button" onClick={() => approve(m.id)} className="btn btn-primary !px-2 !py-1 text-[11px]">Approve</button>
                            <button type="button" onClick={() => dispute(m.id)} className="btn btn-ghost !px-2 !py-1 text-[11px]" style={{ color: "var(--bad)" }}>Dispute</button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
