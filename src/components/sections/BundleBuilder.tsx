"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SUITES, type SuiteId } from "@/content/suites";
import { PointsEstimator } from "./PointsEstimator";
import { AgentSpotlight } from "./AgentSpotlight";

/**
 * CREATE A BUNDLE.
 *
 * HubSpot's version lets you mix a DIFFERENT tier per Hub, because
 * each Hub is priced separately there. LAMID ONE deliberately isn't
 * built that way (see the pricing hero: "the second suite costs
 * nothing extra per seat, and the ninth costs nothing extra either")
 * — every paid tier already includes all nine suites. Copying
 * HubSpot's picker literally would mean inventing per-suite tiers
 * that don't exist and charging for something the ladder already
 * includes.
 *
 * So this asks the honest version of the same question: WHICH suites
 * will you actually use? That scopes the points estimator below to
 * just the relevant agents (a shorter, relevant list beats a generic
 * one) and states plainly that the suites themselves are already
 * covered from Starter up — the thing worth estimating is how many
 * points a working month actually needs.
 */
export function BundleBuilder() {
  const [selected, setSelected] = useState<Set<SuiteId>>(new Set());

  function toggle(id: SuiteId) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="grid gap-8 lg:grid-cols-12">
      <div className="lg:col-span-7">
        <p className="faint mb-3 text-[11px] font-semibold uppercase tracking-[0.14em]">
          1. Select the suites you&apos;ll use
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {SUITES.map((s) => {
            const on = selected.has(s.id);
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => toggle(s.id)}
                aria-pressed={on ? "true" : "false"}
                className="flex items-start gap-3 rounded-xl p-4 text-left transition-colors"
                style={{ border: `1px solid ${on ? "var(--brand)" : "var(--line)"}`, background: on ? "var(--brand-soft)" : "var(--raised)" }}
              >
                <span
                  className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md"
                  style={{ border: `1.5px solid ${on ? "var(--brand)" : "var(--line)"}`, background: on ? "var(--brand)" : "transparent" }}
                >
                  {on && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} aria-hidden="true" />}
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-2">
                    <s.Icon className="h-4 w-4 shrink-0 text-brand" aria-hidden="true" />
                    <span className="truncate text-sm font-semibold">{s.name}</span>
                  </span>
                  <span className="muted mt-1 block text-xs leading-relaxed">{s.kind}</span>
                </span>
              </button>
            );
          })}
        </div>

        <p className="muted mt-5 text-xs leading-relaxed">
          {selected.size === 0
            ? "Every suite is included on every paid tier — there is no per-suite upgrade. Pick a few to see typical points usage for just those agents."
            : `${selected.size} of 9 suites selected, across four engines. All included from Starter up — seat price does not change for using more of them. Below is the points a working month in just these suites typically costs.`}
        </p>
      </div>

      <div className="lg:col-span-5">
        <p className="faint mb-3 text-[11px] font-semibold uppercase tracking-[0.14em]">2. Estimate the points</p>
        <PointsEstimator suiteFilter={selected} />
        <div className="mt-4 flex flex-wrap gap-3">
          <Button href="/signup" variant="primary">Start free</Button>
          <Button href="#compare" variant="ghost">View price breakdown</Button>
        </div>

        <div className="mt-6">
          <AgentSpotlight />
        </div>
      </div>
    </div>
  );
}
