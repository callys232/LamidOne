"use client";

import Link from "next/link";
import { useDashboard } from "@/components/dashboard/DashboardShell";
import { SUITES } from "@/content/suites";
import { primarySuiteForSuite } from "@/content/aios";
import { microcopyForSuite } from "@/content/microcopy";
import { EmptyState } from "@/app/dashboard/page";

/**
 * Engines — every suite's compute layer, and the bundles carrying
 * inputs between them. This is the customer-facing door onto
 * `/api/engines/{code}`; running one from here sends the caller to the
 * suite page where the input form lives, with `?bundle=` so the run
 * lands back in their working context.
 */
export default function EnginesPage() {
  const v = useDashboard();

  return (
    <div className="space-y-10">
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Engines available" value={v.intelligence.enginesAvailable} />
        <Stat label="Runs made" value={v.intelligence.runsMade} />
        <Stat label="Active bundles" value={v.intelligence.bundles.length} />
      </div>

      <section>
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="font-display text-xl">Your bundles</h2>
          <span className="faint text-xs">Reusable inputs, carried between engines</span>
        </div>
        {v.intelligence.bundles.length === 0 ? (
          <EmptyState text="No bundles yet. One is created automatically the first time you run an engine." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {v.intelligence.bundles.map((b) => (
              <div key={b.id} className="card p-4">
                <p className="text-sm font-semibold">{b.name}</p>
                <p className="faint mt-1 text-xs">
                  {b.runs} run{b.runs === 1 ? "" : "s"} · updated {new Date(b.updatedAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 font-display text-xl">Run an engine</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SUITES.filter((s) => !s.external).map((s) => {
            /* Before the first run there is nothing to describe, so the
               card says what to do instead of what the suite is — in
               that engine's own words. Once anything has been run the
               category line returns, because the prompt has been
               answered and repeating it would be nagging. */
            const mc = v.intelligence.runsMade === 0
              ? microcopyForSuite(primarySuiteForSuite(s.id)?.id)
              : null;
            return (
              <Link key={s.id} href={`/suites/${s.id}#use-cases`} className="card card-interactive p-5">
                <s.Icon className="h-5 w-5" style={{ color: s.tint }} strokeWidth={1.75} aria-hidden="true" />
                <p className="mt-3 font-semibold">{s.name}</p>
                <p className="faint mt-1 text-xs leading-relaxed">{mc?.emptyState ?? s.kind}</p>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="card p-5">
      <p className="faint text-xs font-medium uppercase tracking-wide">{label}</p>
      <p className="stat-value mt-1 text-3xl">{value.toLocaleString()}</p>
    </div>
  );
}
