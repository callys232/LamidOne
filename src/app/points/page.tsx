import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { Section, SectionHeading, Eyebrow } from "@/components/ui/Section";
import { PointsEstimator } from "@/components/sections/PointsEstimator";
import { BuyPointsButton } from "@/components/sections/BuyPointsButton";
import { ComparisonTable } from "@/components/sections/ComparisonTable";
import { Faq } from "@/components/sections/Faq";
import { PLATFORM_AGENTS, ACTION_COSTS, POINT_PACKAGES, SIGNUP_GRANTS, POINTS_EXPLAINER } from "@/content/agents";
import { TIERS } from "@/content/tiers";

export const metadata: Metadata = {
  title: "LAMID Points",
  description: "The meter. Charged per completed outcome — a run that fails costs nothing.",
};

export default function PointsPage() {
  return (
    <>
      <Header ctaSet="neutral" />
      <main id="main">
        <section className="border-b" style={{ borderColor: "var(--line-soft)" }}>
          <div className="shell py-20">
            <div className="max-w-3xl">
              <Eyebrow>{POINTS_EXPLAINER.eyebrow}</Eyebrow>
              <h1 className="h-display mt-6">{POINTS_EXPLAINER.title}</h1>
              <p className="lead mt-6">{POINTS_EXPLAINER.body}</p>
            </div>
          </div>
        </section>

        <Section id="estimator">
          <SectionHeading
            eyebrow="Estimate"
            title="Work out what a month costs you."
            blurb="Set your expected volume and the estimator names the cheapest plan whose allowance covers it."
          />
          <div className="grid gap-8 lg:grid-cols-12">
            <div className="lg:col-span-7"><PointsEstimator /></div>
            <div className="lg:col-span-5 space-y-6">
              <div className="card p-6">
                <h3 className="font-semibold">Included with each plan</h3>
                <dl className="mt-4 space-y-2.5 text-sm">
                  {TIERS.map((t) => (
                    <div key={t.id} className="flex items-baseline justify-between gap-4">
                      <dt className="muted">{t.name}</dt>
                      <dd className="font-semibold tabular-nums">
                        {t.pointsGrant.toLocaleString()} on signup
                        {t.pointsMonthly > 0 && <span className="faint"> · {t.pointsMonthly.toLocaleString()}/mo</span>}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
              <div className="card p-6">
                <h3 className="font-semibold">Buy more, any time</h3>
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
                  expire.
                </p>
              </div>
            </div>
          </div>
        </Section>

        <Section id="costs" tone="tint" className="border-t">
          <SectionHeading eyebrow="What things cost" title="Every priced action, in one place." />
          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <h3 className="font-display text-xl">AI agents</h3>
              <dl className="divide-hairline mt-4">
                {PLATFORM_AGENTS.map((a) => (
                  <div key={a.id} className="flex items-baseline justify-between gap-4 py-3">
                    <dt>
                      <span className="text-sm font-medium">{a.name}</span>
                      <span className="faint mt-0.5 block text-xs">{a.unit}</span>
                    </dt>
                    <dd className="shrink-0 font-semibold text-brand tabular-nums">{a.points} pts</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div>
              <h3 className="font-display text-xl">Marketplace actions</h3>
              <dl className="divide-hairline mt-4">
                {ACTION_COSTS.map((a) => (
                  <div key={a.action} className="flex items-baseline justify-between gap-4 py-3">
                    <dt>
                      <span className="text-sm font-medium">{a.action}</span>
                      <span className="faint mt-0.5 block text-xs">{a.who}</span>
                    </dt>
                    <dd className="shrink-0 font-semibold text-brand tabular-nums">{a.points} pts</dd>
                  </div>
                ))}
              </dl>
              <h3 className="mt-10 font-display text-xl">Signup grants</h3>
              <dl className="divide-hairline mt-4">
                {Object.entries(SIGNUP_GRANTS).map(([k, v]) => (
                  <div key={k} className="flex items-baseline justify-between gap-4 py-3">
                    <dt className="muted text-sm capitalize">{k.replace(/([A-Z])/g, " $1").toLowerCase()}</dt>
                    <dd className="font-semibold tabular-nums">{v.toLocaleString()} pts</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </Section>

        <Section id="compare" className="border-t">
          <ComparisonTable
            headline="Metered per outcome. Not per token, not per seat you are not using."
            blurb="Most AI pricing charges for the attempt, which pushes the risk of a bad result onto the buyer. Points charge on delivery."
            columns={["LAMID Points", "Per-token AI pricing", "Flat AI add-on"]}
            rows={[
              { capability: "Charged only when a run succeeds", values: [true, false, false] },
              { capability: "Cost per action published up front", values: [true, "partial", "partial"] },
              { capability: "Unused capacity is not billed", values: [true, true, false] },
              { capability: "Allowance included in the base plan", values: [true, false, true] },
              { capability: "Purchased balance never expires", values: [true, "partial", false] },
            ]}
          />
        </Section>

        <Section id="faq" className="border-t">
          <Faq
            items={[
              { q: "What are LAMID Points?", a: "The meter for AI agents and marketplace actions. One point is a unit of platform work; a diagnostic costs 40, an expert match 30, a proposal draft 60. Every paid plan includes a monthly allowance and you can buy more at any time." },
              { q: "What happens if a run fails?", a: "You are not charged. Points are debited on a completed outcome — a delivered shortlist, a drafted proposal, a resolved dispute — not on an attempt." },
              { q: "Do points expire?", a: "Purchased points never expire. Monthly plan allowances do not roll over, so a heavy month draws on your purchased balance rather than being lost." },
              { q: "What happens if I run out mid-month?", a: "Nothing breaks. The suites, dashboards and engines keep working; only agent runs and metered marketplace actions pause until you top up." },
              { q: "Can my team share a points balance?", a: "Yes, from Growth upwards. Free and Starter hold points per account; Growth, Enterprise and Concierge use a shared team pool." },
              { q: "How is this different from per-token AI pricing?", a: "Per-token pricing bills you for the model's effort whether or not the output was useful, which puts the risk of a bad result on you. Points bill on delivery, so the incentive to make each run work sits with us." },
            ]}
          />
        </Section>

        <section style={{ background: "var(--ink)" }}>
          <div className="shell py-24 text-center">
            <h2 className="h-display mx-auto max-w-3xl" style={{ color: "var(--page)" }}>
              Your first diagnostic is free.
            </h2>
            <p className="mx-auto mt-6 max-w-xl" style={{ color: "var(--ink-faint)" }}>
              A new account is granted exactly 40 points — the cost of one full diagnostic. Nothing expires, and there is no card.
            </p>
            <div className="mt-10 flex justify-center gap-3">
              <Button href="/signup" variant="primary">Start free</Button>
              <Button href="/agents" variant="contrast">See the agents</Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
