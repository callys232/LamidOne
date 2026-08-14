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
import { SuiteMore } from "@/components/sections/SuiteMore";
import { MilestoneWalkthrough } from "@/components/suites/MilestoneWalkthrough";
import { ModuleSections, SuiteParentBand } from "@/components/sections/ModuleSections";
import { EngineExample } from "@/components/sections/EngineExample";
import { IndustryContext } from "@/components/sections/IndustryContext";
import { MODULE_BY_SUITE } from "@/content/modules";
import { featuredToolForSuite } from "@/content/freeTools";
import { industryResearchForSuite } from "@/content/industryResearch";
import { SUITES, getSuite, type SuiteId } from "@/content/suites";
import { altitudeLabel } from "@/content/strategyLevels";
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
  /* Was { label: "Book a diagnostic", href: "/diagnostics/q44" } — the
     reference design's hero CTA reads "Book a Demo", and `/demo` is a
     real page whose own copy is exactly that: "A working session, not
     a slide deck... we run a diagnostic against it live." Pointing the
     button at it rather than straight at Q44 makes the label true
     without inventing a route — the direct-to-Q44 path is still one
     click away via "Also live" style entry points elsewhere on the
     page (the hero capability strip's first card). */
  core: { label: "Book a Demo", href: "/demo" },
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
    { label: "Track milestones through to release", detail: "Cadence breaks scope into stages; each one releases to the collaborator on your approval.", href: "/dashboard/engagements" },
    { label: "Invoice from approved work", detail: "Raise an invoice straight from approved milestones, references carried through.", href: "/dashboard/invoices" },
  ],
  /* From the reference design's four hub-cards. Two of the four had a
     natural real destination — the diagnostic itself, and the cadence
     engine "coherence checks" names directly. The other two ("early
     warning", "structured frameworks") describe things CORE does
     across several use cases rather than one named tool, so they point
     at the use-cases section rather than a specific diagnostic route I
     could not confirm is live — a real anchor beats a guessed one. */
  /* Details rewritten so you're the one doing the running, checking
     and skipping — the labels already were, the details had drifted
     into passive, subject-less phrasing ("checked against each
     other", "not consultant-calendar speed" has no verb at all).
     Second pass: #1 now echoes the subhead's own "not last quarter"
     line instead of the generic "as things change"; #2 opens on "Line
     up" instead of repeating "Check" from its own label a word later;
     #4 borrows "live" from the governance use-case's own bullet
     ("Hold your decision authority matrix as live data") rather than
     inventing separate vocabulary for the same idea. */
  core: [
    { label: "Run a continuous diagnostic", detail: "Run it once, or run it every week — CORE always reads what's happening right now, not last quarter.", href: "/diagnostics/q44" },
    { label: "Check strategy against execution", detail: "Line up strategy, execution and leadership decisions against each other — any time, not just at the annual offsite.", href: "/diagnostics/r01" },
    { label: "Catch drift early", detail: "See strategy drifting from plan before it shows up in the quarterly numbers.", href: "/suites/core#use-cases" },
    { label: "Skip the 12-week wait", detail: "Get governance frameworks live at software speed, not on a consultant's calendar.", href: "/suites/core#use-cases" },
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
  const featuredTool = featuredToolForSuite(suite.id);

  const subNavItems = [
    { id: "preview", label: "Preview" },
    { id: "use-cases", label: "Use cases" },
    ...(MODULE_BY_SUITE[suite.id]
      ? [{ id: "how-it-works", label: "How it works" }, { id: "capabilities", label: "Capabilities" }]
      : []),
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
  /* CORE's hero drops the secondary button — "Start free" beside "Book
     a Demo" offered two competing next steps where the reference design
     wants one clear ask. Scoped to the HERO only: the closing band
     further down the page still shows its own secondary CTA, since
     that was not part of this change and removing it too would be a
     second, unrequested edit.

     FINANCE swaps the generic "Start free" for the invoice generator
     instead — a real, built tool (lib/invoices.ts, /dashboard/invoices)
     rather than a second signup door beside the one "Build a budget"
     already offers. Invoicing is documented as DESK's own feature
     ("the third leg of the DESK promise" — see lib/invoices.ts's header
     comment), not FINANCE's; this is a cross-sell CTA, not a claim that
     FINANCE built it. Gated like the rest of /dashboard/*, so a
     logged-out visitor hits sign-in first, same as clicking through to
     any other dashboard tool from a marketing page. */
  const heroSecondaryCta =
    suite.id === "core" ? undefined
    : suite.id === "finance" ? { label: "Generate an invoice", href: "/dashboard/invoices" }
    : secondaryCta;
  const heroCapabilities = HERO_CAPABILITIES[suite.id];
  /* The brand document wrote a full landing page for the four suites.
     Where one exists its hero supersedes suites.ts, and its sections
     render below the use cases. The other five suites are untouched. */
  const modulePage = MODULE_BY_SUITE[suite.id];
  /* Dark radial-gradient hero, reserved for the four suites with a
     module page — see the header comment on the hero `<section>`. */
  const darkHero = !!modulePage;
  const centered = studio || darkHero;

  return (
    <>
      <Header ctaSet="suite" />
      {/* `--suite-tint` set ONCE, here, rather than re-declared on each
         section that needs it. `.card-interactive` and `.feature-card`
         already resolve their hover colour from `var(--suite-tint,
         var(--brand))` — that was written for the homepage's ecosystem
         cards, which set the variable locally on each card. On this
         page every `card-interactive` (hero capability strip, agent
         tiles) sat OUTSIDE the two places the variable was set (the
         use-case mock and the features grid), so they hovered in flat
         brand red on every suite page regardless of which suite it was.
         Scoping it to `<main>` means the whole page — not just the
         sections that remembered to ask for it — answers in the
         suite's own colour, the same rationed way the homepage spends
         it: never on rest-state body text, only on the interaction. */}
      <main id="main" style={{ ["--suite-tint" as string]: suite.tint }}>

        {/* ── Hero ──
            `darkHero` — true only for CORE/GROW/TALENT/FINANCE, the
            four with a module page — swaps the plain white hero for
            the reference design's dark radial-gradient band, and the
            preview section right below continues the SAME flat colour
            the gradient ends on, so the dashboard screenshot reads as
            this hero's second beat rather than a separate section that
            happens to follow it. Colours below are hardcoded rather
            than pulled from theme tokens (`--ink`, `--line`…) because
            this band is dark regardless of which site theme is active
            — same reasoning as EcosystemMap.tsx's "white, not a
            token". `studio`'s tinted-white treatment and the other
            five suites are untouched. */}
        <section
          className={darkHero ? "" : "border-b"}
          style={{
            borderColor: "var(--line-soft)",
            background: darkHero
              ? "radial-gradient(ellipse 120% 90% at 50% 0%, #16294f 0%, #0d1730 45%, #0A0F1F 100%)"
              : studio ? `${suite.tint}0F` : undefined,
          }}
        >
          {/* `pt-16 sm:pt-20` replaces the breadcrumb's old `py-8` wrapper
              — removing the breadcrumb (per an earlier request) dropped
              the hero flush against the top of the section with it.
              Applies to all nine suite pages; only `darkHero`'s dark
              band makes the gap actually visible as room to breathe
              rather than just white-on-white. */}
          <div className={`shell pb-20 pt-16 sm:pt-20 ${centered ? "text-center" : ""}`}>
            <div className={centered ? "mx-auto max-w-3xl" : "max-w-4xl"}>
              {/* The kicker. Optional — only renders where MODULE_PAGES
                  sets one (CORE, for now). Sits above the identity chip
                  rather than replacing it: "Consulting, Reimagined" is
                  the CATEGORY claim, the chip below it is still what
                  says which suite this is. Tinted to the suite's own
                  colour, same rationing rule as everywhere else on the
                  site — one accent, spent on the one line meant to be
                  read first. `--accent-glow` on the dark hero rather
                  than `suite.tint`: the codebase already reserves that
                  token for accents on dark surfaces (see its comment in
                  globals.css), so this is the same convention, not a
                  new one. */}
              {modulePage?.eyebrow && (
                <p
                  className={`text-[13px] font-bold uppercase tracking-[0.14em] ${centered ? "text-center" : ""}`}
                  style={{ color: darkHero ? "var(--accent-glow)" : suite.tint }}
                >
                  {modulePage.eyebrow}
                </p>
              )}

              <div className={`flex items-center gap-2.5 ${modulePage?.eyebrow ? "mt-3" : ""} ${centered ? "justify-center" : ""}`}>
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-lg"
                  style={{ background: darkHero ? "rgba(255,255,255,0.12)" : `${suite.tint}1A`, color: darkHero ? "var(--accent-glow)" : suite.tint }}
                >
                  <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
                </span>
                <span className="font-display text-lg" style={{ color: darkHero ? "#FFFFFF" : undefined }}>{suite.name}</span>
                <span
                  className="rounded px-2 py-1 text-[10px] font-semibold uppercase tracking-wide"
                  style={{
                    color: darkHero ? "var(--accent-glow)" : suite.tint,
                    border: `1px solid ${darkHero ? "rgba(255,255,255,0.25)" : suite.tint}`,
                  }}
                >
                  {altitudeLabel(suite.strategyLevel)} strategy
                </span>
                {suite.external && (
                  <span className="faint rounded px-2 py-1 text-[10px] font-medium uppercase tracking-wide"
                        style={{ border: "1px solid var(--line)" }}>
                    Opens app
                  </span>
                )}
              </div>

              <h1 className="h-display mt-7" style={{ color: darkHero ? "#FFFFFF" : undefined }}>{modulePage?.headline ?? suite.headline}</h1>

              {/* The tagline. Sits between the H1 and the lead
                  paragraph, and the two are deliberately different
                  JOBS: the headline states what the suite IS ("The
                  Diagnostic Intelligence Suite..."), the tagline states
                  the CLAIM ("Strategy That Never Goes Stale"), and the
                  lead paragraph below it says the mechanism that makes
                  the claim true. Three sentences, three different
                  questions answered, none of them repeating another. */}
              {modulePage?.tagline && (
                <p
                  className={`font-display mt-4 text-2xl font-semibold ${centered ? "mx-auto" : ""}`}
                  style={{ color: darkHero ? "var(--accent-glow)" : suite.tint }}
                >
                  {modulePage.tagline}
                </p>
              )}
              <p
                className={`lead mt-6 ${centered ? "mx-auto max-w-2xl" : "max-w-2xl"}`}
                style={{ color: darkHero ? "rgba(255,255,255,0.78)" : undefined }}
              >
                {highlightBrand(modulePage?.subhead ?? suite.subhead)}
              </p>

              <div className={centered ? "mt-10 flex justify-center" : "mt-10"}>
                <CtaPair primary={primaryCta} secondary={heroSecondaryCta} />
              </div>

              {/* `darkHero` suites render their strip in its own
                  section after the preview instead — white cards
                  floating directly on the gradient read fine, but the
                  request was to keep the hero itself to headline, CTA
                  and nothing else. DESK (light hero, no `darkHero`)
                  keeps the strip right here, unchanged. */}
              {heroCapabilities && !darkHero && (
                /* `lg:grid-cols-4` rather than a fixed 3 — CORE's strip
                   carries four cards where DESK's carries three. Three
                   items in a four-column grid leaves one gap at the
                   far right rather than an awkward orphaned row, which
                   is the safer failure mode for a count that varies by
                   suite. */
                <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
            </div>
          </div>
        </section>

        {suite.external && (
          <div className="shell pt-12">
            <ExternalLaunch suite={suite} />
          </div>
        )}

        {/* Where this suite sits in the four-engine structure. Renders
            only for the five that run inside an engine (or, for
            DOCUSHARE, underneath all four). */}
        <SuiteParentBand suiteId={suite.id} />

        {/* ── Dashboard preview ──────────────────────────────
            Moved above the sub-nav (was below it): the nav is chrome
            for navigating the deep-dive content, not something that
            belongs wedged between a hero and the screenshot that is
            its own second beat. Illustrative, not a live capture —
            said so in the alt text and the caption, never implied
            otherwise. MARKET gets a step-by-step walkthrough of the
            real milestone form/status lifecycle instead of a static
            screenshot — see MilestoneWalkthrough's own header comment
            for what it does and does not claim. (MARKET is never
            `darkHero` — it has no module page — so the two branches
            below never overlap.)

            `darkHero` suites skip `Section` and hand-roll a flat
            `#0A0F1F` background instead — the exact colour the hero's
            gradient ends on — so the screenshot reads as the hero's
            own second beat, not a new section that happens to follow
            a dark one. */}
        {darkHero ? (
          <section id="preview" className="pb-20 sm:pb-28" style={{ background: "#0A0F1F" }}>
            <div className="shell">
              <figure className="mx-auto max-w-4xl">
                <div className="overflow-hidden rounded-2xl" style={{ border: "1px solid rgba(255,255,255,0.14)", boxShadow: "0 24px 60px -30px rgba(0,0,0,.5)" }}>
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
                <figcaption className="mt-3 text-center text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                  Illustrative preview of the {suite.name} dashboard.
                </figcaption>
              </figure>
            </div>
          </section>
        ) : (
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
        )}

        <SubNav
          title={suite.name}
          icon={<Icon className="h-4 w-4" style={{ color: suite.tint }} aria-hidden="true" />}
          items={subNavItems}
        />

        {/* ── Capability strip, relocated ──────────────────────
            Was inside the dark hero (see HERO_CAPABILITIES's header
            comment); moved here so the hero stays headline, tagline
            and one CTA — nothing else — and the strip gets a plain
            section of its own instead of floating on the gradient.
            DESK's strip stays in its own light hero, untouched — this
            only ever fires for `darkHero` suites (currently CORE). */}
        {heroCapabilities && darkHero && (
          <Section className="border-t">
            <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
          </Section>
        )}

        {/* ── Use cases: stats travel with the claim ──
            PROGRESSIVE DISCLOSURE, matching the homepage's ecosystem
            cards. A use case here ran eyebrow + title + lead + up to
            five bullets, three or four times per suite before the
            module sections even started — the densest reading on the
            page, and none of it had the "Read more" pattern the
            homepage learned to lean on. The first two bullets stay
            visible (enough to judge the claim); the rest sit behind
            SuiteMore, the same pull-down component EcosystemHub's cards
            use, reused rather than rebuilt. */}
        <Section id="use-cases">
          {/* One concrete run before the narrative use cases below it —
              see EngineExample's header comment. Only renders where a
              suite has a real, live tool to point at (featuredTool is
              undefined for DESK and SIGNAL today), so this never links
              to something that isn't actually built.

              IndustryContext is independent of EngineExample on
              purpose: SIGNAL has a real, checked citation (Gartner) but
              no wired free tool yet, and gating the citation behind the
              tool would have hidden it for exactly the suite it exists
              for. Each renders (or not) on its own evidence. */}
          {(featuredTool || industryResearchForSuite(suite.id).length > 0) && (
            <div className="mb-16" style={{ ["--suite-tint" as string]: suite.tint }}>
              {featuredTool && <EngineExample tool={featuredTool} suiteId={suite.id} tint={suite.tint} />}
              <IndustryContext suiteId={suite.id} tint={suite.tint} />
            </div>
          )}
          <div className="space-y-24">
            {suite.useCases.map((uc, i) => {
              const [leadBullets, moreBullets] = [uc.bullets.slice(0, 2), uc.bullets.slice(2)];
              return (
              <div key={uc.title} className="grid gap-10 lg:grid-cols-12 lg:items-center">
                <div className={`lg:col-span-6 ${i % 2 ? "lg:order-2" : ""}`}>
                  <Eyebrow>{uc.eyebrow}</Eyebrow>
                  <h2 className="h-section mt-5">{uc.title}</h2>
                  <p className="lead mt-5">{uc.body}</p>
                  <ul className="mt-7 space-y-3">
                    {leadBullets.map((b) => (
                      <li key={b} className="flex gap-3 text-[15px] font-medium">
                        <span
                          className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{ background: suite.tint }}
                          aria-hidden="true"
                        />
                        {b}
                      </li>
                    ))}
                  </ul>
                  {moreBullets.length > 0 && <SuiteMore items={moreBullets} tint={suite.tint} />}
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
                  {/* Chooses the mechanism, not the position — see the
                      header comment on SuiteMock. `claim` feeds the
                      chart-shape heuristic every suite now uses;
                      `label` replaces the generic window-chrome title
                      with what this panel actually is. */}
                  <SuiteMock
                    index={i}
                    label={uc.eyebrow}
                    claim={`${uc.eyebrow} ${uc.title}`}
                  />
                  <StatRow stats={uc.stats} className="mt-8" />
                  {/* `StatRow` (strict) silently drops any unverified
                      stat rather than rendering a fabricated number —
                      which can leave the claim above with nothing
                      behind it. Where that's the case, show the
                      mechanism instead: why the process should produce
                      the result, with no number attached to it yet. */}
                  {uc.mechanism && uc.stats.some((s) => !s.verified) && (
                    <p className="muted mt-6 text-sm leading-relaxed">{uc.mechanism}</p>
                  )}
                </div>
              </div>
              );
            })}
          </div>
        </Section>

        {/* ── The brand document's module landing page ──────────
            Purpose, how the engine works, capabilities, its
            intelligence flow, industry applications and the module CTA.
            Renders only for CORE, GROW, TALENT and FINANCE — the four
            the document actually wrote. */}
        <ModuleSections suiteId={suite.id} />

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
