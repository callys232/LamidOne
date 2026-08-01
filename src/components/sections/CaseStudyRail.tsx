"use client";

import { useState } from "react";
import Link from "next/link";
import { StatRow } from "@/components/ui/Stat";

/**
 * Case studies — four credibility mechanics stacked (teardown §1 §7).
 *
 *  1. SEGMENT RAIL. "Works for every size" is a claim; the rail is the
 *     proof of it. The reader self-selects and sees a peer, not a
 *     Fortune 500. Rendered as a vertical rail — the newer treatment.
 *  2. OUTCOME IMAGERY. The photo shows the customer's result, not
 *     their office or a headshot.
 *  3. FULL ATTRIBUTION. Name, role, organisation. Attribution
 *     completeness is the whole difference between a testimonial and a
 *     quote — "Whitney Hallock, Director of Marketing, Angel City FC"
 *     is falsifiable; "a happy customer" is not.
 *  4. ASYMMETRIC METRICS. Mixed notation reads as measured data.
 *
 * ⚠️  Ships EMPTY until a real, consented story exists. One verifiable
 * case study outperforms three invented ones, and in this category
 * invented ones are a legal exposure. The empty state is deliberate.
 */

export type CaseStudy = {
  segment: "Enterprise" | "Mid-market" | "Small business";
  organisation: string;
  quote: string;
  person: { name: string; role: string };
  stats: { value: string; label: string; verified: boolean }[];
  image?: string;
  href?: string;
};

export function CaseStudyRail({ studies }: { studies: CaseStudy[] }) {
  const segments = Array.from(new Set(studies.map((s) => s.segment)));
  const [active, setActive] = useState(segments[0]);
  const shown = studies.filter((s) => s.segment === active);

  if (studies.length === 0) {
    return (
      <div className="card p-10 text-center">
        <h2 className="h-section">Case studies are being written.</h2>
        <p className="lead mx-auto mt-4 max-w-xl">
          We publish named organisations with figures they have verified — not anonymous
          testimonials. The first studies go up as engagements complete.
        </p>
        <Link href="/contact" className="link-underline mt-6 inline-flex">
          Talk to us about being one of them
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-10 md:grid-cols-12">
      <nav className="md:col-span-3" aria-label="Case study segments">
        <ul className="space-y-1">
          {segments.map((s) => {
            const on = s === active;
            return (
              <li key={s}>
                <button
                  type="button"
                  onClick={() => setActive(s)}
                  aria-current={on ? "true" : undefined}
                  className={`w-full border-l-2 px-4 py-2.5 text-left text-sm font-semibold transition-colors ${
                    on ? "text-brand" : "muted hover:text-brand"
                  }`}
                  style={{ borderColor: on ? "var(--brand)" : "var(--line)" }}
                >
                  {s}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="md:col-span-9">
        {shown.map((s) => (
          <article key={s.organisation} className="card overflow-hidden">
            <div className="grid gap-8 p-8 md:grid-cols-2">
              {s.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.image} alt={`${s.organisation} — outcome`} className="h-full w-full rounded-xl object-cover" loading="lazy" />
              )}
              <div className="flex flex-col justify-center">
                <p className="font-display text-xl leading-snug">&ldquo;{s.quote}&rdquo;</p>
                <p className="mt-6 text-sm font-semibold">{s.person.name}</p>
                <p className="muted text-sm">{s.person.role}, {s.organisation}</p>
                {s.href && <Link href={s.href} className="link-underline mt-4 self-start text-sm">Read the full case study</Link>}
              </div>
            </div>
            <div className="border-t px-8 py-6" style={{ borderColor: "var(--line-soft)" }}>
              <StatRow stats={s.stats} />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

/** No fabricated stories. Populate as real, consented studies land. */
export const CASE_STUDIES: CaseStudy[] = [];
