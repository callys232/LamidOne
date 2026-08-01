"use client";

import { useState } from "react";
import { useApi, apiPost } from "@/lib/useApi";
import { ShieldCheck } from "lucide-react";

type Verification = { status: "unverified" | "pending" | "verified" | "rejected"; documents: { kind: string }[] };

const STATUS_COPY: Record<Verification["status"], string> = {
  unverified: "Not started. Verified profiles appear in matched shortlists; unverified ones do not.",
  pending: "Submitted. An operator reviews this — self-submission can never grant the credential itself.",
  verified: "Verified. Your profile carries the badge.",
  rejected: "Not approved. Contact support to see what to resubmit.",
};

export default function VerificationPage() {
  const { data, loading, reload } = useApi<{ verification: Verification }>("/api/verification");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setSubmitting(true);
    await apiPost("/api/verification", { documents: [{ kind: "government_id", ref: "uploaded" }] });
    setSubmitting(false);
    reload();
  }

  const status = data?.verification.status ?? "unverified";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl">Verification</h1>
        <p className="muted mt-1 text-sm">Identity, credentials and certification status.</p>
      </div>

      {loading ? (
        <p className="muted text-sm">Loading…</p>
      ) : (
        <div className="card flex items-start gap-4 p-6">
          <ShieldCheck
            className="mt-0.5 h-6 w-6 shrink-0"
            style={{ color: status === "verified" ? "var(--good)" : "var(--ink-faint)" }}
            aria-hidden="true"
          />
          <div>
            <p className="font-semibold capitalize">{status}</p>
            <p className="muted mt-1 text-sm leading-relaxed">{STATUS_COPY[status]}</p>
            {status === "unverified" && (
              <button onClick={submit} disabled={submitting} className="btn btn-primary mt-4 !px-4 !py-2 text-xs">
                Submit for review
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
