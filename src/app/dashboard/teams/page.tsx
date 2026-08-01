"use client";

import { useState } from "react";
import { useApi, apiPost } from "@/lib/useApi";
import { EmptyState } from "@/app/dashboard/page";

type Team = { id: string; name: string; memberIds: string[]; createdAt: number };

export default function TeamsPage() {
  const { data, loading, reload } = useApi<{ teams: Team[] }>("/api/organisation/teams");
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);

  async function create() {
    if (!name.trim()) return;
    setCreating(true);
    const res = await apiPost("/api/organisation/teams", { name, memberIds: [] });
    setCreating(false);
    if (res.ok) { setName(""); reload(); }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl">Teams</h1>
        <p className="muted mt-1 text-sm">Sub-groups within your organisation.</p>
      </div>

      <div className="card flex gap-3 p-4">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Team name"
               className="flex-1 rounded-lg bg-transparent px-3 py-2 text-sm outline-none" style={{ border: "1px solid var(--line)" }} />
        <button onClick={create} disabled={creating || !name.trim()} className="btn btn-primary !px-4 !py-2 text-xs">
          Create team
        </button>
      </div>

      {loading ? (
        <p className="muted text-sm">Loading…</p>
      ) : !data?.teams.length ? (
        <EmptyState text="No teams yet." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {data.teams.map((t) => (
            <div key={t.id} className="card p-4">
              <p className="font-semibold">{t.name}</p>
              <p className="faint mt-1 text-xs">{t.memberIds.length} member{t.memberIds.length === 1 ? "" : "s"}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
