import type { ReactNode } from "react";
import Image from "next/image";

/**
 * UI MINIATURES — product imagery, built rather than photographed.
 *
 * These are the "UI miniature" asset mode from the teardown (§6.5):
 * real-looking interface fragments at reduced scale, with rounded
 * corners, a soft shadow and content cropped at the frame edge so it
 * reads as a window onto something larger.
 *
 * Built as components rather than PNGs because:
 *  · they inherit `--suite-tint`, so one mock serves all nine suites —
 *    the per-hub tint system applied to imagery (§7.8);
 *  · they are theme-aware, so dark mode is not a second asset;
 *  · they never go stale against a redesign, and they cost no bytes.
 *
 * CHART RULES (these are depictions of in-product charts, which is the
 * only place charts belong — a marketing page wants a verdict, the
 * product wants analysis):
 *  · One hue plus neutral grey — emphasis form, never a rainbow.
 *  · 2px line strokes, 8px markers, 4px rounded bar ends on the baseline.
 *  · Grid and axes recessive; labels in ink tokens, never series colour.
 *  · Decorative here, so every mock is aria-hidden with a caption
 *    carrying the meaning for assistive technology.
 */

function Frame({
  children, label, className = "",
}: { children: ReactNode; label: string; className?: string }) {
  return (
    <figure className={`overflow-hidden rounded-2xl ${className}`}
            style={{ background: "var(--raised)", border: "1px solid var(--line)", boxShadow: "0 12px 32px -18px rgba(0,0,0,.35)" }}>
      {/* Window chrome — three dots and a title, cropped at the edge */}
      <div className="flex items-center gap-2 border-b px-4 py-2.5" style={{ borderColor: "var(--line-soft)" }}>
        <span className="flex gap-1.5" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <span key={i} className="h-2 w-2 rounded-full" style={{ background: "var(--line)" }} />
          ))}
        </span>
        <span className="faint truncate text-[11px] font-medium">{label}</span>
      </div>
      <div aria-hidden="true">{children}</div>
      <figcaption className="sr-only">{label} — illustrative interface preview.</figcaption>
    </figure>
  );
}

const tint = (a: number) => `color-mix(in srgb, var(--suite-tint, var(--brand)) ${a}%, transparent)`;

/* ── Stat tiles + trend line — the engine dashboard ──────── */
export function DashboardMock({
  label = "Operating dashboard",
  /* Was Health score / Open decisions / Drift alerts — CORE's own
     dashboard vocabulary verbatim, harmless while this mock only ever
     appeared under DESK/SIGNAL/LEARN/MARKET/DOCUSHARE's arbitrary
     index fallback, wrong the moment SuiteMock started routing CORE's
     and GROW's own use cases through the same generic mocks (see the
     header comment on SuiteMock) — GROW's "Market intelligence" panel
     was showing CORE's exact health-score tile. Neutral placeholders
     now, since this component has no suite context to be accurate
     WITH; `label` still carries whatever the calling panel actually
     is. */
  tiles = [
    { v: "87", l: "Overall score" },
    { v: "14", l: "Active items" },
    { v: "5", l: "Flags this week" },
  ],
  series = [34, 41, 38, 52, 58, 55, 67, 74],
}: {
  label?: string;
  tiles?: { v: string; l: string }[];
  series?: number[];
}) {
  const w = 320, h = 96, max = Math.max(...series) * 1.15;
  const pts = series.map((v, i) => [
    (i / (series.length - 1)) * w,
    h - (v / max) * h,
  ] as const);
  const d = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  const area = `${d} L${w} ${h} L0 ${h} Z`;

  return (
    <Frame label={label}>
      <div className="p-5">
        <div className="grid grid-cols-3 gap-3">
          {tiles.map((t) => (
            <div key={t.l} className="rounded-lg px-3 py-2.5" style={{ background: tint(7) }}>
              <p className="font-display text-2xl leading-none" style={{ color: "var(--suite-tint, var(--brand))" }}>{t.v}</p>
              <p className="faint mt-1.5 text-[10px] leading-tight">{t.l}</p>
            </div>
          ))}
        </div>

        <svg viewBox={`0 0 ${w} ${h}`} className="mt-5 w-full" preserveAspectRatio="none">
          {[0.25, 0.5, 0.75].map((g) => (
            <line key={g} x1="0" x2={w} y1={h * g} y2={h * g} stroke="var(--line-soft)" strokeWidth="1" />
          ))}
          <path d={area} fill={tint(10)} />
          <path d={d} fill="none" stroke="var(--suite-tint, var(--brand))" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
          <circle cx={pts[pts.length - 1][0] - 3} cy={pts[pts.length - 1][1]} r="4"
                  fill="var(--raised)" stroke="var(--suite-tint, var(--brand))" strokeWidth="2" />
        </svg>
      </div>
    </Frame>
  );
}

