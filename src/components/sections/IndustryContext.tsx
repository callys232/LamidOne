import { industryResearchForSuite } from "@/content/industryResearch";

/**
 * Third-party research, visually and semantically separate from this
 * suite's own stats.
 *
 * StatRow (used in the use-cases grid above this) renders LAMID ONE's
 * OWN claims — verified figures about the product itself, or nothing at
 * all where a figure isn't verified yet (see StatRow's own comment on
 * why it drops unverified stats rather than fabricate one). This
 * component is a different category of claim entirely: what independent
 * research says about the problem this suite exists to solve, not a
 * measurement of LAMID ONE. Mixing the two into one visual language
 * would let a reader mistake a McKinsey or SHRM figure for something
 * LAMID ONE achieved — so this gets its own label, its own citation line
 * and its own outbound link, every time.
 *
 * Renders nothing where `industryResearch.ts` has no entry for a suite
 * (currently DESK) — see that file's header for why some suites were
 * deliberately left uncited rather than given a source that didn't hold
 * up to checking.
 */
export function IndustryContext({ suiteId, tint }: { suiteId: string; tint: string }) {
  const items = industryResearchForSuite(suiteId);
  if (items.length === 0) return null;

  return (
    <div className="mt-10 rounded-2xl border p-6 sm:p-7" style={{ borderColor: "var(--line-soft)" }}>
      <p className="faint text-[11px] font-semibold uppercase tracking-[0.14em]">
        Industry context — not a LAMID ONE measurement
      </p>
      <div className="mt-4 space-y-5">
        {items.map((item) => (
          <div key={item.stat}>
            <p className="text-sm leading-relaxed">{item.stat}</p>
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1.5 inline-block text-xs font-semibold underline decoration-1 underline-offset-2"
              style={{ color: tint }}
            >
              {item.source}
            </a>
            {item.note && <p className="faint mt-1 text-xs italic leading-relaxed">{item.note}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
