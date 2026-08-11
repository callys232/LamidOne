"use client";

import { ArrowUpRight } from "lucide-react";
import { useDashboard } from "@/components/dashboard/DashboardShell";
import { DOCUSHARE_INFO } from "@/content/docushare";

/**
 * Documents.
 *
 * DocuShare is an external application, so this section is honest
 * about being a launch point rather than an embedded file browser:
 * files attached to an engagement stay linked to that engagement's
 * record, but the browsing UI lives in DocuShare itself, opened in a
 * new tab. Was `getSuite("docushare")` — DOCUSHARE isn't a `Suite`
 * anymore (see content/docushare.ts), so this reads straight from its
 * own content object instead.
 */
export default function DocumentsPage() {
  const v = useDashboard();
  const { Icon } = DOCUSHARE_INFO;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl">Documents</h1>
        <p className="muted mt-1 text-sm">Contracts, deliverables and shared files.</p>
      </div>

      <div className="card flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Icon className="h-8 w-8" style={{ color: DOCUSHARE_INFO.tint }} aria-hidden="true" />
          <div>
            <p className="font-semibold">Files for {v.work.projects.length} project{v.work.projects.length === 1 ? "" : "s"}</p>
            <p className="muted text-xs">Opens in DocuShare, in a new tab. Files stay linked to their engagement.</p>
          </div>
        </div>
        <a href={DOCUSHARE_INFO.external.url} target="_blank" rel="noopener noreferrer" className="btn btn-primary shrink-0">
          Open DocuShare
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}