/* ── Bars — comparison across periods ────────────────────── */
export function BarChartMock({
  /* Was "Cost by period" — FINANCE's vocabulary on a mock now shared
     by any suite whose claim reads as comparison-shaped. See the note
     on DashboardMock's `tiles`. */
  label = "Trend by period",
  bars = [42, 58, 51, 73, 66, 88],
  highlight = 5,
}: { label?: string; bars?: number[]; highlight?: number }) {
  const max = Math.max(...bars) * 1.1;
  return (
    <Frame label={label}>
      <div className="p-5">
        <div className="flex h-36 items-end gap-2">
          {bars.map((b, i) => (
            <div
              key={i}
              className="flex-1 rounded-t"
              style={{
                height: `${(b / max) * 100}%`,
                background: i === highlight ? "var(--suite-tint, var(--brand))" : tint(22),
              }}
            />
          ))}
        </div>
        <div className="mt-3 flex justify-between">
          {["Q1", "Q2", "Q3", "Q4", "Q1", "Q2"].map((q, i) => (
            <span key={i} className="faint text-[10px]">{q}</span>
          ))}
        </div>
      </div>
    </Frame>
  );
}

/* ── Gauge — a single ratio against a band ───────────────── */
export function GaugeMock({
  /* Was "Decision clarity" — CORE's own term. See the note on
     DashboardMock's `tiles`. */
  label = "Composite score",
  value = 68,
}: { label?: string; value?: number }) {
  const r = 52, c = Math.PI * r;
  const filled = (value / 100) * c;
  return (
    <Frame label={label}>
      <div className="flex flex-col items-center px-5 py-6">
        <svg viewBox="0 0 140 78" className="w-40">
          <path d="M18 70 A52 52 0 0 1 122 70" fill="none" stroke="var(--line)" strokeWidth="12" strokeLinecap="round" />
          <path d="M18 70 A52 52 0 0 1 122 70" fill="none" stroke="var(--suite-tint, var(--brand))"
                strokeWidth="12" strokeLinecap="round" strokeDasharray={`${filled} ${c}`} />
        </svg>
        <p className="-mt-6 font-display text-3xl" style={{ color: "var(--suite-tint, var(--brand))" }}>
          {value}<span className="text-lg">%</span>
        </p>
        <div className="mt-4 flex gap-4">
          {["0–33 Low", "34–66 Medium", "67–100 High"].map((b, i) => (
            <span key={b} className="faint flex items-center gap-1.5 text-[10px]">
              <span className="h-2 w-2 rounded-full" style={{ background: tint(20 + i * 35) }} />
              {b}
            </span>
          ))}
        </div>
      </div>
    </Frame>
  );
}

