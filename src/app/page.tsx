import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button, CtaPair } from "@/components/ui/Button";
import { Section, SectionHeading, Eyebrow } from "@/components/ui/Section";
import { StatRow, ProofStrip } from "@/components/ui/Stat";
import { SuiteGrid } from "@/components/sections/SuiteGrid";
import { ComparisonTable } from "@/components/sections/ComparisonTable";
import { CaseStudyRail, CASE_STUDIES } from "@/components/sections/CaseStudyRail";
import { Faq } from "@/components/sections/Faq";
import { CTA, REACH } from "@/content/brand";
import { SUITES } from "@/content/suites";
import { PLATFORM_AGENTS, POINTS_EXPLAINER } from "@/content/agents";
import { INTEGRATIONS } from "@/content/platform";
import { HOME_FAQ, HOME_COMPARISON } from "@/content/home";
import { DashboardMock, AgentMock, BarChartMock } from "@/components/mock/ProductMock";

/**
 * Homepage.
 *
 * Section order is the funnel shape from the teardown: category
 * definition → proof → architecture → inventory → AI → objection
 * defusal → customer proof → ask. Every section either lowers the cost
 * of entry or raises the value of expansion.
 *
 * The CTA pair is identical at hero, mid-page and close. One ask,
 * three times — not three different asks.
 */
