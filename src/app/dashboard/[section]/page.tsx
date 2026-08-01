"use client";

import { notFound } from "next/navigation";
import { use } from "react";
import { Construction, Lock } from "lucide-react";
import { useDashboard } from "@/components/dashboard/DashboardShell";
import { getSection } from "@/content/dashboard";
import { EmptyState } from "@/app/dashboard/page";

/**
 * Generic section renderer.
 *
 * The five hand-built pages (overview, wallet, projects, escrow,
 * engines) cover the sections with real backing data today. Every
 * other declared section — agents, bids, members, billing, audit, and
 * so on — renders here so the sidebar is never a dead link while its
 * dedicated page is built, and so a role never sees a 404 for a section
 * their tier legitimately grants.
 *
 * A section that IS in the registry but not in the caller's role list
 * (someone hand-typing a URL) 404s for real — the registry is the
 * access boundary, not just a navigation convenience.
 */
export default function SectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = use(params);
  const v = useDashboard();
  const meta = getSection(section);

  if (!meta || !meta.roles.includes(v.role)) notFound();

  const locked = v.sections.find((s) => s.id === section)?.locked;

  if (locked) {
    const unlocksAt = v.sections.find((s) => s.id === section)?.unlocksAt;
    return (
      <div className="card flex flex-col items-start gap-3 p-8">
        <Lock className="h-6 w-6 faint" aria-hidden="true" />
        <h1 className="font-display text-xl">{meta.label} is on {unlocksAt}</h1>
        <p className="muted text-sm">{meta.blurb}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl">{meta.label}</h1>
        <p className="muted mt-1 text-sm">{meta.blurb}</p>
      </div>
      <div className="card flex flex-col items-start gap-3 p-8">
        <Construction className="h-5 w-5 faint" aria-hidden="true" />
        <EmptyState text="This section's dedicated view is being built. The data behind it is already live in the API." />
      </div>
    </div>
  );
}
