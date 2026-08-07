import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SubNav } from "@/components/layout/SubNav";
import { Button, CtaPair } from "@/components/ui/Button";
import { Section, SectionHeading, Eyebrow } from "@/components/ui/Section";
import { StatRow } from "@/components/ui/Stat";
import { ComparisonTable } from "@/components/sections/ComparisonTable";
import { PricingCards } from "@/components/sections/PricingCards";
import { Faq } from "@/components/sections/Faq";
import { ExternalLaunch } from "@/components/sections/SuiteGrid";
import { SuiteMock } from "@/components/mock/ProductMock";
import { MilestoneWalkthrough } from "@/components/suites/MilestoneWalkthrough";
import { SUITES, getSuite, type SuiteId } from "@/content/suites";
import { PLATFORM_AGENTS } from "@/content/agents";
import { CTA } from "@/content/brand";
import { suiteFaq } from "@/content/suiteFaq";
import type { TierId } from "@/content/tiers";
import { highlightBrand } from "@/lib/highlightBrand";

/**
 * THE SUITE PAGE TEMPLATE — one file, nine pages.
 *
 * Built on the newer of the two templates studied (Revenue Hub / Agent
 * Hub), because that is where the system is heading:
 *   · sticky page-level sub-nav with anchor links
 *   · orange-dot section eyebrows (red here)
 *   · stats travelling WITH the claim they support, not collected into
 *     one band at the foot
 *   · serif display numerals
 *   · three-column comparison table
 *   · CTA pair adapting to what is actually purchasable
 *
 * `treatment: "studio"` is the variant for externally hosted products
 * (LEARN, DOCUSHARE): tinted full-bleed hero instead of a product
 * screenshot, and every CTA opens the live app in a new tab. Same type
 * scale, same grid, same CTA grammar — a different atmosphere inside
 * the same system, not a drift out of it.
 */

