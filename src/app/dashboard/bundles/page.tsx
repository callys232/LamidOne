"use client";

import { useState } from "react";
import { useApi, apiPost } from "@/lib/useApi";
import { useDashboard } from "@/components/dashboard/DashboardShell";
import { EmptyState } from "@/app/dashboard/page";

type BundleListItem = { id: string; name: string; runs: number; reusableFacts: string[]; updatedAt: number };

export default function BundlesPage() {
  const v = useDashboard();
  const { data, loading, reload } = useApi<{ bundles: BundleListItem[] }>("/api/bundles");
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);

  async function create() {
    if (!name.trim()) return;
    setCreating(true);
    const res = await apiPost("/api/bundles", { name });
    setCreating(false);
    if (res.ok) { setName(""); reload(); }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl">Bundles</h1>
        <p className="muted mt-1 text-sm">
          Your working context. Inputs entered for one engine are offered to the next, tagged with
          where they came from.
        </p>
      </div>

      <div className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name a new bundle — e.g. 'Q3 review'"
          className="flex-1 rounded-lg bg-transparent px-3 py-2 text-sm outline-none"
          style={{ border: "1px solid var(--line)" }}
          maxLength={120}
        />
        <button onClick={create} disabled={creating || !name.trim()} className="btn btn-primary !px-4 !py-2 text-xs">
          Create bundle
        </button>
      </div>

      {loading ? (
        <p className="muted text-sm">Loading…</p>
      ) : !data?.bundles.length ? (
        <EmptyState text="No bundles yet. Create one, or run an engine and it will offer to start one for you." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {data.bundles.map((b) => (
            <div key={b.id} className="card p-4">
              <p className="font-semibold">{b.name}</p>
              <p className="faint mt-1 text-xs">
                {b.runs} run{b.runs === 1 ? "" : "s"} · updated {new Date(b.updatedAt).toLocaleDateString()}
              </p>
              {b.reusableFacts.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {b.reusableFacts.map((f) => (
                    <span key={f} className="rounded px-2 py-0.5 text-[10px] font-semibold capitalize"
                          style={{ background: "var(--brand-soft)", color: "var(--brand)" }}>
                      {f}
                    </span>
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
