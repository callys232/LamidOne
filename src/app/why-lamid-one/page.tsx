import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button, CtaPair } from "@/components/ui/Button";
import { Section, SectionHeading, Eyebrow } from "@/components/ui/Section";
import { ComparisonTable } from "@/components/sections/ComparisonTable";
import { SuiteGrid } from "@/components/sections/SuiteGrid";
import { Faq } from "@/components/sections/Faq";
import { HOME_COMPARISON } from "@/content/home";
import { CTA } from "@/content/brand";
import { ENGINES } from "@/content/aios";

export const metadata: Metadata = {
  title: "Why LAMID ONE",
  description: "What we do differently, what we do not do, and where the alternatives are genuinely better.",
};

/**
 * Why-choose page.
 *
 * Includes a section on what we are NOT good for. A comparison page
 * that claims to win every scenario reads as propaganda; naming the
 * cases where an alternative is the right answer is what makes the rest
 * of the page credible — the same mechanic as the "partial" column in
 * the comparison table.
 */
export default function WhyPage() {
  return (
    <>
      <Header />
      <main id="main">
        <section className="border-b" style={{ borderColor: "var(--line-soft)" }}>
          <div className="shell py-20">
            <div className="max-w-4xl">
              <Eyebrow>Why <span className="text-brand">LAMID ONE</span></Eyebrow>
              <h1 className="h-display mt-6">
                Consultants leave. Spreadsheets forget.{" "}
                <span className="text-brand">LAMID ONE</span> stays.
              </h1>
              <p className="lead mt-6 max-w-2xl">
                We keep the model, the reasoning and the working — so the next decision starts from
                what you already know rather than from another discovery phase.
              </p>
              <CtaPair primary={CTA.primary} secondary={CTA.secondary} className="mt-10" />
            </div>
          </div>
        </section>

        <Section id="principles">
          <SectionHeading eyebrow="What we do differently" title="Four commitments." />
          <div className="grid gap-5 sm:grid-cols-2">
            {[
              { t: "The arithmetic is shown.", d: "No figure in LAMID FINANCE is produced by a language model. Every number is computed from inputs you entered and the calculation exports with it. AI writes commentary; it never writes the numbers." },
              { t: "You pay for outcomes, not attempts.", d: "Agents are metered per completed result — a delivered shortlist, a drafted proposal, a resolved dispute. A run that fails costs nothing, which is the only version of usage pricing that is fair to the buyer." },
              { t: "The capability is meant to stay.", d: "LEARN certifies your own team against the measured gap. A platform that makes itself permanently necessary is a retainer with a login page." },
              { t: "We publish what we have not done.", d: "The trust centre lists five things we have not certified, including SOC 2. You will find out during procurement anyway; better here." },
            ].map((p) => (
              <div key={p.t} className="card card-interactive p-8">
                <h3 className="font-display text-xl">{p.t}</h3>
                <p className="muted mt-3 leading-relaxed">{p.d}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section id="compare" tone="tint" className="border-t">
          <ComparisonTable {...HOME_COMPARISON} />
        </Section>

        {/* The concession. This is what buys the rest of the page. */}
        <Section id="not-for" className="border-t">
          <SectionHeading
            eyebrow="Honestly"
            title="When something else is the better answer."
            blurb="If one of these is your situation, we would rather tell you now than three months into a contract."
          />
          <dl className="divide-hairline max-w-3xl">
            {[
              { q: "You need a certified auditor's opinion.", a: "We are not an audit firm and our financial engines are not a statutory audit. Use an accountancy practice; you can model with us and have them sign off." },
              { q: "You need one specific deliverable, once.", a: "If you need a single market-entry study and nothing else, a consultancy engagement is a cleaner purchase than a platform subscription." },
              { q: "You are pre-revenue with two people.", a: "Use the free plan and the free tools. Do not pay for Starter until you have clients whose commercials are worth tracking." },
              { q: "You already run a mature enterprise stack.", a: "If your CRM, ERP and HRIS are well-adopted, DESK and TALENT will duplicate them. CORE and FINANCE may still add something; the rest probably will not." },
              { q: "You need SOC 2 evidence today.", a: "We do not have it. If your procurement requires it as a gate rather than a roadmap commitment, we will fail that gate." },
            ].map((i) => (
              <div key={i.q} className="flex flex-col gap-2 py-5 sm:flex-row sm:gap-8">
                <dt className="font-semibold sm:w-72 sm:shrink-0">{i.q}</dt>
                <dd className="muted text-sm leading-relaxed">{i.a}</dd>
              </div>
            ))}
          </dl>
        </Section>

        {/* The four engines, then the nine suites underneath them.
            This page used to open the section with "Nine suites on one
            record" and drop straight into a flat grid — which read as
            nine peer products and contradicted the structure stated on
            the homepage. The engine row is the missing layer: each
            engine leads with the value it delivers, and the suite grid
            below is what actually runs inside them. */}
        <Section id="suites" className="border-t">
          <SectionHeading
            eyebrow="The ecosystem"
            title="Four engines. Nine suites. One record."
            blurb="Each engine owns one of the four outcomes. The suites are how that engine does the work — not nine separate products you have to assemble yourself."
            action={<Link href="/products" className="link-underline text-sm">All features</Link>}
          />

          <ul className="mb-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {ENGINES.map((e) => (
              <li key={e.id} className="card p-6" style={{ borderTop: `3px solid ${e.tint}` }}>
                <p className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: e.tint }}>
                  {e.value}
                </p>
                <h3 className="mt-3 font-display text-lg">{e.name}</h3>
                <p className="muted mt-2 text-sm leading-relaxed">{e.role}</p>
              </li>
            ))}
          </ul>

          <SuiteGrid />
        </Section>

        <Section id="faq" className="border-t">
          <Faq
            items={[
              { q: "Who is LAMID ONE for?", a: "Organisations that make consequential decisions regularly enough to want a record of them — typically from around ten people up to enterprise and government. Below that, the free plan and free tools are usually the right level." },
              { q: "Do you replace our consultants?", a: "Partly, and deliberately not entirely. The engines replace the diagnostic and modelling work that consultancies charge most for. When you need genuine specialist expertise, LAMID MARKET sources it per engagement rather than on a retainer." },
              { q: "What happens to our data if we leave?", a: "You export everything at any time in CSV — your account, points ledger, bundles and every engine run, each with the working attached. The calculation steps travel with the figures, so a model you built here remains usable elsewhere. PDF export of a model is not built yet." },
              { q: "How is this different from hiring a consulting firm?", a: "A consulting engagement produces a recommendation and ends; the reasoning leaves with the firm. Here the model, the inputs and the rationale stay, can be re-run, and are priced per seat and per outcome rather than per partner day." },
            ]}
          />
        </Section>

        <section style={{ background: "var(--ink)" }}>
          <div className="shell py-24 text-center">
            <h2 className="h-display mx-auto max-w-3xl" style={{ color: "var(--page)" }}>
              Test it on something that matters.
            </h2>
            <p className="mx-auto mt-6 max-w-xl" style={{ color: "var(--ink-faint)" }}>
              Run a diagnostic on your least healthy function. It costs nothing.
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
