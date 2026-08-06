"use client";

import { useState } from "react";
import { ShieldCheck, ShieldAlert, Clock, Upload, AlertTriangle } from "lucide-react";
import { useApi, apiPost, authHeaders } from "@/lib/useApi";
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
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  async function approve(id: string) {
    await apiPost("/api/milestones", { id, action: "approve" }).then(() => reload());
  }
  async function submitNote(id: string, note: string) {
    await apiPost("/api/milestones", { id, action: "submit", note }).then(() => reload());
    setSubmittingId(null);
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
                    <div key={m.id} className="px-1 py-3">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
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
                            <button type="button" onClick={() => setSubmittingId(submittingId === m.id ? null : m.id)}
                                    className="btn btn-ghost !px-2 !py-1 text-[11px]">
                              {submittingId === m.id ? "Cancel" : "Submit"}
                            </button>
                          )}
                          {!asExpert && m.status === "submitted" && (
                            <>
                              <button type="button" onClick={() => approve(m.id)} className="btn btn-primary !px-2 !py-1 text-[11px]">Approve</button>
                              <button type="button" onClick={() => dispute(m.id)} className="btn btn-ghost !px-2 !py-1 text-[11px]" style={{ color: "var(--bad)" }}>Dispute</button>
                            </>
                          )}
                        </div>
                      </div>

                      {submittingId === m.id && (
                        <SubmitForm onSubmit={(note) => submitNote(m.id, note)} onCancel={() => setSubmittingId(null)} />
                      )}
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

/**
 * Was `window.prompt()` — one line, no way to attach the actual
 * deliverable. Now a real form: type a note directly, or upload a
 * .docx/.pdf and have its text extracted into the note field via
 * lib/extractDeliverableText.ts, reviewable and editable before it is
 * what Sentry certifies against.
 */
function SubmitForm({ onSubmit, onCancel }: { onSubmit: (note: string) => void; onCancel: () => void }) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleFile(file: File) {
    setBusy(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/milestones/extract", { method: "POST", headers: authHeaders(), body });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Could not read that file.");
      setNote((prev) => (prev ? `${prev}\n\n${data.text}` : data.text));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3 rounded-lg border p-3" style={{ borderColor: "var(--line-soft)" }}>
      <label className="block text-sm">
        <span className="muted mb-1.5 block text-xs font-medium">
          What are you submitting? Sentry certifies against this text.
        </span>
        <textarea
          value={note} onChange={(e) => setNote(e.target.value)} rows={4}
          placeholder="Describe the deliverable, or upload a .docx/.pdf below to pull the text in."
          aria-label="Submission note" className="w-full rounded-lg border px-3 py-2 text-sm"
          style={{ borderColor: "var(--line)", background: "var(--page)" }}
        />
      </label>

      <div className="mt-2 flex items-center gap-3">
        <label className="btn btn-ghost !px-2.5 !py-1.5 cursor-pointer text-[11px]">
          <Upload className="h-3.5 w-3.5" aria-hidden="true" /> {busy ? "Reading…" : "Attach .docx / .pdf"}
          <input
            type="file" accept=".docx,.pdf" className="hidden" disabled={busy}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
          />
        </label>
        {error && (
          <span className="flex items-center gap-1 text-[11px]" style={{ color: "var(--bad)" }}>
            <AlertTriangle className="h-3 w-3" aria-hidden="true" /> {error}
          </span>
        )}
      </div>

      <div className="mt-3 flex gap-2">
        <button
          type="button" disabled={submitting || !note.trim()}
          onClick={() => { setSubmitting(true); onSubmit(note.trim()); }}
          className="btn btn-primary !px-3 !py-1.5 text-xs disabled:opacity-50"
        >
          {submitting ? "Submitting…" : "Submit deliverable"}
        </button>
        <button type="button" onClick={onCancel} className="btn btn-ghost !px-3 !py-1.5 text-xs">Cancel</button>
      </div>
    </div>
  );
}