export function generateStaticParams() {
  return SUITES.map((s) => ({ id: s.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const suite = getSuite(id);
  if (!suite) return {};
  return { title: `${suite.name} — ${suite.kind}`, description: suite.subhead };
}

/** The four suites with a real, working flagship engine. The other
 *  five have their own natural CTA already (open the app, post a
 *  brief, run a visibility check) — this is deliberately not filled
 *  in for every suite.
 *
 *  Labels are per-suite rather than the generic CTA.primary label
 *  reused everywhere: CORE (Q44) and TALENT (A07) are genuinely
 *  diagnostics — a scored assessment of where you stand. FINANCE (F02)
 *  is a calculator, not an assessment, so it never says "diagnostic". */
const SUITE_DIAGNOSTIC: Partial<Record<SuiteId, { label: string; href: string; external?: boolean }>> = {
  core: { label: "Book a diagnostic", href: "/diagnostics/q44" },
  /* Neither of these is a diagnostic. TALENT recommends a route from
     where someone is to a target role; GROW names the growth paths open
     to the business. Both suites previously fell back to diagnostic
     framing, which described the wrong verb entirely. */
  grow: { label: "See your growth pathways", href: "/diagnostics/g03" },
  talent: { label: "Map a talent pathway", href: "/diagnostics/pathway" },
  finance: { label: "Build a budget", href: "/diagnostics/budget" },
  desk: { label: "Raise an invoice", href: "/dashboard/invoices" },
  /* MARKET is neither a diagnostic nor a calculator — it's sourcing.
     Previously fell back to CTA.primary ("Book a diagnostic"), which
     described a suite about hiring an expert as though it were a
     self-assessment tool. The real flagship is /experts — a genuinely
     public page, same pattern as every other suite's flagship tool
     (/diagnostics/budget etc.): vetting the network (verified status,
     rating, engagement history, LAMID LEARN certification) needs no
     account. It replaced an honest "this lives in the app" placeholder
     that used to sit at this route. Only inviting someone into a brief
     (dashboard/projects/invite/[expertId]) needs sign-in, because
     that's the step that actually notifies a person and spends points. */
  market: { label: "Vet and compare experts", href: "/experts" },
};

/**
 * Suites whose hero carries a capability strip instead of leaving the
 * reader to infer what the suite actually does. DESK's promise is that
 * one record spans proposal → delivery → invoice, so the hero names
 * each stage and links to the thing that performs it. Every entry here
 * must point at something that EXISTS — this strip is exactly where a
 * roadmap item would read as a shipped feature.
 */
const HERO_CAPABILITIES: Partial<Record<SuiteId, { label: string; detail: string; href: string }[]>> = {
  desk: [
    { label: "Draft the proposal", detail: "Scribe scopes and costs it from diagnostic output, not a blank page.", href: "/agents" },
    { label: "Run milestones through escrow", detail: "Cadence breaks scope into releases; funds move only on approval.", href: "/dashboard/engagements" },
    { label: "Invoice from approved work", detail: "Raise an invoice straight from approved milestones, references carried through.", href: "/dashboard/invoices" },
  ],
};

export default async function SuitePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const suite = getSuite(id);
  if (!suite) notFound();

  const { Icon } = suite;
  const studio = suite.treatment === "studio";
  const agents = PLATFORM_AGENTS.filter((a) => a.suite === suite.id);
  const faq = suiteFaq(suite);

  const subNavItems = [
    { id: "preview", label: "Preview" },
    { id: "use-cases", label: "Use cases" },
    ...(agents.length ? [{ id: "agents", label: "Agents" }] : []),
    { id: "features", label: "Features" },
    { id: "compare", label: "Compare" },
    { id: "pricing", label: "Pricing" },
  ];

  /* The CTA reflects what is genuinely purchasable. An external product
     leads with "open the app"; an internal suite leads with a diagnostic.
     For the four suites with a real flagship engine, that diagnostic is
     an actual tool — not a booking form for a call. */
  const primaryCta = suite.external
    ? { label: suite.external.label, href: suite.external.url, external: true }
    : SUITE_DIAGNOSTIC[suite.id]
      ? SUITE_DIAGNOSTIC[suite.id]!
      : CTA.primary;
  const secondaryCta = suite.external ? CTA.secondary : CTA.secondary;
  const heroCapabilities = HERO_CAPABILITIES[suite.id];

  return (
    <>
      <Header />
      <main id="main">

        {/* ── Hero ── */}
        <section
          className="border-b"
          style={{
            borderColor: "var(--line-soft)",
            background: studio ? `${suite.tint}0F` : undefined,
          }}
        >
          <div className="shell py-8">
            <nav aria-label="Breadcrumb" className="faint text-sm">
              <Link href="/" className="hover:text-brand">Home</Link>
              <span className="mx-2" aria-hidden="true">/</span>
              <Link href="/products" className="hover:text-brand">Products</Link>
              <span className="mx-2" aria-hidden="true">/</span>
              <span>{suite.name}</span>
            </nav>
          </div>

          <div className={`shell pb-20 ${studio ? "text-center" : ""}`}>
            <div className={studio ? "mx-auto max-w-3xl" : "max-w-4xl"}>
              <div className={`flex items-center gap-2.5 ${studio ? "justify-center" : ""}`}>
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-lg"
                  style={{ background: `${suite.tint}1A`, color: suite.tint }}
                >
                  <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
                </span>
                <span className="font-display text-lg">{suite.name}</span>
                {suite.external && (
                  <span className="faint rounded px-2 py-1 text-[10px] font-medium uppercase tracking-wide"
                        style={{ border: "1px solid var(--line)" }}>
                    Opens app
                  </span>
                )}
              </div>

              <h1 className="h-display mt-7">{suite.headline}</h1>
              <p className={`lead mt-6 ${studio ? "mx-auto max-w-2xl" : "max-w-2xl"}`}>{highlightBrand(suite.subhead)}</p>

              <div className={studio ? "mt-10 flex justify-center" : "mt-10"}>
                <CtaPair primary={primaryCta} secondary={secondaryCta} />
              </div>

              {heroCapabilities && (
                <ol className="mt-12 grid gap-4 sm:grid-cols-3">
                  {heroCapabilities.map((c, i) => (
                    <li key={c.label}>
                      <Link href={c.href} className="card card-interactive block h-full p-5">
                        <span className="faint text-xs font-semibold tabular-nums">0{i + 1}</span>
                        <p className="mt-2 font-semibold">{c.label}</p>
                        <p className="muted mt-1.5 text-sm leading-relaxed">{c.detail}</p>
                      </Link>
                    </li>
                  ))}
                </ol>
              )}

              <p className="faint mt-5 text-sm">
                {suite.engineCount} engines · included from{" "}
                {suite.tiers.includes("free") ? "the free plan" : "Starter"}
              </p>
            </div>
          </div>
        </section>

        <SubNav
          title={suite.name}
          icon={<Icon className="h-4 w-4" style={{ color: suite.tint }} aria-hidden="true" />}
          items={subNavItems}
        />

        {suite.external && (
          <div className="shell pt-12">
            <ExternalLaunch suite={suite} />
          </div>
        )}

        {/* ── Dashboard preview ──────────────────────────────
            Illustrative, not a live capture — said so in the alt text
            and the caption, never implied otherwise. MARKET gets a
            step-by-step walkthrough of the real milestone form/status
            lifecycle instead of a static screenshot — see
            MilestoneWalkthrough's own header comment for what it does
            and does not claim. */}
        <Section id="preview" className={suite.external ? "pt-4" : ""}>
          {suite.id === "market" ? (
            <div className="mx-auto max-w-4xl">
              <MilestoneWalkthrough />
            </div>
          ) : (
            <figure className="mx-auto max-w-4xl">
              <div className="overflow-hidden rounded-2xl" style={{ border: "1px solid var(--line)", boxShadow: "0 24px 60px -30px rgba(0,0,0,.35)" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={suite.dashboardScreenshot}
                  alt={`Illustrative preview of the ${suite.name} dashboard — not a live product capture`}
                  className="w-full"
                  loading="lazy"
                  width={960}
                  height={600}
                />
              </div>
              <figcaption className="faint mt-3 text-center text-xs">
                Illustrative preview of the {suite.name} dashboard.
              </figcaption>
            </figure>
          )}
        </Section>

        {/* ── Use cases: stats travel with the claim ── */}
        <Section id="use-cases">
          <div className="space-y-24">
            {suite.useCases.map((uc, i) => (
              <div key={uc.title} className="grid gap-10 lg:grid-cols-12 lg:items-center">
                <div className={`lg:col-span-6 ${i % 2 ? "lg:order-2" : ""}`}>
                  <Eyebrow>{uc.eyebrow}</Eyebrow>
                  <h2 className="h-section mt-5">{uc.title}</h2>
                  <p className="lead mt-5">{uc.body}</p>
                  <ul className="mt-7 space-y-3">
                    {uc.bullets.map((b) => (
                      <li key={b} className="flex gap-3 text-[15px] font-medium">
                        <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-brand" aria-hidden="true" />
                        {b}
                      </li>
                    ))}
                  </ul>
                  {uc.learnMore && (
                    <Link href={uc.learnMore.href} className="link-underline mt-7 inline-flex text-sm">
                      {uc.learnMore.label}
                    </Link>
                  )}
                </div>

                <div
                  className={`lg:col-span-5 ${i % 2 ? "lg:order-1 lg:col-start-1" : "lg:col-start-8"}`}
                  style={{ ["--suite-tint" as string]: suite.tint }}
                >
                  <SuiteMock index={i} suiteId={suite.id} />
                  <StatRow stats={uc.stats} className="mt-8" />
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* ── Agents in this suite ── */}
        {agents.length > 0 && (
          <Section id="agents" tone="tint" className="border-t">
            <SectionHeading
              eyebrow="Agents"
              title={`${agents.length} agent${agents.length > 1 ? "s" : ""} in ${suite.name}.`}
              blurb="Charged per completed outcome in LAMID Points. A run that fails costs nothing."
              action={<Link href="/agents" className="link-underline text-sm">All agents</Link>}
            />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {agents.map((a) => (
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
          </Section>
        )}

        {/* ── Features ── */}
        <Section id="features" className="border-t">
          <SectionHeading
            eyebrow="Features"
            title="Everything in the suite."
            blurb={`${suite.features.length} capabilities, rolling up ${suite.engineCount} engines.`}
          />
          <div
            className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-4"
            style={{ ["--suite-tint" as string]: suite.tint }}
          >
            {suite.features.map((f) => (
              <div key={f.name} className="feature-card" tabIndex={0}>
                <h3 className="font-semibold">{f.name}</h3>
                <p className="muted mt-2 text-sm leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* ── Comparison ── */}
        <Section id="compare" className="border-t">
          <ComparisonTable {...suite.comparison} />
        </Section>

        {/* ── Pricing ── */}
        <Section id="pricing" className="border-t">
          <div className="mb-10 max-w-2xl">
            <Eyebrow>Pricing</Eyebrow>
            <h2 className="h-section mt-5">{suite.name} for every stage.</h2>
            <p className="lead mt-4">
              Seat price follows your account tier, not the number of suites — so adding{" "}
              {suite.name} never re-prices the seats you already have.
            </p>
            <Link href="/pricing" className="link-underline mt-5 inline-flex text-sm">
              See full pricing and the complete feature comparison
            </Link>
          </div>
          <PricingCards show={suite.tiers as TierId[]} />
        </Section>

        {/* ── FAQ ── */}
        <Section id="faq" className="border-t">
          <Faq items={faq} title={`${suite.name} — frequently asked questions`} />
        </Section>

        {/* ── Closing ── */}
        <section style={{ background: "var(--ink)" }}>
          <div className="shell py-24 text-center">
            <h2 className="h-display mx-auto max-w-3xl" style={{ color: "var(--page)" }}>
              {suite.closing.title}
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-base" style={{ color: "var(--ink-faint)" }}>
              {suite.closing.body}
            </p>
            <div className="mt-10 flex justify-center">
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button href={primaryCta.href} variant="primary" external={primaryCta.external}>
                  {primaryCta.label}
                </Button>
                <Button href={secondaryCta.href} variant="contrast">{secondaryCta.label}</Button>
              </div>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
