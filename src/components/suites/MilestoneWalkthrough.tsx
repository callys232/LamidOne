"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play, Users, ListChecks, Clock, CheckCircle2 } from "lucide-react";

/**
 * A walkthrough of structuring and tracking a milestone on an awarded
 * project — the real form and status lifecycle built in
 * dashboard/projects/[id]/page.tsx's MilestonesSection, not an invented
 * UI. Built as mockup frames rather than a recorded video, matching
 * DashboardConnectDemo's own reasoning: no video asset exists, and a
 * mockup can't drift out of sync with a redesign the way a recording
 * would.
 *
 * Deliberately does NOT show funds moving. The milestone record and its
 * status transitions (pending → submitted → approved) are real and
 * enforced; an actual balance hold against that status is not wired up
 * yet (see the trust centre's "Escrow fund holds" entry). This
 * walkthrough shows exactly what happens today — structuring and
 * tracking delivery — and no further.
 */

type Frame = { label: string; render: () => React.ReactNode };

const FRAMES: Frame[] = [
  {
    label: "Award a bid",
    render: () => (
      <MockScreen>
        <MockNav current="Project" />
        <MockCard title="Bids (3)" icon={<Users className="h-4 w-4" aria-hidden="true" />}>
          <MockBid amount="$4,200 · 12 working days" active />
          <MockBid amount="$3,600 · 15 working days" />
        </MockCard>
      </MockScreen>
    ),
  },
  {
    label: "Define a milestone",
    render: () => (
      <MockScreen>
        <MockNav current="Project" />
        <MockCard title="Milestones" icon={<ListChecks className="h-4 w-4" aria-hidden="true" />}>
          <p className="muted text-xs leading-relaxed">No milestones defined yet — break the delivery down below.</p>
          <MockField label="Milestone title" value="Phase 1 — discovery and plan" />
          <div className="grid grid-cols-2 gap-2">
            <MockField label="Amount (USD)" value="1,500" />
            <MockField label="Due date" value="12 Sep 2026" />
          </div>
          <span className="btn btn-primary mt-1 inline-flex !px-3 !py-1.5 text-xs">Add milestone</span>
        </MockCard>
      </MockScreen>
    ),
  },
  {
    label: "Track it through delivery",
    render: () => (
      <MockScreen>
        <MockNav current="Project" />
        <MockCard title="Milestones" icon={<ListChecks className="h-4 w-4" aria-hidden="true" />}>
          <MockMilestone title="Phase 1 — discovery and plan" amount="$1,500" status="submitted" />
          <p className="faint flex items-center gap-1.5 text-xs">
            <Clock className="h-3 w-3" aria-hidden="true" /> Waiting on your review
          </p>
        </MockCard>
      </MockScreen>
    ),
  },
  {
    label: "Approve to complete",
    render: () => (
      <MockScreen>
        <MockNav current="Project" />
        <MockCard title="Milestones" icon={<ListChecks className="h-4 w-4" aria-hidden="true" />}>
          <MockMilestone title="Phase 1 — discovery and plan" amount="$1,500" status="approved" />
          <p className="flex items-center gap-1.5 text-xs" style={{ color: "var(--good)" }}>
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> Approved — the expert is notified.
          </p>
        </MockCard>
      </MockScreen>
    ),
  },
];

const AUTO_ADVANCE_MS = 4500;