/* ── Agent panel — the interface demo ────────────────────── */
export function AgentMock({
  agent = "Catalyst",
  /* Was role "Diagnostic agent", prompt "Score decision quality for
     the operations function.", and all three `lines` — every one of
     them CORE's own vocabulary (decision clarity, authority ambiguity,
     cadence). Harmless while AgentMock only appeared under the five
     suites with no flagship diagram; wrong once TALENT's "Succession
     and pathways" or GROW's "Advisory and scaling" started landing
     here too. See the note on DashboardMock's `tiles`. */
  role = "Assessment agent",
  prompt = "Score readiness for the selected scope.",
  lines = [
    "Composite score — 68 / 100",
    "Gaps found in 3 of 11 areas reviewed",
    "Drift detected against the baseline",
  ],
  cost = "40 pts",
}: {
  agent?: string; role?: string; prompt?: string; lines?: string[]; cost?: string;
}) {
  return (
    <Frame label={`${agent} — ${role}`}>
      <div className="space-y-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <span className="rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wide"
                style={{ background: tint(14), color: "var(--suite-tint, var(--brand))" }}>
            ✦ {agent}
          </span>
          <span className="faint shrink-0 text-[10px]">{cost}</span>
        </div>

        <p className="rounded-lg px-3 py-2.5 text-[11px] leading-snug"
           style={{ background: "var(--line-soft)" }}>
          {prompt}
        </p>

        <ul className="space-y-2">
          {lines.map((l) => (
            <li key={l} className="flex gap-2 text-[11px] leading-snug">
              <span className="mt-[5px] h-1 w-1 shrink-0 rounded-full"
                    style={{ background: "var(--suite-tint, var(--brand))" }} />
              <span className="muted">{l}</span>
            </li>
          ))}
        </ul>

        <div className="flex gap-2 pt-1">
          <span className="rounded-md px-2.5 py-1.5 text-[10px] font-semibold"
                style={{ background: "var(--suite-tint, var(--brand))", color: "var(--brand-ink)" }}>
            Open full report
          </span>
          <span className="faint rounded-md px-2.5 py-1.5 text-[10px] font-semibold"
                style={{ border: "1px solid var(--line)" }}>
            Export working
          </span>
        </div>
      </div>
    </Frame>
  );
}

/* ── Table — records and pipeline ────────────────────────── */
export function TableMock({
  label = "Engagement pipeline",
  rows = [
    ["Northwind Group", "Diagnostic", "In review"],
    ["Halden & Co", "Proposal sent", "Awaiting"],
    ["Meridian Trust", "Milestone 2", "Released"],
    ["Okonkwo Partners", "Milestone 3", "Approved"],
  ],
}: { label?: string; rows?: string[][] }) {
  return (
    <Frame label={label}>
      <div className="p-1">
        <div className="grid grid-cols-3 gap-2 px-4 py-2.5">
          {["Client", "Stage", "Status"].map((h) => (
            <span key={h} className="faint text-[9px] font-semibold uppercase tracking-wider">{h}</span>
          ))}
        </div>
        {rows.map((r, i) => (
          <div key={r[0]} className="grid grid-cols-3 gap-2 px-4 py-2.5"
               style={{ background: i % 2 ? tint(5) : "transparent" }}>
            <span className="truncate text-[11px] font-medium">{r[0]}</span>
            <span className="muted truncate text-[11px]">{r[1]}</span>
            <span className="truncate text-[11px]" style={{ color: "var(--suite-tint, var(--brand))" }}>{r[2]}</span>
          </div>
        ))}
      </div>
    </Frame>
  );
}

