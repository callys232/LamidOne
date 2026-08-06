"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Users, FileText, ListChecks, Lock } from "lucide-react";
import { useDashboard } from "@/components/dashboard/DashboardShell";
import { useApi, authHeaders } from "@/lib/useApi";
import type { ConsultantMatch } from "@/lib/matching";

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
  const canBid = v.role === "expert" && project.status === "open";

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

      {v.role !== "expert" && <Enrichments projectId={id} isPremium={v.tier !== "free"} />}
      {canBid && <BidForm projectId={id} defaultCurrency={project.budget.currency} onPlaced={reload} />}

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

/**
 * Place a bid — the form that never existed anywhere in the app. An
 * expert could see an open brief and had no way to act on it; this is
 * that missing step. Duplicate-bid and insufficient-points rejections
 * come back from the server and render inline — the form stays filled
 * in either way, same rule the rest of this build follows.
 */
function BidForm({ projectId, defaultCurrency, onPlaced }: { projectId: string; defaultCurrency: string; onPlaced: () => void }) {
  const [amount, setAmount] = useState(0);
  const [duration, setDuration] = useState(10);
  const [pitch, setPitch] = useState("");
  const [boosted, setBoosted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsTopup, setNeedsTopup] = useState<number | null>(null);
  const [placed, setPlaced] = useState(false);

  const canSubmit = amount > 0 && duration > 0 && pitch.trim().length >= 40;

  async function submit() {
    setBusy(true);
    setError(null);
    setNeedsTopup(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/bids`, {
        method: "POST", headers: authHeaders(),
        body: JSON.stringify({ amount, duration, pitch: pitch.trim(), currency: defaultCurrency, boosted }),
      });
      const body = await res.json();
      if (res.status === 402 && body?.code === "insufficient_points") {
        setNeedsTopup(body.remedy?.points ?? null);
        return;
      }
      if (!res.ok) throw new Error(body?.error ?? "The bid could not be placed.");
      setPlaced(true);
      onPlaced();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (placed) {
    return (
      <div className="card p-5 text-sm" style={{ borderColor: "var(--good)" }}>
        Your bid is in. The client will see it alongside the others.
      </div>
    );
  }

  return (
    <div className="card space-y-4 p-5">
      <h2 className="font-display text-lg">Place a bid</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="muted mb-1.5 block text-xs font-medium">Your price ({defaultCurrency})</span>
          <input type="number" min={0} value={amount || ""} onChange={(e) => setAmount(Number(e.target.value) || 0)} aria-label="Bid amount" className="input" />
        </label>
        <label className="block text-sm">
          <span className="muted mb-1.5 block text-xs font-medium">Working days</span>
          <input type="number" min={1} value={duration} onChange={(e) => setDuration(Number(e.target.value) || 1)} aria-label="Duration in working days" className="input" />
        </label>
      </div>

      <label className="block text-sm">
        <span className="muted mb-1.5 block text-xs font-medium">Pitch — why you, specifically</span>
        <textarea
          value={pitch} onChange={(e) => setPitch(e.target.value)} rows={4}
          placeholder="What you'd actually do, and why your background fits this brief."
          aria-label="Bid pitch" className="w-full rounded-lg border px-3 py-2 text-sm"
          style={{ borderColor: "var(--line)", background: "var(--page)" }}
        />
        <span className="faint mt-1 block text-xs">{pitch.trim().length}/40 characters minimum</span>
      </label>

      <label className="faint flex items-center gap-1.5 text-xs">
        <input type="checkbox" checked={boosted} onChange={(e) => setBoosted(e.target.checked)} />
        Boost this bid for 2× visibility (+60 points)
      </label>

      {needsTopup !== null && (
        <div className="rounded-lg border p-4 text-sm" style={{ borderColor: "var(--brand)" }}>
          <p className="font-medium">Not enough points — you need {needsTopup} more.</p>
          <p className="muted mt-1">Everything above stays as you left it.</p>
          <Link href="/dashboard/wallet" className="link-underline mt-2 inline-flex text-xs">Top up points</Link>
        </div>
      )}
      {error && <p className="text-sm" style={{ color: "var(--bad)" }}>{error}</p>}

      <div className="flex items-center gap-3">
        <button type="button" onClick={submit} disabled={busy || !canSubmit} className="btn btn-primary disabled:opacity-50">
          {busy ? "Placing…" : boosted ? "Place boosted bid" : "Place bid"}
        </button>
        <span className="faint text-xs">{boosted ? "80 points" : "20 points"}, charged only once this bid is placed.</span>
      </div>
    </div>
  );
}

type EnrichmentKey = "matching" | "proposal" | "milestones";

/**
 * The four things ProdLamid attempted to bolt onto posting a project
 * but never actually wired up (see lib/matching.ts and lib/tagSuggest.ts
 * headers) — surfaced here instead, on the posted project, gated to
 * paid plans. Consultant matching runs real arithmetic (lib/matching.ts);
 * the proposal draft and milestone breakdown are honestly still a
 * generic language call (see agents.ts) — this panel does not claim
 * otherwise, it only makes them reachable.
 */
function Enrichments({ projectId, isPremium }: { projectId: string; isPremium: boolean }) {
  const [busy, setBusy] = useState<EnrichmentKey | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [matches, setMatches] = useState<ConsultantMatch[] | null>(null);
  const [proposal, setProposal] = useState<string | null>(null);
  const [milestonePlan, setMilestonePlan] = useState<string | null>(null);

  async function run(agentId: EnrichmentKey, onOk: (result: unknown) => void) {
    setBusy(agentId);
    setError(null);
    try {
      const res = await fetch(`/api/agents/${agentId}/run`, {
        method: "POST", headers: authHeaders(), body: JSON.stringify({ input: { projectId } }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error ?? "That could not complete.");
      onOk(body.result);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  if (!isPremium) {
    return (
      <div className="card flex items-center justify-between gap-4 p-5">
        <div>
          <p className="flex items-center gap-2 font-semibold">
            <Lock className="h-4 w-4" aria-hidden="true" /> Matched experts, a proposal draft and a milestone plan
          </p>
          <p className="muted mt-1 text-sm">Available from the Starter plan.</p>
        </div>
        <Link href="/pricing" className="btn btn-primary shrink-0">See plans</Link>
      </div>
    );
  }

  return (
    <div className="card space-y-5 p-5">
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={busy !== null} className="btn btn-ghost !px-3 !py-1.5 text-xs disabled:opacity-50"
                onClick={() => run("matching", (r) => setMatches((r as { matches: ConsultantMatch[] }).matches))}>
          <Users className="h-3.5 w-3.5" aria-hidden="true" /> {busy === "matching" ? "Matching…" : "Find matched experts"}
        </button>
        <button type="button" disabled={busy !== null} className="btn btn-ghost !px-3 !py-1.5 text-xs disabled:opacity-50"
                onClick={() => run("proposal", (r) => setProposal((r as { output: string }).output))}>
          <FileText className="h-3.5 w-3.5" aria-hidden="true" /> {busy === "proposal" ? "Drafting…" : "Draft a proposal"}
        </button>
        <button type="button" disabled={busy !== null} className="btn btn-ghost !px-3 !py-1.5 text-xs disabled:opacity-50"
                onClick={() => run("milestones", (r) => setMilestonePlan((r as { output: string }).output))}>
          <ListChecks className="h-3.5 w-3.5" aria-hidden="true" /> {busy === "milestones" ? "Breaking down…" : "Break into milestones"}
        </button>
      </div>

      {error && <p className="text-sm" style={{ color: "var(--bad)" }}>{error}</p>}

      {matches && <MatchList matches={matches} />}

      {proposal && <p className="muted whitespace-pre-wrap text-sm leading-relaxed">{proposal}</p>}
      {milestonePlan && <p className="muted whitespace-pre-wrap text-sm leading-relaxed">{milestonePlan}</p>}
    </div>
  );
}

/** Ranked list with an opt-in side-by-side comparison of any 2+ selected. */
function MatchList({ matches }: { matches: ConsultantMatch[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [compare, setCompare] = useState(false);

  const toggle = (id: string) =>
    setSelected((s) => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const chosen = matches.filter((m) => selected.has(m.expert.id));

  if (matches.length === 0) return <p className="muted text-sm">No experts in the network match this brief yet.</p>;

  return (
    <div className="space-y-3">
      {selected.size > 1 && (
        <button type="button" onClick={() => setCompare((c) => !c)} className="btn btn-ghost !px-3 !py-1.5 text-xs">
          {compare ? "Hide comparison" : `Compare ${selected.size} selected`}
        </button>
      )}

      {compare && chosen.length > 1 && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: "var(--line-soft)" }}>
                <th className="py-2 pr-4 font-medium">Expert</th>
                <th className="py-2 pr-4 font-medium">Match</th>
                <th className="py-2 pr-4 font-medium">Disciplines</th>
                <th className="py-2 pr-4 font-medium">Rating</th>
                <th className="py-2 pr-4 font-medium">Engagements</th>
                <th className="py-2 pr-4 font-medium">Verified</th>
              </tr>
            </thead>
            <tbody>
              {chosen.map((m) => (
                <tr key={m.expert.id} className="border-b" style={{ borderColor: "var(--line-soft)" }}>
                  <td className="py-2 pr-4 font-medium">{m.expert.name}</td>
                  <td className="py-2 pr-4 tabular-nums">{Math.round(m.total * 100)}%</td>
                  <td className="py-2 pr-4">{m.matchedDisciplines.join(", ") || "—"}</td>
                  <td className="py-2 pr-4 tabular-nums">{m.expert.rating ?? "—"}</td>
                  <td className="py-2 pr-4 tabular-nums">{m.expert.engagementsCompleted}</td>
                  <td className="py-2 pr-4">{m.expert.verified ? "Yes" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="space-y-2">
        {matches.map((m) => (
          <div key={m.expert.id} className="flex items-start gap-3 rounded-lg border p-3" style={{ borderColor: "var(--line-soft)" }}>
            <input
              type="checkbox" checked={selected.has(m.expert.id)} onChange={() => toggle(m.expert.id)}
              aria-label={`Select ${m.expert.name} to compare`} className="mt-1.5"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-semibold">{m.expert.name}</span>
                <span className="faint text-xs tabular-nums">{Math.round(m.total * 100)}% match</span>
              </div>
              <p className="muted text-xs">{m.expert.headline}</p>
              {m.reasons.length > 0 && <p className="faint mt-1 text-xs">{m.reasons.join(" · ")}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
