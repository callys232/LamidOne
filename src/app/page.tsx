import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button, CtaPair } from "@/components/ui/Button";
import { Section, SectionHeading, Eyebrow } from "@/components/ui/Section";
import { SuiteGrid } from "@/components/sections/SuiteGrid";
import { ComparisonTable } from "@/components/sections/ComparisonTable";
import { CaseStudyRail, CASE_STUDIES } from "@/components/sections/CaseStudyRail";
import { Faq } from "@/components/sections/Faq";
import { CTA, yearsOfOperation } from "@/content/brand";
import { SUITES } from "@/content/suites";
import { PLATFORM_AGENTS, POINTS_EXPLAINER, AGENT_COUNT_WORD } from "@/content/agents";
import { VERIFIED_INTEGRATIONS } from "@/content/platform";
import { HOME_FAQ, HOME_COMPARISON } from "@/content/home";
import { AIOS_HERO, AIOS_CTA, ENGINES, BRAND_LINE } from "@/content/aios";
import {
  AiosEngines, AiosSystemFlow, AiosWhy, AiosLayer, AiosArchitecture, AiosAdvantage, AiosTriad,
  AiosHowItWorks, AiosProof, AiosUseCases, AiosIndustries, AiosWalkthrough,
} from "@/components/sections/Aios";
import { RotatingWord } from "@/components/sections/RotatingWord";
import { ScreenshotFrame } from "@/components/mock/ProductMock";

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

        {/* ── Hero ────────────────────────────────────────────── */}
        <section className="relative overflow-hidden border-b" style={{ borderColor: "var(--line-soft)" }}>
          {/* Ambient backdrop. Generated rather than photographic: there
              is no hero photograph in the repo, and a stock image would
              fight a design system built on one rationed accent and a
              lot of white. This is the same orbital motif the product
              walkthrough uses — concentric rings with the four engines
              seated at the compass points — so the backdrop restates
              "one OS, four engines" instead of decorating around it.
              Theme-aware (every colour is a token), weightless, and
              pinned behind the content. */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
            <div
              className="absolute -right-[14%] -top-[38%] h-[860px] w-[860px] rounded-full"
              style={{ background: "radial-gradient(circle, var(--brand-soft) 0%, transparent 62%)" }}
            />
            <svg
              className="absolute -right-[16%] -top-[22%] h-[760px] w-[760px]"
              viewBox="0 0 400 400" fill="none" style={{ opacity: 0.55 }}
            >
              <circle cx="200" cy="200" r="62" stroke="var(--line)" strokeWidth="1" />
              <circle cx="200" cy="200" r="112" stroke="var(--line)" strokeWidth="1" strokeDasharray="2 7" />
              <circle cx="200" cy="200" r="165" stroke="var(--line)" strokeWidth="1" />
              <circle cx="200" cy="200" r="198" stroke="var(--line)" strokeWidth="1" strokeDasharray="2 7" />
              {/* Four engines, seated on the r=165 ring at the compass
                  points — the same arrangement as the walkthrough orbit. */}
              {[
                { cx: 200, cy: 35, i: 0 },
                { cx: 365, cy: 200, i: 1 },
                { cx: 200, cy: 365, i: 2 },
                { cx: 35, cy: 200, i: 3 },
              ].map((n) => (
                <circle key={n.i} cx={n.cx} cy={n.cy} r="5.5" fill={ENGINES[n.i].tint} opacity="0.5" />
              ))}
            </svg>
          </div>

          <div className="shell relative py-24 sm:py-32">
            {/* The document's four-engine hero. The earlier three-verb
                version ("diagnose, transform, grow") predated FINANCE
                and never accounted for all four engines — retired. The
                headline is three complete declaratives, so it is set as
                three lines rather than one wrapping paragraph.

                One left-hand column, deliberately: every block stacks
                in reading order — claim, definition, optional detail,
                mark, ask — which keeps the right two-fifths of the
                section clear as canvas for the background asset. The
                longest block (the supporting paragraph) is collapsed
                so the column stays short enough for the CTA to sit
                above the fold. */}
            <div className="max-w-3xl">
              <Eyebrow>{AIOS_HERO.eyebrow}</Eyebrow>

              {/* The headline leads with the promise, not the org chart.
                  One domain rotates through the four engines, so the
                  same sentence reads true four times — "the future of
                  consulting / growth / talent / finance, delivered as
                  one" — and the reader watches the scope widen rather
                  than being told it in a list.

                  Two lines: the rotating clause, then the payoff. The
                  accent is spent on "one", which is the whole argument. */}
              <h1 className="font-display mt-8 text-[clamp(2.25rem,5vw,4.25rem)] font-normal leading-[1.08] tracking-[-0.02em]">
                <span className="block">
                  {AIOS_HERO.headlineLead}{" "}
                  <RotatingWord words={AIOS_HERO.headlineWords} suffix="," />
                </span>
                {/* Left in ink on purpose. The accent is already spent on
                    the word that changes; keeping the payoff constant in
                    colour as well as wording is the argument the line is
                    making — four domains, one delivery. */}
                <span className="block">{AIOS_HERO.headlineTail}</span>
              </h1>

              {/* The four values as one sentence — the common thread the
                  engines are stitched to. Four full stops, not commas:
                  each is a standalone promise, not an item in a list.

                  One gradient across the whole line rather than four
                  engine tints: the sentence's job is to read as a single
                  thread. Attribution to the four engines happens in the
                  engine section below, so the hero does not need to do
                  it too. Text is sourced from ENGINES[].value, so the
                  landing slide and the engine section cannot disagree
                  about what the four are. */}
              <p className="text-gradient-brand mt-9 text-lg font-semibold leading-relaxed sm:text-xl">
                {ENGINES.map((e) => `${e.value}.`).join(" ")}
              </p>

              {/* Structurally the same three-part declarative as the
                  headline, so it sits close enough for the rhyme to
                  register rather than reading as a stray line. */}
              <p
                className="muted mt-8 border-t pt-5 text-[11px] font-semibold uppercase tracking-[0.22em]"
                style={{ borderColor: "var(--line-soft)" }}
              >
                {AIOS_HERO.signature}
              </p>

              <CtaPair primary={CTA.primary} secondary={CTA.secondary} className="mt-9" />
              <p className="faint mt-5 text-sm">
                Free plan available. No card required. Built on {yearsOfOperation()}+ years of consulting leadership.
              </p>
            </div>

            {/* Real screenshots from a seeded demo account — the one
                imagery slot on the site that isn't the theme-aware SVG
                mock system, because the homepage hero is worth the
                staleness/theme tradeoff. Every other product-imagery
                slot (suite pages, agents directory) stays SVG. */}
            <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <ScreenshotFrame src="/hero/dashboard-overview.png" label="Dashboard — overview" width={900} height={640} />
              <ScreenshotFrame src="/hero/diagnostic-result.png" label="Catalyst — Decision Clarity Score" width={900} height={640} />
              <ScreenshotFrame src="/hero/budget-result.png" label="LAMID FINANCE — budget calculator" width={900} height={640} />
            </div>
          </div>
        </section>

        {/* ── The echo ────────────────────────────────────────
            Replaces the stat strip that used to sit here. That strip
            repeated the hero's own fine print twice over ("free plan,
            no card", "38+ years"), and its two remaining figures are
            each told better by the section that owns them — nine suites
            by the engines grid directly below, the agent count by the
            agents section. Four beats for four engines, from the brand
            document's echo line, which had no home until now. */}
        <div className="border-b" style={{ borderColor: "var(--line-soft)", background: "var(--brand-soft)" }}>
          <div className="shell py-8">
            <ul className="grid gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
              {AIOS_HERO.echoBeats.map((beat) => (
                <li key={beat} className="echo-beat font-display text-lg sm:border-l sm:pl-5">
                  {beat}
                  <span className="text-brand">.</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── The AIOS narrative ──────────────────────────────
            The brand document's homepage, in its own order: the four
            engines and what rolls up under each, why the traditional
            model breaks, how the operating layer works, the
            architecture, the advantage, the operating logic, and the
            proof/promise pair. Copy lives in content/aios.ts. */}
        <AiosEngines />
        <AiosSystemFlow />
        <AiosWhy />
        <AiosLayer />
        <AiosArchitecture />
        <AiosAdvantage />
        <AiosHowItWorks />
        <AiosProof />

        {/* ── Suite inventory ─────────────────────────────────
            Retained as the detailed inventory behind the engine cards
            above: AiosEngines names which suites sit in each engine and
            links to them, this grid is where a reader browses all nine
            with their two-bullet summaries. */}
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

        {/* ── Use cases, industries, walkthrough ──────────────
            Placed after the suite inventory so a reader meets the nine
            real suites before the applied-value sections. */}
        <AiosUseCases />
        <AiosIndustries />
        <AiosWalkthrough />

        {/* ── Agents ──────────────────────────────────────────
            The one atmospheric field on the page. Every AI claim
            carries a number or a price — "AI-powered" alone is noise. */}
        <Section id="agents" tone="tint">
          <SectionHeading
            eyebrow="LAMID Agents"
            title={`${AGENT_COUNT_WORD} agents. You pay when the work is done.`}
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
                <h2 className="h-section text-2xl sm:text-3xl">What actually powers this.</h2>
                <p className="lead mt-4 text-base">
                  Real payments, a real model layer, and real connections to LAMID&apos;s own
                  ecosystem apps.
                </p>
                <Link href="/integrations" className="link-underline mt-6 inline-flex text-sm">
                  See what&apos;s live and what&apos;s next
                </Link>
              </div>
              <ul className="flex flex-wrap gap-2 lg:col-span-7">
                {VERIFIED_INTEGRATIONS.map((i) => (
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
          <p className="font-display mb-8 text-lg">
            {SUITES.length} suites. 1 ecosystem. {yearsOfOperation()}+ years of leadership behind it.
          </p>
          <SectionHeading
            eyebrow="Customer proof"
            title="Named organisations. Numbers they verified."
            blurb="We publish named organisations with figures they have verified — not anonymous testimonials. The first studies go up as engagements complete."
          />
          <CaseStudyRail studies={CASE_STUDIES} />
        </Section>

        {/* ── FAQ ─────────────────────────────────────────── */}
        <Section id="faq" className="border-t">
          <Faq items={HOME_FAQ} />
        </Section>

        <AiosTriad />

        {/* ── Closing ─────────────────────────────────────────
            Maximum contrast at the decision point. Same two buttons,
            third appearance. Consistency over cleverness. */}
        <section style={{ background: "var(--ink)" }}>
          <div className="shell py-24 text-center">
            <h2 className="h-display mx-auto max-w-3xl" style={{ color: "var(--page)" }}>
              {AIOS_CTA.headline}
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed" style={{ color: "var(--ink-faint)" }}>
              {AIOS_CTA.body}
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
