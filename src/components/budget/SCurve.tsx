"use client";

import type { SCurvePoint } from "@/lib/budget/types";

/**
 * Cumulative-probability curve, drawn as inline SVG.
 *
 * No charting library: the artifact CSP blocks external scripts, the
 * shape is a simple monotone polyline, and a dependency for one chart
 * is not worth the bundle. Axes are confidence (x) against total cost
 * (y), with the target confidence marked — because the single number
 * anyone actually takes away from an S-curve is "what do I have to
 * budget to be 80% covered".
 */
export function SCurve({
  curve, targetP, base, currency,
}: {
  curve: SCurvePoint[];
  targetP: number;
  base: number;
  currency: string;
}) {
  if (curve.length < 2) return null;

  const W = 560, H = 220, PAD_L = 64, PAD_B = 28, PAD_T = 12, PAD_R = 12;
  const plotW = W - PAD_L - PAD_R;
  const plotH = H - PAD_T - PAD_B;

  const values = curve.map((c) => c.value);
  const lo = Math.min(...values, base);
  const hi = Math.max(...values, base);
  const span = hi - lo || 1;

  const x = (p: number) => PAD_L + ((p - curve[0].p) / (curve[curve.length - 1].p - curve[0].p)) * plotW;
  const y = (v: number) => PAD_T + plotH - ((v - lo) / span) * plotH;

  const line = curve.map((c, i) => `${i === 0 ? "M" : "L"}${x(c.p).toFixed(1)},${y(c.value).toFixed(1)}`).join(" ");
  const area = `${line} L${x(curve[curve.length - 1].p).toFixed(1)},${(PAD_T + plotH).toFixed(1)} L${x(curve[0].p).toFixed(1)},${(PAD_T + plotH).toFixed(1)} Z`;

  const target = curve.reduce((best, c) => (Math.abs(c.p - targetP) < Math.abs(best.p - targetP) ? c : best), curve[0]);

  const money = (n: number) =>
    n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}m`
    : n >= 1_000 ? `${(n / 1_000).toFixed(0)}k`
    : n.toFixed(0);

  return (
    <figure className="m-0">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img"
           aria-label={`Cost probability curve. P${targetP} is ${target.value.toLocaleString()} ${currency}.`}>
        {[0, 0.25, 0.5, 0.75, 1].map((f) => {
          const v = lo + span * (1 - f);
          return (
            <g key={f}>
              <line x1={PAD_L} x2={W - PAD_R} y1={PAD_T + plotH * f} y2={PAD_T + plotH * f}
                    stroke="var(--line-soft)" strokeWidth="1" />
              <text x={PAD_L - 8} y={PAD_T + plotH * f + 3} textAnchor="end"
                    fontSize="9" fill="var(--ink-faint)">{money(v)}</text>
            </g>
          );
        })}

        <path d={area} fill="var(--brand-soft)" opacity="0.5" />
        <path d={line} fill="none" stroke="var(--brand)" strokeWidth="2"
              strokeLinejoin="round" strokeLinecap="round" />

        {/* Deterministic base, for contrast against the risk-adjusted figure. */}
        <line x1={PAD_L} x2={W - PAD_R} y1={y(base)} y2={y(base)}
              stroke="var(--ink-faint)" strokeWidth="1" strokeDasharray="3 3" />

        <line x1={x(target.p)} x2={x(target.p)} y1={PAD_T} y2={PAD_T + plotH}
              stroke="var(--brand)" strokeWidth="1.5" strokeDasharray="4 3" />
        <circle cx={x(target.p)} cy={y(target.value)} r="4" fill="var(--brand)" />

        {curve.filter((_, i) => i % 4 === 0).map((c) => (
          <text key={c.p} x={x(c.p)} y={H - 8} textAnchor="middle" fontSize="9" fill="var(--ink-faint)">
            P{c.p}
          </text>
        ))}
      </svg>
      <figcaption className="faint mt-2 text-xs leading-relaxed">
        Solid line: probability the project comes in at or below that total.
        Dashed horizontal: the deterministic estimate. The gap between them at
        P{targetP} is the contingency this budget needs.
      </figcaption>
    </figure>
  );
}
