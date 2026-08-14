import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { SUITES, type Suite } from "@/content/suites";
import { altitudeLabel } from "@/content/strategyLevels";

/**
 * The suite grid — the compression made visible.
 *
 * ~400 engine routes roll up into nine cards. Each card carries the
 * name, the plain-words category, and EXACTLY TWO bullets: bullet one
 * is the outcome, bullet two is the mechanism. The rigidity is what
 * makes it scannable (teardown §1 §4).
 *
 * The suite tint appears ONLY on the glyph — never on the card, the
 * border or the CTA. That is the per-hub tint system: identity from a
 * tint layer, chrome stays brand-red everywhere (teardown §7.8).
 *
 * `scrollable` reproduces ProdLamid's EcosystemHubs pattern: two
 * columns × two rows sit in the viewport (four cards), the section
 * itself never grows, and the remaining suites scroll inside their own
 * pane — the fifth card peeking in at the fixed height's edge signals
 * there is more without needing a "show more" control. Below the `lg`
 * breakpoint the fixed height is released and everything simply stacks,
 * since a short scrollable pane inside a long mobile page fights the
 * page's own scroll rather than helping it.
 */
export function SuiteGrid({
  suites = SUITES, columns = 3, scrollable = false,
}: {
  suites?: Suite[];
  columns?: 2 | 3 | 4;
  scrollable?: boolean;
}) {
  if (scrollable) {
    return (
      <div className="no-scrollbar grid grid-cols-1 gap-5 sm:grid-cols-2 lg:h-[620px] lg:overflow-y-auto lg:pr-1">
        {suites.map((s) => <SuiteCard key={s.id} suite={s} />)}
      </div>
    );
  }

  const cols = columns === 2 ? "sm:grid-cols-2" : columns === 4 ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-2 lg:grid-cols-3";
  return (
    <div className={`grid gap-5 ${cols}`}>
      {suites.map((s) => <SuiteCard key={s.id} suite={s} />)}
    </div>
  );
}

export function SuiteCard({ suite }: { suite: Suite }) {
  const { Icon } = suite;
  const bullets = suite.useCases.slice(0, 2).map((u) => u.title.replace(/\.$/, ""));

  return (
    <article className="card group flex flex-col p-6 transition-colors hover:border-[color:var(--brand-line)]">
      <div className="mb-5 flex items-start justify-between gap-3">
        <span
          className="flex h-10 w-10 items-center justify-center rounded-lg"
          style={{ background: `${suite.tint}14`, color: suite.tint }}
        >
          <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
        </span>
        {suite.external && (
          <span className="faint rounded px-2 py-1 text-[10px] font-medium uppercase tracking-wide"
                style={{ border: "1px solid var(--line)" }}>
            Opens app
          </span>
        )}
      </div>

      <h3 className="font-display text-xl">{suite.name}</h3>
      <p className="faint mt-1 text-[13px]">{suite.kind}</p>
      <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-wide" style={{ color: suite.tint }}>
        {altitudeLabel(suite.strategyLevel)} strategy
      </p>

      <ul className="mt-5 flex-1 space-y-2.5">
        {bullets.map((b) => (
          <li key={b} className="muted flex gap-2.5 text-sm leading-snug">
            <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-brand" aria-hidden="true" />
            {b}
          </li>
        ))}
      </ul>

      <Link
        href={`/suites/${suite.id}`}
        className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold transition-colors group-hover:text-brand"
      >
        Learn more
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
      </Link>
    </article>
  );
}

/**
 * Launch panel for externally hosted products (LEARN, DOCUSHARE).
 * Names the destination host explicitly so the jump is never a
 * surprise, and every control opens in a new tab.
 *
 * Takes the narrow shape rather than a full `Suite` so DOCUSHARE's own
 * page can reuse it — DOCUSHARE isn't a `Suite` anymore (see
 * content/docushare.ts), but it still has a `name` and an `external`,
 * which is all this component ever actually read.
 */
export function ExternalLaunch({ suite }: { suite: { name: string; external?: Suite["external"] } }) {
  if (!suite.external) return null;
  const { url, appName, label } = suite.external;
  const host = new URL(url).host;

  return (
    <div className="card flex flex-col gap-5 p-7 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-display text-xl">{appName}</p>
        {/* Was two flat sentences saying the same thing twice ("runs as
            its own application" / "opens in a new tab") — combined into
            one, since both clauses exist to make the same point: this
            isn't embedded. */}
        <p className="muted mt-1 text-sm">
          {suite.name} opens in a new tab as its own application, at{" "}
          <span className="font-medium">{host}</span>.
        </p>
      </div>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="btn btn-primary shrink-0"
      >
        {label}
        <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        <span className="sr-only">(opens in a new tab)</span>
      </a>
    </div>
  );
}
