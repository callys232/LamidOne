"use client";

import { useState, useMemo } from "react";
import { PLATFORM_AGENTS, ACTION_COSTS, USD_PER_POINT } from "@/content/agents";
import { TIERS, TIERS_BY_ID } from "@/content/tiers";
import type { SuiteId } from "@/content/suites";

/**
 * The points estimator — a qualification tool wearing a calculator.
 *
 * The mechanic worth copying (teardown §3 #9): as the basket grows, the
 * component names the cheapest tier whose monthly allowance covers it.
 * The gating does the upsell; the calculator lets the buyer feel in
 * control while doing it. Nothing here is a dark pattern — the maths is
 * shown and the recommendation is the honest cheapest fit.
 *
 * `suiteFilter`: when BundleBuilder passes a non-empty suite selection,
 * only agents from those suites are listed — marketplace actions
 * (ACTION_COSTS) stay listed regardless, since they are not suite-
 * specific. `null`/omitted shows every agent, as on the main pricing
 * page.
 */

type Basket = Record<string, number>;

export function PointsEstimator({ suiteFilter }: { suiteFilter?: Set<SuiteId> | null }) {
  const [basket, setBasket] = useState<Basket>({});

  const items = useMemo(() => {
    const agents = suiteFilter && suiteFilter.size > 0
      ? PLATFORM_AGENTS.filter((a) => suiteFilter.has(a.suite as SuiteId))
      : PLATFORM_AGENTS;
    return [
      ...agents.map((a) => ({ key: a.id, label: a.name, unit: a.unit, points: a.points, badge: TIERS_BY_ID[a.minTier].name })),
      ...ACTION_COSTS.map((a) => ({ key: a.action, label: a.action, unit: `· ${a.who}`, points: a.points, badge: null as string | null })),
    ];
  }, [suiteFilter]);

  const total = items.reduce((sum, i) => sum + (basket[i.key] ?? 0) * i.points, 0);
  const usd = total * USD_PER_POINT;

  /* Cheapest tier whose monthly allowance covers the basket. */
  const fit = TIERS.find((t) => t.pointsMonthly >= total && t.pointsMonthly > 0);

  return (
    <div className="card p-7">
      <h3 className="font-display text-xl">Estimate a month.</h3>

      <p className="faint mb-3 mt-6 text-[11px] font-semibold uppercase tracking-[0.14em]">
        1. Select what you&apos;ll run
      </p>
      <p className="muted mb-4 text-sm">
        Set how often you expect to run each one — we&apos;ll show what it costs and which plan
        allowance covers it.
      </p>

      <div className="max-h-[320px] space-y-2 overflow-y-auto pr-1">
        {items.length === 0 && (
          <p className="muted py-6 text-center text-sm">Select a suite above to see its agents here.</p>
        )}
        {items.map((i) => {
          const qty = basket[i.key] ?? 0;
          const active = qty > 0;
          return (
            <div
              key={i.key}
              className="flex items-center justify-between gap-4 rounded-lg px-3 py-2.5 transition-colors"
              style={{
                border: `1px solid ${active ? "var(--brand)" : "var(--line)"}`,
                background: active ? "var(--brand-soft)" : "transparent",
              }}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium">{i.label}</p>
                  {i.badge && (
                    <span
                      className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                      style={{ background: "var(--line-soft)" }}
                    >
                      {i.badge}+
                    </span>
                  )}
                </div>
                <p className="faint text-xs">{i.points} pts {i.unit}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => setBasket((b) => ({ ...b, [i.key]: Math.max(0, qty - 1) }))}
                  className="h-7 w-7 rounded-md text-sm font-semibold"
                  style={{ border: "1px solid var(--line)" }}
                  aria-label={`Decrease ${i.label}`}
                >
                  −
                </button>
                <span className="w-8 text-center text-sm tabular-nums" aria-live="polite">{qty}</span>
                <button
                  type="button"
                  onClick={() => setBasket((b) => ({ ...b, [i.key]: qty + 1 }))}
                  className="h-7 w-7 rounded-md text-sm font-semibold"
                  style={{ border: "1px solid var(--line)" }}
                  aria-label={`Increase ${i.label}`}
                >
                  +
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 border-t pt-5" style={{ borderColor: "var(--line-soft)" }}>
        <div className="flex items-baseline justify-between">
          <span className="muted text-sm">Points per month</span>
          <span className="font-display text-3xl text-brand tabular-nums">{total.toLocaleString()}</span>
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <span className="muted text-sm">If bought as a package</span>
          <span className="font-semibold tabular-nums">
            ≈ ${usd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        <p className="mt-5 text-sm">
          {total === 0 ? (
            <span className="muted">Add a few runs to see which plan covers them.</span>
          ) : fit ? (
            <>
              <span className="font-semibold text-brand">{fit.name}</span>{" "}
              <span className="muted">
                includes {fit.pointsMonthly.toLocaleString()} points a month — enough to cover this.
              </span>
            </>
          ) : (
            <span className="muted">
              This exceeds every standard allowance —{" "}
              <a href="/contact-sales" className="link-underline text-brand">talk to sales about a negotiated pool</a>.
            </span>
          )}
        </p>

        <a href="/contact-sales" className="link-underline mt-4 inline-block text-sm text-brand">
          Need something custom? Talk to sales →
        </a>
      </div>
    </div>
  );
}
