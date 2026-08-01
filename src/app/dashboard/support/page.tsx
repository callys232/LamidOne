"use client";

import { useState } from "react";
import { useApi, apiPost } from "@/lib/useApi";
import { EmptyState } from "@/app/dashboard/page";

type Ticket = { id: string; subject: string; status: string; createdAt: number };

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
        <div className="divide-hairline card overflow-hidden">
          {data.tickets.map((t) => (
            <div key={t.id} className="flex items-center justify-between px-4 py-3">
              <p className="text-sm">{t.subject}</p>
              <span className="faint text-xs capitalize">{t.status.replace("_", " ")}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
