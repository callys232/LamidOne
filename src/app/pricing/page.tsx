import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Section, SectionHeading, Eyebrow } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { PricingCards, TierFeatureList } from "@/components/sections/PricingCards";
import { FeatureMatrix } from "@/components/sections/FeatureMatrix";
import { PricingSidebar } from "@/components/sections/PricingSidebar";
import { BundleBuilder } from "@/components/sections/BundleBuilder";
import { Faq } from "@/components/sections/Faq";
import { PointsEstimator } from "@/components/sections/PointsEstimator";
import { BuyPointsButton } from "@/components/sections/BuyPointsButton";
import { EXPERT_PROGRAM } from "@/content/tiers";
import { POINTS_EXPLAINER, ACTION_COSTS, POINT_PACKAGES } from "@/content/agents";
import { PRICING_FAQ } from "@/content/pricingFaq";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Free, Starter, Growth, Enterprise and Concierge. Seat price follows your account tier, so adding a suite never re-prices your seats. Agents are charged per completed outcome.",
};

/**
 * Pricing.
 *
 * Structure follows the teardown: promo band → ladder → the complete
 * feature matrix → the meter → the supply-side programme → FAQ.
 *
 * The header CTA switches to the single "Get started" variant here —
 * a price anchor in the header is redundant on the pricing page itself.
 */
