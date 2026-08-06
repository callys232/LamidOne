import type { Countable } from "@/content/brand";

/**
 * Stat tiles — a verdict, not a chart.
 *
 * There is not a single chart on the marketing surface, deliberately.
 * A chart invites analysis; a number delivers a verdict, and marketing
 * pages want verdicts. Charts belong inside the product, where the user
 * is doing work (teardown §6.4).
 *
 * The numeral is set in the display serif at a light weight, with a
 * small grey sans caption beneath — the newer of HubSpot's two stat
 * treatments (teardown §7.9 #4).
 *
 * `strict` (default) refuses to render unverified figures. An empty
 * stat row beats an invented one, and in business-performance advisory
 * an invented metric is a legal exposure rather than a puffery one.
 */

export type StatLike = { value: string; label: string; basis?: string; verified: boolean };

export function StatTile({ stat }: { stat: StatLike }) {
  return (
    <div className="flex-1 px-6 first:pl-0 last:pr-0">
      <p className="stat-value text-brand">{stat.value}</p>
      <p className="stat-label">
        {stat.label}
        {stat.basis && <span className="block faint mt-1 text-xs">{stat.basis}</span>}
      </p>
    </div>
  );
}

export function StatRow({
  stats, strict = true, className = "",
}: {
  stats: StatLike[];
  strict?: boolean;
  className?: string;
}) {
  const shown = strict ? stats.filter((s) => s.verified) : stats;
  if (shown.length === 0) return null;

  return (
    <div
      className={`flex flex-col divide-y sm:flex-row sm:divide-y-0 sm:divide-x ${className}`}
      style={{ borderColor: "var(--line)" }}
    >
      {shown.map((s) => (
        <div key={s.label} className="py-6 sm:py-0" style={{ borderColor: "var(--line)" }}>
          <StatTile stat={s} />
        </div>
      ))}
    </div>
  );
}

/** Proof strip — a precise, un-rounded count sentence plus logos.
 *  "299,000+" reads as counted; "300,000" reads as claimed. */
export function ProofStrip({
  sentence, logos = [],
}: {
  sentence: string;
  logos?: { src: string; alt: string }[];
}) {
  return (
    <div className="shell py-12">
      <p className="h-section max-w-3xl">{sentence}</p>
      {logos.length > 0 && (
        <ul className="mt-10 flex flex-wrap items-center gap-x-12 gap-y-8">
          {logos.map((l) => (
            <li key={l.alt}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={l.src} alt={l.alt} className="h-8 w-auto object-contain" loading="lazy" />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