export default function HomePage() {
  return (
    <>
      <Header />
      <main id="main">

        {/* ── Hero ──────────────────────────────────────────────
            Jargon in the eyebrow so the headline can stay human.
            The headline names the BUYER, not the product — it is a
            qualification device disguised as a value proposition. */}
        <section className="border-b" style={{ borderColor: "var(--line-soft)" }}>
          <div className="shell py-20 sm:py-28">
            <div className="max-w-4xl">
              <Eyebrow>LAMID ONE — HumanAI Consulting Operating System</Eyebrow>
              <h1 className="h-hero mt-6">
                Where organisations go to decide<span className="text-brand">.</span>
              </h1>
              <p className="lead mt-7 max-w-2xl">
                Strategy, growth, people, finance and clients on one operating layer — with the
                arithmetic shown, not generated. Nine suites, ten agents, one record.
              </p>
              <CtaPair primary={CTA.primary} secondary={CTA.secondary} className="mt-10" />
              <p className="faint mt-4 text-sm">
                Free plan available. No card required.
              </p>
            </div>

            {/* Product imagery below the fold-line, cropped at the frame
                edge so it reads as a window onto something larger. */}
            <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <DashboardMock label="LAMID CORE — operating dashboard" />
              <AgentMock />
              <BarChartMock label="LAMID FINANCE — cost by period" />
            </div>
          </div>
        </section>

        {/* ── Proof strip ─────────────────────────────────────
            A precise, countable sentence. We count what is true today
            rather than publishing outcome figures we have not measured. */}
        <div className="border-b" style={{ borderColor: "var(--line-soft)" }}>
          <ProofStrip sentence="Nine suites, 280+ intelligence engines and ten AI agents on one operating layer." />
          <div className="shell pb-12">
            <StatRow stats={REACH} />
          </div>
        </div>

        {/* ── Architecture ────────────────────────────────────
            The one-image claim: what IS this. Answers the first
            question faster than any paragraph can. */}
        <Section id="architecture">
          <SectionHeading
            eyebrow="The operating layer"
            title="Three layers. One record."
            blurb="Connected data and tools, so knowing, deciding and doing are the same system rather than three that disagree."
          />
          <div className="grid gap-5 lg:grid-cols-3">
            {[
              { n: "01", t: "Know", d: "Diagnostics and 280+ engines compute your position from your own figures. Nothing is estimated by a model.", href: "/suites/core" },
              { n: "02", t: "Decide", d: "Options, weightings and rationale held together — so the reason survives the decision.", href: "/suites/core#decision" },
              { n: "03", t: "Do", d: "Source the expert, run the milestones, release the payment, keep the capability.", href: "/suites/market" },
            ].map((l) => (
              <Link key={l.n} href={l.href} className="card group flex flex-col p-8 transition-colors hover:border-[color:var(--brand-line)]">
                <span className="font-display text-brand text-3xl">{l.n}</span>
                <h3 className="mt-5 font-display text-2xl">{l.t}</h3>
                <p className="muted mt-3 flex-1 text-sm leading-relaxed">{l.d}</p>
                <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold transition-colors group-hover:text-brand">
                  Explore <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </span>
              </Link>
            ))}
          </div>
        </Section>

        {/* ── Suite inventory ─────────────────────────────────
            Argument left, inventory right. ~400 routes compressed to
            nine cards with exactly two bullets each. */}
        <Section id="suites" className="border-t" >
          <div className="grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <Eyebrow>The suites</Eyebrow>
              <h2 className="h-section mt-6">
                Running an organisation is hard. Disconnected tools make it harder.
              </h2>
              <p className="lead mt-5">
                Every suite writes to the same record, so the diagnostic that started the
                conversation is still attached when the invoice goes out.
              </p>
              <CtaPair primary={CTA.primary} secondary={CTA.secondary} className="mt-8" />
            </div>
            <div className="lg:col-span-8">
              <SuiteGrid columns={2} scrollable />
            </div>
          </div>
        </Section>

        {/* ── Agents ──────────────────────────────────────────
            The one atmospheric field on the page. Every AI claim
            carries a number or a price — "AI-powered" alone is noise. */}
        <Section id="agents" tone="tint">
          <SectionHeading
            eyebrow="LAMID Agents"
            title="Ten agents. You pay when the work is done."
            blurb={POINTS_EXPLAINER.body}
            action={<Link href="/agents" className="link-underline text-sm">All agents</Link>}
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PLATFORM_AGENTS.slice(0, 6).map((a) => (
              <div key={a.id} className="card card-interactive p-6">
                <a.Icon className="h-5 w-5 text-brand" strokeWidth={1.75} aria-hidden="true" />
                <h3 className="mt-4 font-display text-xl">{a.name}</h3>
                <p className="faint text-xs">{a.role}</p>
                <p className="muted mt-3 text-sm leading-relaxed">{a.what}</p>
                <p className="mt-4 text-sm font-semibold text-brand">
                  {a.points} pts <span className="faint font-normal">{a.unit}</span>
                </p>
              </div>
            ))}
          </div>
          <p className="faint mt-8 text-xs">{POINTS_EXPLAINER.footnote}</p>
        </Section>

        {/* ── Integrations — a risk-reducer, not a feature ───── */}
        <Section id="integrations">
          <div className="card p-8 sm:p-10">
            <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
              <div className="lg:col-span-5">
                <h2 className="h-section text-2xl sm:text-3xl">Works with what you already run.</h2>
                <p className="lead mt-4 text-base">
                  {INTEGRATIONS.length} integrations across payments, identity, storage, documents and AI.
                </p>
                <Link href="/integrations" className="link-underline mt-6 inline-flex text-sm">
                  See all integrations
                </Link>
              </div>
              <ul className="flex flex-wrap gap-2 lg:col-span-7">
                {INTEGRATIONS.map((i) => (
                  <li key={i.name} className="rounded-lg px-3 py-2 text-sm" style={{ border: "1px solid var(--line)" }}>
                    {i.name}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Section>

        {/* ── Competitive comparison ──────────────────────────
            Categories, not brands. Three states, not two. The
            concession column is what makes it persuasive. */}
        <Section id="compare" className="border-t">
          <ComparisonTable {...HOME_COMPARISON} />
        </Section>

        {/* ── Customer proof ──────────────────────────────────
            Ships empty until a real, consented story exists. */}
        <Section id="customers">
          <SectionHeading
            eyebrow="Customer proof"
            title="Named organisations. Numbers they verified."
            blurb="We publish case studies with a person, a role and a figure the customer stands behind — or we publish nothing."
          />
          <CaseStudyRail studies={CASE_STUDIES} />
        </Section>

        {/* ── FAQ ─────────────────────────────────────────── */}
        <Section id="faq" className="border-t">
          <Faq items={HOME_FAQ} />
        </Section>

        {/* ── Closing ─────────────────────────────────────────
            Maximum contrast at the decision point. Same two buttons,
            third appearance. Consistency over cleverness. */}
        <section style={{ background: "var(--ink)" }}>
          <div className="shell py-24 text-center">
            <h2 className="h-display mx-auto max-w-3xl" style={{ color: "var(--page)" }}>
              Stop deciding from decks nobody can check.
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed" style={{ color: "var(--ink-faint)" }}>
              A new account includes one full diagnostic, free. Ten minutes, no card.
            </p>
            <div className="mt-10 flex justify-center">
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button href={CTA.primary.href} variant="primary">{CTA.primary.label}</Button>
                <Button href={CTA.secondary.href} variant="contrast">{CTA.secondary.label}</Button>
              </div>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
