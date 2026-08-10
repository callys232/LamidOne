import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { Section, SectionHeading } from "@/components/ui/Section";
import { TheGap } from "@/components/sections/TheGap";
import { EcosystemHub } from "@/components/sections/EcosystemHub";
import { SuiteShowcase } from "@/components/sections/SuiteShowcase";
import { Diagnose } from "@/components/sections/Diagnose";
import { AfterTheAnswer } from "@/components/sections/AfterTheAnswer";
import { WhyScale } from "@/components/sections/WhyScale";
import { HP_HERO, HP_PROMISE, HP_HOW, HP_CTA } from "@/content/homepage";

/**
 * HOMEPAGE — the approved design, end to end.
 *
 * WHAT WAS HERE BEFORE. The brand document implemented verbatim:
 * twenty sections and 9,900 words, of which three said "four engines,
 * one system", four said "here is how it works", and three said
 * "traditional consulting is broken". A 90-minute chat transcript
 * restates its thesis in every reply. A homepage cannot.
 *
 * Nothing was deleted, only rehomed:
 *   · architecture, the OS layer and the loop  -> /products
 *   · advantage, proof, the four failures      -> /why-lamid-one
 *   · the document's use cases                 -> /use-cases
 *   · suite grid, agents, integrations,
 *     comparison and FAQ                       -> already had full pages
 *
 * THE SHAPE. Claim, proof of the claim, then the way in:
 *   hero -> why it is different -> the gap -> the four suites ->
 *   see them working -> run one yourself -> who implements it ->
 *   how the whole thing runs -> who it is for -> ask.
 *
 * Two sections are not from the design mock and are here deliberately:
 * `Diagnose`, because the mock describes the product without ever
 * letting a visitor use it, and `AfterTheAnswer`, because the engines
 * stop at a recommendation and the page has to say who acts on it.
 */
