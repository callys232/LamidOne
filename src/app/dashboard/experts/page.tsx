"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BadgeCheck, GraduationCap, ArrowUpDown } from "lucide-react";
import { useApi } from "@/lib/useApi";
import { EmptyState } from "@/app/dashboard/page";

type Expert = {
  id: string; name: string; headline: string; disciplines: string[];
  engagementsCompleted: number; rating: number | null; verified: boolean; certified: boolean;
};

type SortKey = "rating" | "engagements";

/**
 * Expert network — the real vetting tool: filter by discipline, sort by
 * the two signals that actually indicate reliability (rating, track
 * record), and see verification/certification before ever posting a
 * brief. "Invite to a brief" carries the selection into a dedicated
 * form (dashboard/projects/invite/[expertId]) rather than requiring a
 * brief to already exist before an expert can be evaluated.
 *
 * Publishes engagement counts even when they are low — that is what
 * makes the high ones believable (teardown §7.12) — and shows an
 * honest empty state rather than a seeded fake directory.
 */
export default function ExpertsPage() {
  const [discipline, setDiscipline] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sort, setSort] = useState<SortKey>("rating");

  const query = discipline.trim() ? `?discipline=${encodeURIComponent(discipline.trim())}` : "";
  const { data, loading } = useApi<{ experts: Expert[] }>(`/api/experts${query}`);

  const experts = useMemo(() => {
    const list = (data?.experts ?? []).filter((e) => !verifiedOnly || e.verified);
    return [...list].sort((a, b) =>
      sort === "rating" ? (b.rating ?? 0) - (a.rating ?? 0) : b.engagementsCompleted - a.engagementsCompleted,
    );
  }, [data, verifiedOnly, sort]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl">Expert network</h1>
        <p className="muted mt-1 text-sm">Vet, compare and invite from the network — before you ever post a brief.</p>
      </div>

      <div className="card flex flex-wrap items-end gap-4 p-4">
        <label className="block text-sm">
          <span className="muted mb-1.5 block text-xs font-medium">Discipline</span>
          <input
            value={discipline} onChange={(e) => setDiscipline(e.target.value)}
            placeholder="e.g. financial-modelling" aria-label="Filter by discipline" className="input"
          />
        </label>
        <label className="faint flex items-center gap-2 pb-2.5 text-xs">
          <input type="checkbox" checked={verifiedOnly} onChange={(e) => setVerifiedOnly(e.target.checked)} />
          Verified only
        </label>
        <label className="ml-auto block text-sm">
          <span className="muted mb-1.5 flex items-center gap-1 text-xs font-medium">
            <ArrowUpDown className="h-3 w-3" aria-hidden="true" /> Sort by
          </span>
          <select
            value={sort} onChange={(e) => setSort(e.target.value as SortKey)}
            aria-label="Sort experts" className="input"
          >
            <option value="rating">Highest rated</option>
            <option value="engagements">Most engagements</option>
          </select>
        </label>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => <div key={i} className="card h-40 animate-pulse" style={{ background: "var(--line-soft)" }} />)}
        </div>
      ) : experts.length === 0 ? (
        <EmptyState
          text={discipline || verifiedOnly ? "No experts match these filters." : "No experts in the network yet."}
          cta={{ label: "Post a brief instead", href: "/dashboard/projects/new" }}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {experts.map((e) => (
            <div key={e.id} className="card flex flex-col p-5">
              <div className="flex items-start justify-between gap-2">
                <p className="flex min-w-0 items-center gap-1.5 font-semibold">
                  <span className="truncate">{e.name}</span>
                  {e.verified && <BadgeCheck className="h-4 w-4 shrink-0 text-brand" aria-label="Verified" />}
                </p>
              </div>
              <p className="muted mt-1 text-xs">{e.headline}</p>
              {e.disciplines.length > 0 && (
                <p className="faint mt-2 text-xs">{e.disciplines.slice(0, 3).join(" · ")}</p>
              )}
              <p className="faint mt-3 flex items-center gap-1.5 text-xs">
                {e.engagementsCompleted} engagement{e.engagementsCompleted === 1 ? "" : "s"}
                {e.rating && ` · ${e.rating}/5`}
                {e.certified && (
                  <span className="flex items-center gap-1" title="Certified through LAMID LEARN">
                    · <GraduationCap className="h-3 w-3" aria-hidden="true" /> Certified
                  </span>
                )}
              </p>
              <Link
                href={`/dashboard/projects/invite/${e.id}`}
                className="btn btn-secondary mt-4 !px-3 !py-1.5 text-xs"
              >
                Invite to a brief
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
