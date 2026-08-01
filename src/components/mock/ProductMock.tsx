import type { ReactNode } from "react";

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
  tiles = [
    { v: "83", l: "Health score" },
    { v: "12", l: "Open decisions" },
    { v: "4", l: "Drift alerts" },
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
  label = "Cost by period",
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
  label = "Decision clarity",
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
  role = "Diagnostic agent",
  prompt = "Score decision quality for the operations function.",
  lines = [
    "Decision clarity — 68 / 100",
    "Authority ambiguity found in 3 of 11 decisions",
    "Cadence drift detected between Ops and Delivery",
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
    ["Meridian Trust", "Milestone 2", "Funded"],
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
export function SuiteMock({ index, suiteId }: { index: number; suiteId: string }) {
  const byIndex = [DashboardMock, AgentMock, BarChartMock, GaugeMock, TableMock];
  const marketish = ["market", "desk"].includes(suiteId);
  const Chosen = marketish && index === 0 ? TableMock : byIndex[index % byIndex.length];
  return <Chosen />;
}
