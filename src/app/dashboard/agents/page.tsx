"use client";

import { useDashboard } from "@/components/dashboard/DashboardShell";
import { PLATFORM_AGENTS } from "@/content/agents";

/** Every agent, what it costs, and what the caller's own balance
 *  currently covers — reusing the same `canRun` computation the
 *  overview and wallet pages already show, so the three numbers can
 *  never disagree. */
export default function AgentsPage() {
  const v = useDashboard();
  const canRunByName = new Map(v.points.canRun.map((a) => [a.name, a]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl">Agents</h1>
        <p className="muted mt-1 text-sm">Charged per completed outcome. A failed run costs nothing.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PLATFORM_AGENTS.map((a) => {
          const can = canRunByName.get(a.name);
          return (
            <div key={a.id} className="card p-5">
              <a.Icon className="h-5 w-5 text-brand" strokeWidth={1.75} aria-hidden="true" />
              <p className="mt-3 font-display text-lg">{a.name}</p>
              <p className="faint text-xs">{a.role}</p>
              <p className="muted mt-2 text-xs leading-relaxed">{a.what}</p>
              <div className="mt-4 flex items-baseline justify-between border-t pt-3" style={{ borderColor: "var(--line-soft)" }}>
                <span className="text-sm font-semibold text-brand">{a.points} pts</span>
                <span className="faint text-xs">
                  {can ? `${can.runs}× available` : "Top up to run"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
