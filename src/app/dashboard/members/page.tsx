"use client";

import { useState } from "react";
import { useApi, apiPost } from "@/lib/useApi";
import { EmptyState } from "@/app/dashboard/page";
import type { OrgRole } from "@/lib/organisation";

type Member = { id: string; name: string; email: string; role: OrgRole; joinedAt: number };

export default function MembersPage() {
  const { data, loading, reload } = useApi<{ members: Member[] }>("/api/organisation/members");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<OrgRole>("member");
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function invite() {
    setInviting(true);
    setError(null);
    const res = await apiPost("/api/organisation/members", { email, role });
    setInviting(false);
    if (res.ok) { setEmail(""); reload(); } else { setError(res.error); }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl">Members</h1>
        <p className="muted mt-1 text-sm">
          Seat price follows your account tier — inviting a member never re-prices seats you already
          pay for.
        </p>
      </div>

      <div className="card p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="colleague@yourcompany.com" type="email"
            className="flex-1 rounded-lg bg-transparent px-3 py-2 text-sm outline-none"
            style={{ border: "1px solid var(--line)" }}
          />
          <select value={role} onChange={(e) => setRole(e.target.value as OrgRole)}
                  className="rounded-lg bg-transparent px-3 py-2 text-sm outline-none" style={{ border: "1px solid var(--line)" }}>
            <option value="member">Member</option>
            <option value="admin">Admin</option>
            <option value="billing">Billing</option>
          </select>
          <button onClick={invite} disabled={inviting || !email.trim()} className="btn btn-primary !px-4 !py-2 text-xs shrink-0">
            Invite
          </button>
        </div>
        {error && <p className="mt-2 text-xs" style={{ color: "var(--bad)" }}>{error}</p>}
      </div>

      {loading ? (
        <p className="muted text-sm">Loading…</p>
      ) : !data?.members.length ? (
        <EmptyState text="No members yet." />
      ) : (
        <div className="divide-hairline card overflow-hidden">
          {data.members.map((m) => (
            <div key={m.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium">{m.name}</p>
                <p className="faint text-xs">{m.email}</p>
              </div>
              <span className="rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize" style={{ border: "1px solid var(--line)" }}>
                {m.role}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
