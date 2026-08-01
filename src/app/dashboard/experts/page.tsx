"use client";

import { useApi } from "@/lib/useApi";
import { EmptyState } from "@/app/dashboard/page";

type Expert = {
  id: string; name: string; headline: string; disciplines: string[];
  engagementsCompleted: number; rating: number | null; verified: boolean;
};

/**
 * Expert network. Publishes engagement counts even when they are low —
 * that is what makes the high ones believable (teardown §7.12) — and
 * shows an honest empty state rather than a seeded fake directory.
 */
export default function ExpertsPage() {
  const { data, loading } = useApi<{ experts: Expert[] }>("/api/experts");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl">Expert network</h1>
        <p className="muted mt-1 text-sm">Browse, shortlist and re-engage vetted experts.</p>
      </div>

      {loading ? (
        <p className="muted text-sm">Loading…</p>
      ) : !data?.experts.length ? (
        <EmptyState text="No experts in the network yet." cta={{ label: "Post a brief instead", href: "/dashboard/projects" }} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.experts.map((e) => (
            <div key={e.id} className="card p-5">
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold">{e.name}</p>
                {e.verified && (
                  <span className="rounded px-1.5 py-0.5 text-[10px] font-semibold" style={{ background: "var(--brand-soft)", color: "var(--brand)" }}>
                    Verified
                  </span>
                )}
              </div>
              <p className="muted mt-1 text-xs">{e.headline}</p>
              <p className="faint mt-3 text-xs">
                {e.engagementsCompleted} engagement{e.engagementsCompleted === 1 ? "" : "s"}
                {e.rating && ` · ${e.rating}/5`}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
