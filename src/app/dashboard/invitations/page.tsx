"use client";

import { useApi, apiPost } from "@/lib/useApi";
import { EmptyState } from "@/app/dashboard/page";

type Invitation = { id: string; email: string; role: string; status: string; createdAt: number };

const TONE: Record<string, string> = {
  pending: "var(--warn)", accepted: "var(--good)", revoked: "var(--bad)", expired: "var(--ink-faint)",
};

export default function InvitationsPage() {
  const { data, loading, reload } = useApi<{ invitations: Invitation[] }>("/api/organisation/invitations");

  async function revoke(id: string) {
    await fetch("/api/organisation/invitations", {
      method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ id }),
    }).then(() => reload());
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl">Invitations</h1>
        <p className="muted mt-1 text-sm">Sent and pending invitations to your organisation.</p>
      </div>

      {loading ? (
        <p className="muted text-sm">Loading…</p>
      ) : !data?.invitations.length ? (
        <EmptyState text="No invitations sent yet." cta={{ label: "Invite a member", href: "/dashboard/members" }} />
      ) : (
        <div className="divide-hairline card overflow-hidden">
          {data.invitations.map((i) => (
            <div key={i.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium">{i.email}</p>
                <p className="faint text-xs capitalize">{i.role}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize" style={{ color: TONE[i.status], border: `1px solid ${TONE[i.status]}` }}>
                  {i.status}
                </span>
                {i.status === "pending" && (
                  <button onClick={() => revoke(i.id)} className="faint text-xs hover:text-brand">Revoke</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
