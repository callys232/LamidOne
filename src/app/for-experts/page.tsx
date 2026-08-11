import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Section, SectionHeading, Eyebrow } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { TierFeatureList } from "@/components/sections/PricingCards";
import { ComparisonTable } from "@/components/sections/ComparisonTable";
import { Faq } from "@/components/sections/Faq";
import { EXPERT_PROGRAM } from "@/content/tiers";

export const metadata: Metadata = {
  title: "Expert programme",
  description:
    "List your practice, keep the relationship. Membership rather than pay-per-lead, with a three-year revenue share on engagements you source.",
};

/**
 * Supply side.
 *
 * Modelled on a partner programme rather than a lead-gen marketplace
 * (teardown §7.4). The mechanic worth copying is the waivable client
 * fee: it lets the expert look generous to their own client at OUR
 * expense, which buys loyalty far more cheaply than a larger commission.
 */
export default function ForExpertsPage() {
  return (
    <>
      <Header ctaSet="neutral" />
      <main id="main">
        <section className="border-b" style={{ borderColor: "var(--line-soft)", background: "var(--brand-soft)" }}>
          <div className="shell py-20">
            <div className="max-w-3xl">
              <Eyebrow>{EXPERT_PROGRAM.eyebrow}</Eyebrow>
              <h1 className="h-display mt-6">{EXPERT_PROGRAM.title}</h1>
              <p className="lead mt-6">
                LAMID MARKET is the sourcing and delivery suite inside LAMID ONE, the operating
                system running CORE, GROW, TALENT and FINANCE alongside it. {EXPERT_PROGRAM.blurb}
              </p>
              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <Button href="/signup?role=expert" variant="primary">Create a profile</Button>
                <Button href="/experts" variant="secondary">Browse the network</Button>
              </div>
            </div>
          </div>
        </section>

        <Section id="how">
          <SectionHeading
            eyebrow="How it works"
            title="You pay for membership, not for leads."
            blurb="Pay-per-lead marketplaces put you in competition with everyone every time. Membership means the platform is not taking a cut of your attention."
          />
          <div className="grid gap-5 lg:grid-cols-3">
            {[
              { n: "01", t: "List and get matched", d: "Your profile is matched to briefs on discipline, sector and working style — you receive a shortlist place, not a search-result position." },
              { n: "02", t: "Deliver through escrow", d: "Every engagement runs on milestones with funds held in escrow. You know the money is there before you start work." },
              { n: "03", t: "Keep the relationship", d: "You earn a share for three years on engagements you source, and you can waive your client's onboarding fee at our cost." },
            ].map((s) => (
              <div key={s.n} className="card card-interactive p-8">
                <span className="font-display text-3xl text-brand">{s.n}</span>
                <h3 className="mt-5 font-display text-xl">{s.t}</h3>
                <p className="muted mt-3 text-sm leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section id="plans" className="border-t">
          <SectionHeading eyebrow="Membership" title="Two ways to be listed." />
          <div className="grid gap-5 sm:grid-cols-2 lg:max-w-3xl">
            {EXPERT_PROGRAM.tiers.map((t) => (
              <div
                key={t.id}
                className="card flex flex-col p-7"
                style={"recommended" in t && t.recommended ? { borderColor: "var(--brand)", borderWidth: 1.5 } : undefined}
              >
                <h3 className="font-display text-2xl">{t.name}</h3>
                <div className="my-5">
                  <span className="font-display text-4xl">
                    {t.price.monthly === 0 ? "Free" : `$${t.price.monthly}`}
                  </span>
                  {t.price.unit && <span className="muted ml-2 text-sm">{t.price.unit}</span>}
                  {t.price.annual > 0 && (
                    <p className="faint mt-1 text-xs">or ${t.price.annual} a year</p>
                  )}
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

        <Section id="compare" className="border-t">
          <ComparisonTable
            headline="Directories introduce. LAMID MARKET engages."
            blurb="Freelance platforms take a percentage of everything forever and stop at introduction. Traditional referral networks take the client. Neither runs the delivery."
            columns={["LAMID MARKET", "Freelance platforms", "Referral networks"]}
            rows={[
              { capability: "Membership pricing rather than per-lead fees", values: [true, false, "partial"] },
              { capability: "Milestone escrow funded before work starts", values: [true, "partial", false] },
              { capability: "Multi-year revenue share on sourced work", values: [true, false, "partial"] },
              { capability: "Client fee you can waive at our cost", values: [true, false, false] },
              { capability: "Certification visible on your profile", values: [true, "partial", false] },
              { capability: "Engagement counts published even when low", values: [true, false, false] },
            ]}
          />
        </Section>

        <Section id="faq" className="border-t">
          <Faq
            items={[
              { q: "How much does it cost to join the expert network?", a: "Listing is free and includes a public profile plus enough points for your first bid. The Practising tier is $49 a month or $499 a year and adds unlimited applications, boosted bids, priority placement in matched shortlists, certification and a 20% revenue share for three years on engagements you source." },
              { q: "How and when do I get paid?", a: "Every engagement runs on milestones with client funds held in escrow before you begin. When you submit a deliverable and the client approves it, the milestone releases. If a milestone is disputed, the Dispute Agent assembles the evidence from both sides before any decision is made." },
              { q: "Do you take a commission on my fees?", a: "Your engagement fee is agreed with the client and is yours. The platform charges membership, and marketplace actions cost points — 20 per bid, 60 to boost one. On the Practising tier you also earn 20% revenue share on platform subscriptions from clients you bring in." },
              { q: "What does the waivable client fee mean?", a: "On the Practising tier you can waive your client's onboarding fee, up to $2,000, and we absorb the cost. It lets you make the introduction more attractive without discounting your own work." },
              { q: "How is this different from Upwork or a consulting network?", a: "Freelance platforms take a percentage of every invoice indefinitely and stop once they have introduced you. Traditional networks tend to own the client relationship. Here you pay a flat membership, keep your fee, keep the relationship, and the platform runs the escrow and delivery record around it." },
            ]}
          />
        </Section>

        <section style={{ background: "var(--ink)" }}>
          <div className="shell py-24 text-center">
            <h2 className="h-display mx-auto max-w-3xl" style={{ color: "var(--page)" }}>
              List your practice this week.
            </h2>
            <p className="mx-auto mt-6 max-w-xl" style={{ color: "var(--ink-faint)" }}>
              A free profile takes ten minutes and comes with your first bid included.
            </p>
            <div className="mt-10 flex justify-center gap-3">
              <Button href="/signup?role=expert" variant="primary">Create a profile</Button>
              <Button href="/contact" variant="contrast">Talk to us first</Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
