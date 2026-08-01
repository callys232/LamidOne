"use client";

import Link from "next/link";
import { useDashboard } from "@/components/dashboard/DashboardShell";
import { EmptyState } from "@/app/dashboard/page";

/**
 * Projects — briefs posted (client/enterprise/concierge) or bid on
 * (expert). The list itself comes from `/api/dashboard`; posting a new
 * one goes through `/api/projects`, metered at the published cost.
 */
export default function ProjectsPage() {
  const v = useDashboard();
  const isExpert = v.role === "expert";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl">{isExpert ? "Your bids" : "Your projects"}</h1>
      </div>

      {v.work.projects.length === 0 ? (
        <EmptyState
          text={isExpert ? "You have not bid on anything yet." : "Nothing posted yet."}
          cta={isExpert ? { label: "Browse open briefs", href: "/dashboard/experts" } : { label: "Post a brief", href: "/api/projects" }}
        />
      ) : (
        <div className="grid gap-3">
          {v.work.projects.map((p) => (
            <Link key={p.id} href={`/dashboard/projects/${p.id}`} className="card card-interactive flex items-center justify-between gap-4 p-5">
              <div className="min-w-0">
                <p className="truncate font-semibold">{p.title}</p>
                <p className="faint mt-1 text-xs">
                  {new Date(p.updatedAt).toLocaleDateString()} · {p.bidCount} bid{p.bidCount === 1 ? "" : "s"}
                </p>
              </div>
              <StatusBadge status={p.status} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

const STATUS_TONE: Record<string, string> = {
  open: "var(--brand)",
  awarded: "var(--good)",
  in_delivery: "var(--good)",
  complete: "var(--ink-faint)",
  cancelled: "var(--bad)",
  draft: "var(--ink-faint)",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize"
      style={{ color: STATUS_TONE[status] ?? "var(--ink-muted)", border: `1px solid ${STATUS_TONE[status] ?? "var(--line)"}` }}
    >
      {status.replace("_", " ")}
    </span>
  );
}
