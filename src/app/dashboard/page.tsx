"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useDashboard } from "@/components/dashboard/DashboardShell";

/**
 * Overview — the one screen every role lands on.
 *
 * Headline stats, next actions ranked by what actually blocks progress
 * (not by upsell priority — see `nextActions()` in dashboardData.ts),
 * open work, and recent ledger activity. Everything reads from the one
 * aggregated fetch in DashboardShell; nothing here makes its own call.
 */
export default function OverviewPage() {
  const v = useDashboard();

  return (
    <div className="space-y-10">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {v.headline.map((s) => (
          <div key={s.label} className="card p-5">
            <p className="faint text-xs font-medium uppercase tracking-wide">{s.label}</p>
            <p className="stat-value mt-1 text-3xl">{s.value}</p>
            {s.hint && (
              <p className="mt-1 text-xs" style={{ color: s.tone === "warn" ? "var(--warn)" : "var(--ink-muted)" }}>
                {s.hint}
              </p>
            )}
          </div>
        ))}
      </div>

      {v.nextActions.length > 0 && (
        <section>
          <h2 className="mb-4 font-display text-xl">Next</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {v.nextActions.map((a) => (
              <Link key={a.href} href={a.href} className="card card-interactive group flex items-start justify-between gap-3 p-4">
                <div>
                  <p className="text-sm font-semibold">{a.label}</p>
                  <p className="muted mt-1 text-xs leading-relaxed">{a.why}</p>
                </div>
                <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="font-display text-xl">
              {v.role === "expert" ? "Open briefs" : "Your projects"}
            </h2>
            <Link href="/dashboard/projects" className="link-underline text-xs">View all</Link>
          </div>
          {v.work.projects.length === 0 ? (
            <EmptyState
              text={v.role === "expert" ? "No bids placed yet." : "You have not posted a project yet."}
              cta={v.role === "expert" ? undefined : { label: "Post a brief", href: "/dashboard/projects" }}
            />
          ) : (
            <div className="divide-hairline card overflow-hidden">
              {v.work.projects.map((p) => (
                <div key={p.id} className="flex items-center justify-between px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{p.title}</p>
                    <p className="faint text-xs capitalize">{p.status.replace("_", " ")}</p>
                  </div>
                  <span className="faint shrink-0 text-xs">{p.bidCount} bids</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="font-display text-xl">Points activity</h2>
            <Link href="/dashboard/wallet" className="link-underline text-xs">View wallet</Link>
          </div>
          {v.points.recent.length === 0 ? (
            <EmptyState text="No activity yet — your balance has not been touched." />
          ) : (
            <div className="divide-hairline card overflow-hidden">
              {v.points.recent.slice(0, 6).map((l, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-3">
                  <span className="muted text-sm capitalize">{l.reason.replace(/_/g, " ")}</span>
                  <span
                    className="text-sm font-semibold tabular-nums"
                    style={{ color: l.delta < 0 ? "var(--ink-muted)" : l.delta > 0 ? "var(--good)" : "var(--ink-faint)" }}
                  >
                    {l.delta > 0 ? "+" : ""}{l.delta}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {v.points.canRun.length > 0 && (
        <section>
          <h2 className="mb-4 font-display text-xl">What your balance covers right now</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {v.points.canRun.map((a) => (
              <div key={a.name} className="card p-4">
                <p className="text-sm font-semibold">{a.name}</p>
                <p className="faint text-xs">{a.role}</p>
                <p className="mt-2 text-sm">
                  <span className="font-semibold text-brand">{a.runs}×</span>{" "}
                  <span className="muted">at {a.points} pts each</span>
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export function EmptyState({ text, cta }: { text: string; cta?: { label: string; href: string } }) {
  return (
    <div className="card flex flex-col items-start gap-3 p-6">
      <p className="muted text-sm">{text}</p>
      {cta && <Link href={cta.href} className="btn btn-secondary !px-4 !py-2 text-xs">{cta.label}</Link>}
    </div>
  );
}
