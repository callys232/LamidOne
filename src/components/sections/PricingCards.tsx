"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { TIERS, BILLING_FOOTNOTE, type Tier, type TierId } from "@/content/tiers";

/**
 * Tier cards.
 *
 * Mechanics from the teardown:
 *  · CTA sits ABOVE the feature list (§3) — most sites get this wrong.
 *  · The CTA LABEL is the segmentation: "Get started free" / "Buy now"
 *    / "Talk to sales" / "Request access". Self-serve below the line,
 *    sales-assisted above it (§6.1 #2).
 *  · Struck-through anchors appear only where a real promotion exists,
 *    and never on the top tier — publishing a discount there would
 *    undercut the sales team's negotiating room (§3 #3).
 *  · Rank dots (● / ●● / ●●●) encode tier position redundantly, so it
 *    survives greyscale and screenshots (§7.10 #6).
 *  · "Recommended" is allowed to sit on a CHEAP tier. A recommendation
 *    that always points upward is not a recommendation.
 *
 * `show` lets a suite page display a subset — a product page does not
 * have to show the full ladder when fewer options decide faster (§7.1).
 */
export function PricingCards({
  show, defaultAnnual = true,
}: {
  show?: TierId[];
  defaultAnnual?: boolean;
}) {
  const [annual, setAnnual] = useState(defaultAnnual);
  const [hovered, setHovered] = useState<TierId | null>(null);
  const tiers = show ? TIERS.filter((t) => show.includes(t.id)) : TIERS;

  return (
    <div>
      <BillingToggle annual={annual} onChange={setAnnual} />

      <div className={`mt-10 grid gap-5 ${gridCols(tiers.length)}`}>
        {tiers.map((t) => (
          <TierCard
            key={t.id}
            tier={t}
            annual={annual}
            active={hovered === t.id}
            dimmed={hovered !== null && hovered !== t.id}
            onHoverStart={() => setHovered(t.id)}
            onHoverEnd={() => setHovered(null)}
          />
        ))}
      </div>

      <p className="faint mt-8 max-w-3xl text-xs leading-relaxed">{BILLING_FOOTNOTE}</p>
    </div>
  );
}

function gridCols(n: number) {
  if (n <= 2) return "sm:grid-cols-2";
  if (n === 3) return "sm:grid-cols-2 lg:grid-cols-3";
  if (n === 4) return "sm:grid-cols-2 lg:grid-cols-4";
  return "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5";
}

export function BillingToggle({
  annual, onChange,
}: { annual: boolean; onChange: (v: boolean) => void }) {
  /* Savings is DERIVED, never hardcoded — the one thing ProdLamid's
     pricing page already got right, kept. */
  const growth = TIERS.find((t) => t.id === "growth")!;
  const saving =
    growth.price.monthly && growth.price.annual
      ? Math.round((1 - growth.price.annual / growth.price.monthly) * 100)
      : 0;

  return (
    <div className="inline-flex items-center gap-1 rounded-xl p-1" style={{ border: "1px solid var(--line)" }}>
      <button
        type="button"
        onClick={() => onChange(false)}
        aria-pressed={!annual}
        className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${!annual ? "text-brand" : "muted"}`}
        style={!annual ? { background: "var(--brand-soft)" } : undefined}
      >
        Monthly
      </button>
      <button
        type="button"
        onClick={() => onChange(true)}
        aria-pressed={annual}
        className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${annual ? "text-brand" : "muted"}`}
        style={annual ? { background: "var(--brand-soft)" } : undefined}
      >
        Annual
        {saving > 0 && (
          <span className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                style={{ background: "var(--brand)", color: "var(--brand-ink)" }}>
            Save {saving}%
          </span>
        )}
      </button>
    </div>
  );
}

