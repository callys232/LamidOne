import { Check, Minus, X } from "lucide-react";
import type { ComparisonRow } from "@/content/suites";

/**
 * The three-column competitive comparison — the most transferable thing
 * on HubSpot's newest pages (teardown §7.9).
 *
 * Four mechanics, all load-bearing:
 *  1. Competitors are CATEGORIES, not brands ("Point solutions",
 *     "Legacy CRM"). Legally safer, ages without maintenance, and lets
 *     every reader slot in whichever vendor they actually use. Named
 *     rivals belong only on /compare, where the job is search capture.
 *  2. THREE states, not two: includes / partial / absent. This is what
 *     makes it credible — a table where the alternative scores zero on
 *     every row reads as propaganda. The concession buys the column.
 *  3. An explicit legend defining all three symbols.
 *  4. The tick is GREEN (status), never red (brand). Forty brand-red
 *     marks would spend the accent on rows nobody clicks.
 */
export function ComparisonTable({
  headline, blurb, columns, rows,
}: {
  headline: string;
  blurb: string;
  columns: string[];
  rows: ComparisonRow[];
}) {
  return (
    <div>
      <div className="mb-10 max-w-3xl">
        <h2 className="h-section">{headline}</h2>
        <p className="lead mt-4">{blurb}</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left">
          <caption className="sr-only">{headline}</caption>
          <thead>
            <tr style={{ background: "var(--line-soft)" }}>
              <th scope="col" className="rounded-tl-xl px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.12em]">
                Capability
              </th>
              {columns.map((c, i) => (
                <th
                  key={c}
                  scope="col"
                  className={`px-5 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.12em] ${
                    i === columns.length - 1 ? "rounded-tr-xl" : ""
                  }`}
                  /* Our column is tinted to mark it as the subject. */
                  style={i === 0 ? { background: "var(--brand-soft)" } : undefined}
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.capability} className="border-b" style={{ borderColor: "var(--line-soft)" }}>
                <th scope="row" className="px-5 py-4 text-sm font-normal">{row.capability}</th>
                {row.values.map((v, i) => (
                  <td
                    key={i}
                    className="px-5 py-4 text-center"
                    style={i === 0 ? { background: "var(--brand-soft)" } : undefined}
                  >
                    <Mark value={v} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="mt-6 flex flex-wrap gap-x-8 gap-y-2 text-xs">
        <li className="flex items-center gap-2"><Mark value={true} /> Includes capability</li>
        <li className="flex items-center gap-2"><Mark value="partial" /> Partial or inconsistent capability</li>
        <li className="flex items-center gap-2"><Mark value={false} /> Does not include capability</li>
      </ul>
    </div>
  );
}

function Mark({ value }: { value: true | false | "partial" }) {
  if (value === true) {
    return (
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full"
            style={{ background: "var(--good)" }} role="img" aria-label="Includes capability">
        <Check className="h-3.5 w-3.5" style={{ color: "var(--page)" }} strokeWidth={3} aria-hidden="true" />
      </span>
    );
  }
  if (value === "partial") {
    return (
      <span className="faint inline-flex h-5 w-5 items-center justify-center"
            role="img" aria-label="Partial or inconsistent capability">
        <Minus className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
      </span>
    );
  }
  return (
    <span className="faint inline-flex h-5 w-5 items-center justify-center rounded-full"
          style={{ border: "1.5px solid currentColor" }} role="img" aria-label="Does not include capability">
      <X className="h-3 w-3" strokeWidth={2.5} aria-hidden="true" />
    </span>
  );
}
