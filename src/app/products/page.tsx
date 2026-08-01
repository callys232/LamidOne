import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Section, SectionHeading, Eyebrow } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { SuiteGrid } from "@/components/sections/SuiteGrid";
import { SUITES, ADDED_FOR_SMB } from "@/content/suites";
import {
  IDENTITY, ORGANISATION, MARKETPLACE, DELIVERY, INTELLIGENCE,
  TALENT_OPS, COLLABORATION, GOVERNANCE, type Capability,
} from "@/content/platform";
import { CTA } from "@/content/brand";

export const metadata: Metadata = {
  title: "All products and features",
  description:
    "Nine suites, ten agents and every platform capability — the complete directory of what LAMID ONE does.",
};

const GROUPS: { title: string; blurb: string; items: Capability[] }[] = [
  { title: "Identity and access", blurb: "Sign-in, verification, sessions and account control.", items: IDENTITY },
  { title: "Organisations and teams", blurb: "Tenants, members, roles, seats and entitlements.", items: ORGANISATION },
  { title: "Marketplace and sourcing", blurb: "Finding, matching and engaging vetted experts.", items: MARKETPLACE },
  { title: "Delivery, contracts and money", blurb: "Milestones, escrow, invoicing and payment rails.", items: DELIVERY },
  { title: "Intelligence engines", blurb: "The computation layer behind every diagnostic and model.", items: INTELLIGENCE },
  { title: "Talent, recruitment and learning", blurb: "Capability, pipelines, pathways and certification.", items: TALENT_OPS },
  { title: "Collaboration and documents", blurb: "Messaging, files, notifications, search and support.", items: COLLABORATION },
  { title: "Privacy, compliance and operations", blurb: "Data rights, audit, monitoring and platform health.", items: GOVERNANCE },
];

/**
 * The full directory.
 *
 * This is the ONE page permitted to be exhaustive. The mega-menu is a
 * curation surface showing ~40 things; this page is the index behind
 * it, so nothing built is left unsold or undiscoverable.
 */
export default function ProductsPage() {
  const publicCount = GROUPS.reduce((n, g) => n + g.items.filter((i) => i.visibility === "public").length, 0);

  return (
    <>
      <Header />
      <main id="main">
        <section className="border-b" style={{ borderColor: "var(--line-soft)" }}>
          <div className="shell py-20">
            <div className="max-w-3xl">
              <Eyebrow>Everything in the platform</Eyebrow>
              <h1 className="h-display mt-6">Nine suites. {publicCount} capabilities. One record.</h1>
              <p className="lead mt-6">
                The navigation shows the shortlist. This page is the whole index — every capability,
                grouped, with nothing hidden behind a sales call.
              </p>
            </div>
          </div>
        </section>

        <Section id="suites">
          <SectionHeading
            eyebrow="The suites"
            title="Start with the shape."
            blurb="Each suite rolls up dozens of engines. Open one to see its use cases, features, comparison and pricing."
          />
          <SuiteGrid columns={2} scrollable />
          <p className="faint mt-8 text-sm">
            {ADDED_FOR_SMB.length} of these — DESK, SIGNAL, LEARN and MARKET — were added to close
            the small-business gap. The original four suites all assumed an organisation large
            enough to have a strategy function, a workforce to model and a finance team.
          </p>
        </Section>

        <Section id="capabilities" className="border-t">
          <SectionHeading
            eyebrow="Capability index"
            title="Everything the platform does."
            blurb="Grouped by what it is for. Operator-only tooling is marked and is not part of any customer plan."
          />
          <div className="space-y-14">
            {GROUPS.map((g) => (
              <section key={g.title}>
                <div className="mb-6 flex items-baseline gap-5">
                  <h3 className="font-display text-2xl">{g.title}</h3>
                  <span className="h-px flex-1" style={{ background: "var(--line)" }} aria-hidden="true" />
                  <span className="faint text-sm tabular-nums">{g.items.length}</span>
                </div>
                <p className="lead mb-7 max-w-2xl text-sm">{g.blurb}</p>
                <div className="grid gap-x-10 gap-y-7 sm:grid-cols-2 lg:grid-cols-3">
                  {g.items.map((c) => (
                    <div key={c.name} className="feature-card" tabIndex={0}>
                      <h4 className="flex items-center gap-2 font-semibold">
                        {c.name}
                        {c.visibility === "operator" && (
                          <span className="faint rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide"
                                style={{ border: "1px solid var(--line)" }}>
                            Operator
                          </span>
                        )}
                      </h4>
                      <p className="muted mt-1.5 text-sm leading-relaxed">{c.description}</p>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </Section>

        <Section id="next" className="border-t">
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { t: "LAMID Agents", d: "Ten agents and what each costs per outcome.", href: "/agents" },
              { t: "Integrations", d: "Everything the platform connects to.", href: "/integrations" },
              { t: "Pricing", d: "Five tiers and the complete feature comparison.", href: "/pricing" },
            ].map((c) => (
              <Link key={c.t} href={c.href} className="card p-7 transition-colors hover:border-[color:var(--brand-line)]">
                <h3 className="font-display text-xl">{c.t}</h3>
                <p className="muted mt-2 text-sm">{c.d}</p>
              </Link>
            ))}
          </div>
        </Section>

        <section style={{ background: "var(--ink)" }}>
          <div className="shell py-24 text-center">
            <h2 className="h-display mx-auto max-w-3xl" style={{ color: "var(--page)" }}>
              Pick the one thing that hurts most.
            </h2>
            <p className="mx-auto mt-6 max-w-xl" style={{ color: "var(--ink-faint)" }}>
              You do not have to adopt nine suites. Start with one and add the rest when they earn it.
            </p>
            <div className="mt-10 flex justify-center gap-3">
              <Button href={CTA.primary.href} variant="primary">{CTA.primary.label}</Button>
              <Button href={CTA.secondary.href} variant="contrast">{CTA.secondary.label}</Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
