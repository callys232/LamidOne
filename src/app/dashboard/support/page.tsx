"use client";

import { useState } from "react";
import { useApi, apiPost } from "@/lib/useApi";
import { EmptyState } from "@/app/dashboard/page";

type Ticket = { id: string; subject: string; body: string; status: string; createdAt: number };
type StewardResult = {
  result: { reply: string; relatedEvents: { id: string; title: string }[]; lmsHandoff: boolean };
  charged: number;
};

export default function SupportPage() {
  const { data, loading, reload } = useApi<{ tickets: Ticket[]; responseTarget: string }>("/api/support/tickets");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  async function send() {
    setSending(true);
    setError(null);
    const res = await apiPost("/api/support/tickets", { subject, body });
    setSending(false);
    if (res.ok) { setSubject(""); setBody(""); reload(); } else { setError(res.error); }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h1 className="font-display text-2xl">Support</h1>
          <p className="muted mt-1 text-sm">Tickets and your response-time entitlement.</p>
        </div>
        {data?.responseTarget && (
          <span className="rounded-full px-3 py-1 text-xs font-semibold" style={{ background: "var(--brand-soft)", color: "var(--brand)" }}>
            Target: {data.responseTarget}
          </span>
        )}
      </div>

      <div className="card space-y-3 p-4">
        <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject"
               className="w-full rounded-lg bg-transparent px-3 py-2 text-sm outline-none" style={{ border: "1px solid var(--line)" }} />
        <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Describe the issue…" rows={4}
                  className="w-full rounded-lg bg-transparent px-3 py-2 text-sm outline-none" style={{ border: "1px solid var(--line)" }} />
        {error && <p className="text-xs" style={{ color: "var(--bad)" }}>{error}</p>}
        <button onClick={send} disabled={sending || !subject.trim() || !body.trim()} className="btn btn-primary !px-4 !py-2 text-xs">
          Raise ticket
        </button>
      </div>

      {loading ? (
        <p className="muted text-sm">Loading…</p>
      ) : !data?.tickets.length ? (
        <EmptyState text="No tickets yet." />
      ) : (
        <div className="grid gap-3">
          {data.tickets.map((t) => <TicketRow key={t.id} ticket={t} />)}
        </div>
      )}
    </div>
  );
}

/** Steward is grounded against real events and hands off honestly to
 *  LEARN for learning questions — see lib/supportAgent.ts. 15 points,
 *  Starter and up; a ticket you resolve without asking never costs. */
function TicketRow({ ticket }: { ticket: Ticket }) {
  const [result, setResult] = useState<StewardResult["result"] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ask() {
    setBusy(true);
    setError(null);
    const res = await apiPost<StewardResult>("/api/agents/steward/run", { input: { subject: ticket.subject, body: ticket.body } });
    setBusy(false);
    if (res.ok && res.data) setResult(res.data.result);
    else setError(res.error);
  }

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-medium">{ticket.subject}</p>
        <span className="faint shrink-0 text-xs capitalize">{ticket.status.replace("_", " ")}</span>
      </div>
      <p className="muted mt-1.5 text-xs leading-relaxed">{ticket.body}</p>

      {!result && (
        <button type="button" onClick={ask} disabled={busy} className="btn btn-ghost mt-3 !px-3 !py-1.5 text-xs disabled:opacity-50">
          {busy ? "Asking Steward…" : "Get Steward's suggested reply — 15 pts"}
        </button>
      )}
      {error && <p className="mt-2 text-xs" style={{ color: "var(--bad)" }}>{error}</p>}
      {result && (
        <div className="mt-3 rounded-lg p-3 text-xs leading-relaxed" style={{ background: "var(--brand-soft)" }}>
          <p className="font-semibold text-brand">Steward suggests:</p>
          <p className="mt-1.5">{result.reply}</p>
          {result.relatedEvents.length > 0 && (
            <p className="faint mt-2">Related events: {result.relatedEvents.map((e) => e.title).join(", ")}</p>
          )}
          {result.lmsHandoff && <p className="faint mt-2">This ticket looks learning-related — see the LMS link above.</p>}
        </div>
      )}
    </div>
  );
}