export function MilestoneWalkthrough() {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % FRAMES.length), AUTO_ADVANCE_MS);
    return () => clearInterval(id);
  }, [playing]);

  return (
    <div className="card overflow-hidden">
      <div className="grid gap-0 md:grid-cols-[1fr_1.2fr]">
        <div className="border-b p-6 md:border-b-0 md:border-r" style={{ borderColor: "var(--line-soft)" }}>
          <p className="eyebrow">How it looks</p>
          <h3 className="font-display mt-2 text-xl">Structuring and tracking a milestone</h3>
          <p className="muted mt-3 text-sm leading-relaxed">
            Real fields, real status lifecycle — once a bid is awarded, this is how delivery gets broken
            down and tracked through to approval.
          </p>
          <ol className="mt-6 space-y-2">
            {FRAMES.map((f, i) => (
              <li key={f.label}>
                <button
                  type="button"
                  onClick={() => { setIndex(i); setPlaying(false); }}
                  className="flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left text-sm transition-colors"
                  style={{ background: i === index ? "var(--brand-soft)" : "transparent" }}
                  aria-current={i === index}
                >
                  <span
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] tabular-nums"
                    style={{
                      background: i === index ? "var(--brand)" : "var(--line-soft)",
                      color: i === index ? "var(--brand-ink)" : "var(--ink)",
                    }}
                  >
                    {i + 1}
                  </span>
                  <span className={i === index ? "font-semibold" : "muted"}>{f.label}</span>
                </button>
              </li>
            ))}
          </ol>
          <div className="mt-6 flex items-center gap-2">
            <button
              type="button"
              onClick={() => { setIndex((i) => (i - 1 + FRAMES.length) % FRAMES.length); setPlaying(false); }}
              className="btn btn-ghost !rounded-full !p-2"
              aria-label="Previous step"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setPlaying((p) => !p)}
              className="btn btn-ghost !rounded-full !p-2"
              aria-label={playing ? "Pause" : "Play"}
            >
              {playing ? <Pause className="h-4 w-4" aria-hidden="true" /> : <Play className="h-4 w-4" aria-hidden="true" />}
            </button>
            <button
              type="button"
              onClick={() => { setIndex((i) => (i + 1) % FRAMES.length); setPlaying(false); }}
              className="btn btn-ghost !rounded-full !p-2"
              aria-label="Next step"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          <p className="faint mt-6 text-xs leading-relaxed">
            Illustrative — mocked frames of the real form and status lifecycle, not a recording. Milestone
            status is enforced today; holding real funds against it is on the roadmap (see the trust centre).
          </p>
        </div>
        <div className="p-6" style={{ background: "var(--brand-soft)" }}>
          {FRAMES[index].render()}
        </div>
      </div>
    </div>
  );
}

function MockScreen({ children }: { children: React.ReactNode }) {
  return <div className="space-y-3">{children}</div>;
}

function MockNav({ current }: { current: string }) {
  return (
    <p className="muted mb-1 flex items-center gap-1.5 text-xs">
      Dashboard <span aria-hidden="true">/</span>{" "}
      <span className="font-semibold" style={{ color: "var(--ink)" }}>{current}</span>
    </p>
  );
}

function MockCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border p-4" style={{ borderColor: "var(--line)", background: "var(--page)" }}>
      <p className="flex items-center gap-2 text-sm font-semibold">{icon} {title}</p>
      <div className="mt-3 space-y-3">{children}</div>
    </div>
  );
}

function MockField({ label, value }: { label: string; value: string }) {
  return (
    <label className="block text-xs">
      <span className="muted mb-1 block font-medium">{label}</span>
      <span className="block truncate rounded-md border px-2.5 py-1.5" style={{ borderColor: "var(--line)", color: "var(--ink)" }}>
        {value}
      </span>
    </label>
  );
}

function MockBid({ amount, active }: { amount: string; active?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-md border p-2.5 text-xs" style={{ borderColor: "var(--line)" }}>
      <span className="muted">{amount}</span>
      {active ? (
        <span className="btn btn-primary !px-2.5 !py-1 text-[11px]">Award this bid</span>
      ) : (
        <span className="faint">Submitted</span>
      )}
    </div>
  );
}

const MILESTONE_TONE: Record<string, string> = { pending: "var(--ink-muted)", submitted: "var(--brand)", approved: "var(--good)" };

function MockMilestone({ title, amount, status }: { title: string; amount: string; status: "pending" | "submitted" | "approved" }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border p-2.5" style={{ borderColor: "var(--line)" }}>
      <div className="min-w-0">
        <p className="truncate text-xs font-medium">{title}</p>
        <p className="faint text-[11px]">{amount}</p>
      </div>
      <span
        className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize"
        style={{ color: MILESTONE_TONE[status], border: `1px solid ${MILESTONE_TONE[status]}` }}
      >
        {status}
      </span>
    </div>
  );
}
