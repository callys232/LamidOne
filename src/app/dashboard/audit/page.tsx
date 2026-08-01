"use client";

import { useApi } from "@/lib/useApi";
import { EmptyState } from "@/app/dashboard/page";

type Entry = { id: string; action: string; target?: string; detail?: string; actorRole: string; at: number };

export default function AuditPage() {
  const { data, loading } = useApi<{ entries: Entry[] }>("/api/audit");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl">Audit log</h1>
        <p className="muted mt-1 text-sm">Every consequential action, with who and when. Nothing here can be edited or deleted.</p>
      </div>

      {loading ? (
        <p className="muted text-sm">Loading…</p>
      ) : !data?.entries.length ? (
        <EmptyState text="No consequential actions have been recorded yet." />
      ) : (
        <div className="divide-hairline card overflow-hidden">
          {data.entries.map((e) => (
            <div key={e.id} className="flex items-center justify-between gap-4 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm capitalize">{e.action.replace(/_/g, " ")}</p>
                {e.target && <p className="faint truncate text-xs">{e.target}{e.detail ? ` · ${e.detail}` : ""}</p>}
              </div>
              <span className="faint shrink-0 text-xs">{new Date(e.at).toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