export default function HomePage() {
  return (
    <>
      <Header />
      <main id="main">

        {/* ── Hero ──────────────────────────────────────────────
            Midnight gradient with the design's radial dot field —
            texture at large sizes with no image request. */}
        <header
          className="relative overflow-hidden text-center"
          style={{
            background:
              "radial-gradient(ellipse 120% 90% at 50% 0%, #16294f 0%, #0d1730 45%, var(--depth) 100%)",
            color: "#FFFFFF",
          }}
        >
          <div
            className="pointer-events-none absolute inset-0"
            aria-hidden="true"
            style={{
              backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)",
              backgroundSize: "28px 28px",
              opacity: 0.5,
            }}
          />

          <div className="shell relative py-24 sm:py-32">
            <div className="mx-auto max-w-5xl">
              <p
                className="text-[13px] font-bold uppercase tracking-[0.16em]"
                style={{ color: "var(--accent-glow)" }}
              >
                {HP_HERO.peel}
              </p>

              {/* Two lines. Light for the setup, semibold and blue for
                  the payoff — the design's one typographic move, and
                  the reason it can run this large without shouting.

                  The blue is pinned rather than `var(--brand)`. This
                  header is midnight in BOTH themes, so a token that
                  shifts with the theme would change the colour of the
                  headline against a background that did not move. It is
                  the dark-surface blue (#4A93FF) rather than the base
                  #1A7CFF: measured against the lightest part of the
                  gradient behind it (#16294f) the base reads 3.7:1 and
                  this reads 4.8:1. Both clear AA for text this size,
                  but the headline sits exactly where the gradient is
                  palest, so the tighter one is not worth shipping. */}
              {/* Instrument Serif ships one weight, and that is how the
                  reference uses it — no weight contrast in the
                  headline, so the colour change carries the emphasis on
                  its own. `font-normal` is explicit to stop Tailwind or
                  a browser synthesising a bold, which on a serif this
                  high-contrast smears the thin strokes badly.

                  Each line is its own block so the break is structural
                  rather than a <br /> a wrap can push around. Sized to
                  hold two lines and only two: the longer line is 29
                  characters, which needs ~900px at this ceiling, so the
                  column is max-w-5xl. */}
              <h1 className="font-display mt-8 text-[clamp(2.4rem,5.8vw,4.25rem)] font-normal leading-[1.1] tracking-[-0.015em]">
                <span className="block">{HP_HERO.headlineLead}</span>
                <span className="block">
                  {HP_HERO.headlineTail}{" "}
                  <span style={{ color: "#4A93FF" }}>{HP_HERO.headlineEmphasis}</span>
                </span>
              </h1>

              <p
                className="mx-auto mt-7 max-w-xl text-[19px] leading-relaxed"
                style={{ color: "rgba(255,255,255,0.78)" }}
              >
                {HP_HERO.subhero}
              </p>

              {/* The tagline, moved down from the eyebrow slot. Set as
                  a tracked signature rather than body text so it closes
                  the block without competing with the sentence above
                  it. */}
              <p
                className="mt-7 text-[13px] font-semibold uppercase tracking-[0.18em]"
                style={{ color: "var(--accent-glow)" }}
              >
                {HP_HERO.signature}
              </p>

              <div className="mt-10 flex flex-wrap justify-center gap-4">
                <Button href={HP_HERO.primary.href} variant="primary">
                  {HP_HERO.primary.label}
                </Button>
                <Link
                  href={HP_HERO.secondary.href}
                  className="btn"
                  style={{ border: "1px solid rgba(255,255,255,0.28)", color: "#FFFFFF" }}
                >
                  {HP_HERO.secondary.label}
                </Link>
              </div>

              <p className="mt-9 text-[13px] tracking-[0.06em]" style={{ color: "rgba(255,255,255,0.45)" }}>
                {HP_HERO.socialProof}
              </p>
            </div>

          </div>
        </header>

        {/* ── Clear / Fast / Unified ───────────────────────────
            The design's arrow cards. Text is verbatim; the interaction
            is the running arrow — see `.arrow-card` in globals.css.
            Each card is a link to the section that demonstrates its
            claim, so the arrow is a real affordance rather than
            decoration — destinations are in content/homepage.ts. */}
        <Section id="promise">
          <div className="grid gap-5 md:grid-cols-3">
            {HP_PROMISE.map((p) => (
              <Link key={p.title} href={p.href} className="arrow-card block p-7 sm:p-8">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="font-display text-lg font-semibold">{p.title}</h3>
                  {/* Decorative inside a link that already carries its
                      own text — announcing it would name the
                      destination twice. */}
                  <span className="arrow-circle" aria-hidden="true">
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
                <p className="muted mt-4 text-[14.5px] leading-relaxed">{p.body}</p>
              </Link>
            ))}
          </div>
        </Section>

        <TheGap />

        <EcosystemHub />
        <SuiteShowcase />

        {/* The way in. This is a machine you bring data to, so the
            question comes before the architecture — a reader is shown
            their own sentence and the engine that answers it. */}
        <Diagnose />

        {/* The handoff. The engines compute; people implement. */}
        <AfterTheAnswer />

        {/* ── How it works ───────────────────────────────────── */}
        <Section id="how" className="border-t">
          <SectionHeading eyebrow={HP_HOW.eyebrow} title={HP_HOW.title} />
          <ol className="divide-hairline">
            {HP_HOW.steps.map((st) => (
              <li key={st.n} className="flex flex-col gap-1 py-4 sm:flex-row sm:gap-6">
                <span className="font-semibold sm:w-40 sm:shrink-0">
                  <span className="text-brand">{st.n}.</span> {st.label}
                </span>
                <span className="muted text-[15.5px] leading-relaxed">{st.body}</span>
              </li>
            ))}
          </ol>
        </Section>

        {/* ── Why LAMID ONE ────────────────────────────────────
            Now segmented by organisation size — the heading claims a
            range and one set of cards could not speak across it. Lives
            in WhyScale.tsx because the toggle needs state; the cards
            themselves are unchanged. */}
        <WhyScale />

        {/* ── Closing ────────────────────────────────────────────
            The design's own band: electric blue, one ask, no second
            option competing with it. */}
        <section
          className="text-center"
          style={{ background: "linear-gradient(135deg, var(--brand), #0F5FE0)" }}
        >
          <div className="shell py-24">
            <h2 className="text-[clamp(1.6rem,3.6vw,2.4rem)] font-semibold" style={{ color: "#FFFFFF" }}>
              {HP_CTA.title}
            </h2>
            <p className="mt-4 text-base" style={{ color: "rgba(255,255,255,0.85)" }}>
              {HP_CTA.body}
            </p>
            <Link
              href={HP_CTA.cta.href}
              className="btn mt-8 font-semibold"
              style={{ background: "#FFFFFF", color: "var(--brand)" }}
            >
              {HP_CTA.cta.label}
            </Link>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