function RankDots({ rank }: { rank: number }) {
  if (rank === 0) return <span className="rank-dot-half" aria-hidden="true" />;
  return (
    <span className="flex gap-1" aria-hidden="true">
      {Array.from({ length: rank }).map((_, i) => <span key={i} className="rank-dot" />)}
    </span>
  );
}

export function TierCard({
  tier, annual, active = false, dimmed = false, onHoverStart, onHoverEnd,
}: {
  tier: Tier; annual: boolean;
  /** Hover/focus state, lifted to the grid so the ACTIVE card can pop
   *  while its siblings dim — a single card cannot know about its
   *  neighbours on its own. */
  active?: boolean; dimmed?: boolean;
  onHoverStart?: () => void; onHoverEnd?: () => void;
}) {
  const price = annual ? tier.price.annual : tier.price.monthly;
  const isCustom = price === null;

  return (
    <div
      className="card relative flex flex-col p-6 transition-all duration-200 ease-out"
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
      onFocus={onHoverStart}
      onBlur={onHoverEnd}
      style={{
        borderColor: active || tier.recommended ? "var(--brand)" : "var(--line)",
        borderWidth: active || tier.recommended ? 1.5 : 1,
        background: active ? "var(--brand-soft)" : "var(--raised)",
        opacity: dimmed ? 0.55 : 1,
        transform: active ? "translateY(-4px) scale(1.015)" : "translateY(0) scale(1)",
        boxShadow: active ? "0 12px 32px -12px rgba(0,0,0,0.28)" : "none",
      }}
    >
      {tier.recommended && (
        <span className="absolute -top-3 left-6 rounded px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide"
              style={{ background: "var(--ink)", color: "var(--page)" }}>
          Recommended
        </span>
      )}

      <div className="mb-4 flex items-center gap-2">
        <RankDots rank={tier.rank} />
        <span className="sr-only">Tier rank {tier.rank + 1} of 5</span>
      </div>

      <h3 className="font-display text-2xl">{tier.name}</h3>
      <p className="muted mt-2 min-h-[3.5rem] text-sm leading-snug">{tier.positioning}</p>

      <div className="my-6">
        {isCustom ? (
          <p className="font-display text-4xl">Custom</p>
        ) : (
          <>
            <div className="flex items-baseline gap-2">
              {tier.price.was && (
                <span className="faint text-lg line-through">${tier.price.was}</span>
              )}
              <span className="font-display text-4xl text-brand">${price}</span>
              {tier.price.unit && <span className="muted text-sm">{tier.price.unit}</span>}
            </div>
            {!tier.price.confirmed && (
              <p className="mt-1 text-[11px]" style={{ color: "var(--warn)" }}>
                Indicative — pending commercial confirmation
              </p>
            )}
          </>
        )}
      </div>

      {/* CTA before the features — correct, and rarely done. */}
      <Button href={tier.cta.href} variant={tier.recommended ? "primary" : "ghost"} className="w-full">
        {tier.cta.label}
      </Button>

      <dl className="mt-6 space-y-2.5 border-t pt-5 text-sm" style={{ borderColor: "var(--line-soft)" }}>
        <Row label="Seats" value={tier.seatsIncluded ? `${tier.seatsIncluded} included` : "Per seat"} />
        {tier.extraSeat && <Row label="Extra seat" value={`$${tier.extraSeat} / mo`} />}
        <Row label="Points on signup" value={tier.pointsGrant.toLocaleString()} />
        <Row
          label="Monthly points"
          value={tier.pointsMonthly ? tier.pointsMonthly.toLocaleString() : "—"}
        />
      </dl>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="muted">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

/** Compact inline list used on suite pages. */
export function TierFeatureList({ features }: { features: readonly string[] }) {
  return (
    <ul className="space-y-2.5">
      {features.map((f) => (
        <li key={f} className="flex items-start gap-2.5 text-sm">
          <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" strokeWidth={2.5} aria-hidden="true" />
          <span className="muted">{f}</span>
        </li>
      ))}
    </ul>
  );
}