export default function PricingPage() {
  return (
    <>
      <Header ctaSet="pricing" />
      <main id="main">

        {/* Promo band. Blue-grey rather than red so it never competes
            with the buy buttons directly beneath it; the CTA is ink,
            not brand, for the same reason. */}
        <div style={{ background: "var(--line-soft)" }}>
          <div className="shell flex flex-col items-start gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm">
              <strong className="font-semibold">Save up to 43% across every plan.</strong>{" "}
              <span className="muted">New customers only. Available for a limited time.</span>
            </p>
            <Button href="/signup?plan=starter" variant="contrast">Buy now</Button>
          </div>
        </div>

        <section className="border-b" style={{ borderColor: "var(--line-soft)" }}>
          <div className="shell py-20">
            <div className="max-w-3xl">
              <Eyebrow>Pricing</Eyebrow>
              <h1 className="h-display mt-6">Start free. Add suites, not invoices.</h1>
              <p className="lead mt-6">
                One ladder across all four engines. Seat price follows your account tier rather than
                the number of suites you use — so the second suite costs nothing extra per seat, and
                the ninth costs nothing extra either.
              </p>
            </div>
          </div>
        </section>

        {/* Wider than `.shell` (1240px) on purpose: the sidebar sits in
            the extra width a large viewport has to spare, rather than
            eating into the 1240px the card grid and comparison table
            were designed to fill. */}
        <div className="mx-auto flex w-full max-w-[1520px] flex-col gap-2 px-5 sm:px-8 lg:flex-row lg:items-start lg:gap-10">
        <PricingSidebar />
        <div className="min-w-0 flex-1">

        <Section id="plans" bleed>
          <PricingCards />
        </Section>

        <Section id="bundle" className="border-t" bleed>
          <SectionHeading
            eyebrow="Create a bundle"
            title="Pick your suites. See the points."
            blurb="There is no per-suite tier to choose — every paid plan already includes all nine. This scopes the estimate to what you'll actually use."
          />
          <BundleBuilder />
        </Section>

        {/* The complete breakdown — cards give the shape, this gives
            the truth. Collapsed by default. */}
        <Section id="compare" className="border-t" bleed>
          <SectionHeading
            eyebrow="Every function"
            title="The complete comparison."
            blurb="Ten groups covering access, points, all four engines, the agent layer, marketplace, delivery and payments, analytics, learning, documents, security and support."
          />
          <FeatureMatrix />
        </Section>

        {/* The meter */}
        <Section id="points" tone="tint" className="border-t" bleed>
          <SectionHeading
            eyebrow={POINTS_EXPLAINER.eyebrow}
            title={POINTS_EXPLAINER.title}
            blurb={POINTS_EXPLAINER.body}
          />
          <div className="grid gap-8 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <PointsEstimator />
            </div>
            <div className="lg:col-span-5 space-y-6">
              <div className="card p-6">
                <h3 className="font-semibold">Marketplace actions</h3>
                <dl className="mt-4 space-y-2.5 text-sm">
                  {ACTION_COSTS.map((a) => (
                    <div key={a.action} className="flex items-baseline justify-between gap-4">
                      <dt className="muted">{a.action} <span className="faint">· {a.who}</span></dt>
                      <dd className="font-semibold text-brand">{a.points} pts</dd>
                    </div>
                  ))}
                </dl>
              </div>
              <div className="card p-6">
                <h3 className="font-semibold">Point packages</h3>
                <dl className="mt-4 space-y-2.5 text-sm">
                  {POINT_PACKAGES.map((p) => (
                    <div key={p.points} className="flex items-center justify-between gap-4">
                      <dt className="muted">
                        {p.points.toLocaleString()} points
                        <span className="faint ml-1.5 text-xs">${p.perPoint.toFixed(2)} each</span>
                        <span className="ml-2 font-semibold tabular-nums" style={{ color: "var(--ink)" }}>${p.usd}</span>
                      </dt>
                      <dd><BuyPointsButton points={p.points} /></dd>
                    </div>
                  ))}
                </dl>
                <p className="faint mt-4 text-xs">
                  Priced in USD; nine local currencies converted at checkout. Purchased points never
                  expire. Monthly plan allowances do not roll over.
                </p>
              </div>
            </div>
          </div>
          <p className="faint mt-8 text-xs">{POINTS_EXPLAINER.footnote}</p>
        </Section>

        {/* Supply side */}
        <Section id="experts" className="border-t" bleed>
          <SectionHeading
            eyebrow={EXPERT_PROGRAM.eyebrow}
            title={EXPERT_PROGRAM.title}
            blurb={EXPERT_PROGRAM.blurb}
            action={<Link href="/for-experts" className="link-underline text-sm">Programme details</Link>}
          />
          <div className="grid gap-5 sm:grid-cols-2 lg:max-w-3xl">
            {EXPERT_PROGRAM.tiers.map((t) => (
              <div
                key={t.id}
                className="card flex flex-col p-6"
                style={"recommended" in t && t.recommended ? { borderColor: "var(--brand)", borderWidth: 1.5 } : undefined}
              >
                <h3 className="font-display text-2xl">{t.name}</h3>
                <div className="my-5">
                  <span className="font-display text-4xl">
                    {t.price.monthly === 0 ? "Free" : `$${t.price.monthly}`}
                  </span>
                  {t.price.unit && <span className="muted ml-2 text-sm">{t.price.unit}</span>}
                </div>
                <Button href={t.cta.href} variant={"recommended" in t && t.recommended ? "primary" : "ghost"} className="w-full">
                  {t.cta.label}
                </Button>
                <div className="mt-6 border-t pt-5" style={{ borderColor: "var(--line-soft)" }}>
                  <TierFeatureList features={t.features} />
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section id="faq" className="border-t" bleed>
          <Faq items={PRICING_FAQ} />
        </Section>

        </div>
        </div>

        <section style={{ background: "var(--ink)" }}>
          <div className="shell py-24 text-center">
            <h2 className="h-display mx-auto max-w-3xl" style={{ color: "var(--page)" }}>
              Still deciding? Start on the free plan.
            </h2>
            <p className="mx-auto mt-6 max-w-xl" style={{ color: "var(--ink-faint)" }}>
              Two users and one full diagnostic, free. No card required.
            </p>
            <div className="mt-10 flex justify-center gap-3">
              <Button href="/signup" variant="primary">Get started free</Button>
              <Button href="/contact-sales" variant="contrast">Talk to sales</Button>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