/** Picks a mock appropriate to the use-case slot on a suite page. */
/**
 * WHAT THIS RENDERS BESIDE EACH USE CASE, and why it used to be wrong
 * twice over.
 *
 * FIRST WRONG VERSION: `Chosen = byIndex[index % 5]` — the mock was
 * picked by POSITION in the list, with no relationship to what the use
 * case's own words say.
 *
 * SECOND WRONG VERSION: CORE, GROW, TALENT and FINANCE were given ONE
 * flagship diagram each (SHOWCASE_ART, keyed only by `suiteId`) and it
 * was reused for every use case on that suite's page — CORE's page
 * showed the identical bar-and-threshold drawing under "Decision
 * intelligence", "Operating rhythm", "Governance and assurance" AND
 * "Engagement workflow", four different claims illustrated by one
 * picture with only the caption changing. That reads as the same
 * asset copy-pasted, because it is. SHOWCASE_ART stays exactly where
 * it still earns its keep — the homepage carousel, one suite per
 * slide, imported straight from ShowcaseArt.tsx by SuiteShowcase.tsx —
 * it is simply no longer wired into this per-use-case picker.
 *
 * THIS VERSION picks from the five generic mocks for all nine suites,
 * uniformly, by the SHAPE of the claim rather than its position or its
 * suite: a score-shaped claim ("clarity", "readiness", "cadence",
 * "margin") gets the gauge; a record-shaped claim ("milestone",
 * "pipeline", "governance", "invoice") gets the table; a people-shaped
 * claim ("expert", "succession", "advisory") gets the agent mock; a
 * comparison-shaped claim ("scenario", "forecast", "plan") gets the
 * bar chart; everything else gets the dashboard. Checked against every
 * use case on all nine suite pages when written, specifically to keep
 * adjacent cards on the same page from landing on the same shape twice
 * where a better-fitting keyword was available.
 *
 * `label` is the use case's own eyebrow, threaded through to the
 * window-chrome title instead of each mock's generic default ("Operating
 * dashboard" for every suite regardless of what it does).
 *
 * The five mocks are called directly rather than collected into one
 * array of components: each takes a different, incompatible set of
 * optional props (bars/highlight, value, rows…), so a shared array type
 * would either fight TypeScript's structural typing or paper over it
 * with `any`. A plain if-chain costs four extra lines and keeps every
 * prop honest.
 */
export function SuiteMock({
  index, label, claim = "",
}: {
  index: number;
  label?: string;
  /** The use case's own eyebrow + title, used to pick the chart SHAPE. */
  claim?: string;
}) {
  if (/score|clarity|readiness|rating|health|cadence|rhythm|tempo|margin/i.test(claim)) return <GaugeMock label={label} />;
  if (/pipeline|milestone|workflow|stage|directory|list|quote|invoic|shar|publish|governance|control|complian|audit/i.test(claim)) return <TableMock label={label} />;
  // AgentMock has no `label` prop — it builds its own window title from
  // `agent — role`, which already reads better than the generic default
  // this heuristic exists to replace.
  if (/match|expert|specialist|sourc|agent|succession|\bbench\b|advis/i.test(claim)) return <AgentMock />;
  if (/scenario|forecast|period|trend|compar|\bplan\b|resourc/i.test(claim)) return <BarChartMock label={label} />;

  const byIndex = [DashboardMock, AgentMock, BarChartMock, GaugeMock, TableMock];
  const Chosen = byIndex[index % byIndex.length];
  return <Chosen label={label} />;
}

/**
 * A REAL captured screenshot, in the same Frame chrome as the SVG
 * mocks above. Used only on the homepage hero — every other product
 * imagery slot stays theme-aware SVG on purpose (dark mode, per-suite
 * tint, never stale against a redesign; a screenshot has none of
 * that and needs re-capturing by hand).
 *
 * The account behind these is a seeded demo account, not a live
 * customer's — said plainly in the caption rather than left
 * ambiguous, the same discipline applied to every other claim on
 * this site.
 */
export function ScreenshotFrame({
  src, label, width = 640, height = 480,
}: { src: string; label: string; width?: number; height?: number }) {
  return (
    <figure className="overflow-hidden rounded-2xl"
            style={{ background: "var(--raised)", border: "1px solid var(--line)", boxShadow: "0 12px 32px -18px rgba(0,0,0,.35)" }}>
      <div className="flex items-center gap-2 border-b px-4 py-2.5" style={{ borderColor: "var(--line-soft)" }}>
        <span className="flex gap-1.5" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <span key={i} className="h-2 w-2 rounded-full" style={{ background: "var(--line)" }} />
          ))}
        </span>
        <span className="faint truncate text-[11px] font-medium">{label}</span>
      </div>
      <Image
        src={src} alt={`${label} — real product screenshot, seeded demo account.`}
        width={width} height={height}
        sizes="(min-width: 1024px) 33vw, 100vw"
        className="block h-auto w-full"
        style={{ objectFit: "cover", objectPosition: "top" }}
      />
      <figcaption className="sr-only">{label} — real product screenshot, from a seeded demo account.</figcaption>
    </figure>
  );
}
