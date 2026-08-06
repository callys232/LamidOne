"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Sparkles, Lock } from "lucide-react";
import { useApi, authHeaders } from "@/lib/useApi";
import { useDashboard } from "@/components/dashboard/DashboardShell";
import { EmptyState } from "@/app/dashboard/page";
import type { ProjectMatch } from "@/lib/matching";

type OpenProject = {
  id: string; title: string; brief: string; skills: string[];
  budget: { min: number; max: number; currency: string }; deadline?: string; bidCount: number;
};

/**
 * Browse open briefs — the page the "Browse open briefs" empty-state CTA
 * on the projects list was supposed to lead to. It previously pointed at
 * the expert DIRECTORY (a list of other experts, not open work), which
 * is not something an expert looking for briefs to bid on can use.
 *
 * Scout's ranking is opt-in ("Rank these for me") rather than run
 * automatically, since it is a metered, premium-gated agent call — the
 * plain list underneath needs no gate and no charge.
 */
export default function BrowseProjectsPage() {
  const v = useDashboard();
  const isPremium = v.tier !== "free";
  const { data, loading } = useApi<{ projects: OpenProject[] }>("/api/projects?status=open&take=50");

  const [ranked, setRanked] = useState<ProjectMatch[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [compare, setCompare] = useState(false);

  async function rank() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/agents/project-match/run", {
        method: "POST", headers: authHeaders(), body: JSON.stringify({ input: {} }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error ?? "Could not rank these briefs.");
      setRanked(body.result.matches as ProjectMatch[]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const scoreOf = (id: string) => ranked?.find((m) => m.project.id === id)?.total ?? null;

  const projects = useMemo(() => {
    const list = data?.projects ?? [];
    if (!ranked) return list;
    const order = new Map(ranked.map((m, i) => [m.project.id, i]));
    return [...list].sort((a, b) => (order.get(a.id) ?? 999) - (order.get(b.id) ?? 999));
  }, [data, ranked]);

  const toggle = (id: string) =>
    setSelected((s) => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const selectedProjects = projects.filter((p) => selected.has(p.id));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl">Browse open briefs</h1>
          <p className="muted mt-1 text-sm">Everything currently open for bids.</p>
        </div>
        <div className="flex items-center gap-2">
          {selected.size > 1 && (
            <button type="button" onClick={() => setCompare((c) => !c)} className="btn btn-ghost !px-3 !py-1.5 text-xs">
              {compare ? "Hide comparison" : `Compare ${selected.size} selected`}
            </button>
          )}
          {isPremium ? (
            <button type="button" onClick={rank} disabled={busy} className="btn btn-primary !px-3 !py-1.5 text-xs disabled:opacity-50">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> {busy ? "Ranking…" : "Rank these for me"}
            </button>
          ) : (
            <Link href="/pricing" className="faint flex items-center gap-1.5 text-xs hover:text-brand">
              <Lock className="h-3.5 w-3.5" aria-hidden="true" /> Ranking is on Starter and up
            </Link>
          )}
        </div>
      </div>

      {error && <p className="text-sm" style={{ color: "var(--bad)" }}>{error}</p>}

      {compare && selectedProjects.length > 1 && (
        <div className="card overflow-x-auto p-5">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: "var(--line-soft)" }}>
                <th className="py-2 pr-4 font-medium">Brief</th>
                <th className="py-2 pr-4 font-medium">Budget</th>
                <th className="py-2 pr-4 font-medium">Disciplines</th>
                <th className="py-2 pr-4 font-medium">Bids</th>
                {ranked && <th className="py-2 pr-4 font-medium">Fit</th>}
              </tr>
            </thead>
            <tbody>
              {selectedProjects.map((p) => (
                <tr key={p.id} className="border-b" style={{ borderColor: "var(--line-soft)" }}>
                  <td className="py-2 pr-4 font-medium">{p.title}</td>
                  <td className="py-2 pr-4 tabular-nums">{p.budget.currency} {p.budget.min.toLocaleString()}–{p.budget.max.toLocaleString()}</td>
                  <td className="py-2 pr-4">{p.skills.join(", ") || "—"}</td>
                  <td className="py-2 pr-4 tabular-nums">{p.bidCount}</td>
                  {ranked && <td className="py-2 pr-4 tabular-nums">{Math.round((scoreOf(p.id) ?? 0) * 100)}%</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {loading ? (
        <p className="muted text-sm">Loading…</p>
      ) : projects.length === 0 ? (
        <EmptyState text="Nothing open right now." cta={{ label: "Check back soon", href: "/dashboard/projects" }} />
      ) : (
        <div className="grid gap-3">
          {projects.map((p) => {
            const score = scoreOf(p.id);
            const match = ranked?.find((m) => m.project.id === p.id);
            return (
              <div key={p.id} className="card flex items-start gap-4 p-5">
                <input
                  type="checkbox" checked={selected.has(p.id)} onChange={() => toggle(p.id)}
                  aria-label={`Select ${p.title} to compare`} className="mt-1.5"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-semibold">{p.title}</p>
                    {score !== null && (
                      <span className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ background: "var(--brand-soft)", color: "var(--brand)" }}>
                        {Math.round(score * 100)}% fit
                      </span>
                    )}
                  </div>
                  <p className="muted mt-1 line-clamp-2 text-sm leading-relaxed">{p.brief}</p>
                  <p className="faint mt-2 text-xs">
                    {p.budget.currency} {p.budget.min.toLocaleString()}–{p.budget.max.toLocaleString()}
                    {p.skills.length > 0 && ` · ${p.skills.join(", ")}`}
                    {" · "}{p.bidCount} bid{p.bidCount === 1 ? "" : "s"}
                  </p>
                  {match && match.reasons.length > 0 && <p className="faint mt-1 text-xs">{match.reasons.join(" · ")}</p>}
                  <Link href={`/dashboard/projects/${p.id}`} className="link-underline mt-2 inline-flex text-xs">
                    View brief and bid
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
