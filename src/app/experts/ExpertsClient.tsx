"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BadgeCheck, GraduationCap, ArrowUpDown } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Eyebrow } from "@/components/ui/Section";
import { useApi } from "@/lib/useApi";

type Expert = {
  id: string; name: string; headline: string; disciplines: string[];
  engagementsCompleted: number; rating: number | null; verified: boolean; certified: boolean;
};

type SortKey = "rating" | "engagements";

/**
 * The real vetting tool — replaces the honest placeholder this route
 * used to be ("this screen lives in the application"). Reachable
 * without an account, the same way /diagnostics/budget and the other
 * suites' flagship tools are: browsing and vetting the network is free
 * and public; only inviting someone into a brief needs an account,
 * because that's the point money and a real notification start moving.
 *
 * GET /api/experts has never required auth (only rate-limits by IP for
 * an anonymous caller), so this page calls it directly rather than
 * needing a separate public endpoint.
 */
export function ExpertsClient() {
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
    <>
      <Header ctaSet="neutral" />
      <main id="main">
        <section className="border-b" style={{ borderColor: "var(--line-soft)" }}>
          <div className="shell py-20">
            <div className="max-w-3xl">
              <Eyebrow>Expert directory</Eyebrow>
              <h1 className="h-display mt-6">Browse the vetted network.</h1>
              <p className="lead mt-6">
                Filter by discipline, check verification and track record, then compare before you ever
                post a brief. Free to browse — signing in is only needed to invite someone.
              </p>
            </div>
          </div>
        </section>

        <section className="shell py-16">
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

          <div className="mt-6">
            {loading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[0, 1, 2].map((i) => <div key={i} className="card h-40 animate-pulse" style={{ background: "var(--line-soft)" }} />)}
              </div>
            ) : experts.length === 0 ? (
              <div className="card p-8 text-center">
                <p className="muted text-sm">
                  {discipline || verifiedOnly ? "No experts match these filters." : "No experts in the network yet."}
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {experts.map((e) => (
                  <div key={e.id} className="card flex flex-col p-5">
                    <p className="flex min-w-0 items-center gap-1.5 font-semibold">
                      <span className="truncate">{e.name}</span>
                      {e.verified && <BadgeCheck className="h-4 w-4 shrink-0 text-brand" aria-label="Verified" />}
                    </p>
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
        </section>
      </main>
      <Footer />
    </>
  );
}
