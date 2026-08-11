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
import { EcosystemMap } from "@/components/graphics/EcosystemMap";
import { Faq } from "@/components/sections/Faq";
import { HOME_FAQ } from "@/content/home";
import { HP_HERO, HP_PROMISE, HP_HOW, HP_FAQ, HP_CTA } from "@/content/homepage";

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

        {/* ── How it works ─────────────────────────────────────
            A RAIL, not a list. This was five rows separated by
            hairlines — the least designed thing left on the page, and
            wrong for the content besides: hairlines say "these items
            are siblings", and these five are a SEQUENCE where each step
            is only reachable from the one above it.

            The spine says that instead. It also makes the section
            visually distinct from its neighbours, which matters here:
            the four sections around it are card grids and carousels, so
            a fifth grid would have read as more of the same.

            THE LOOP. The spine does not stop at 5 — it continues past
            the last node as a dashed arc turning back on itself,
            because step 5 is "re-run it" and the process is a circle.
            A consulting engagement ends; this does not, and that is the
            single most important thing the section has to say. Drawing
            it costs one small SVG and saves a sentence asserting it. */}
        <Section id="how" className="border-t">
          <SectionHeading eyebrow={HP_HOW.eyebrow} title={HP_HOW.title} />

          <div className="mx-auto mt-12 max-w-3xl">
          {HP_HOW.phases.map((ph) => {
            const steps = HP_HOW.steps.filter((s) => s.phase === ph.id);
            if (steps.length === 0) return null;
            return (
              <section key={ph.id} className="mt-10 first:mt-0">
                {/* The phase header. A rule spanning to the right edge
                    with the fact parked at the end of it — the label
                    says WHEN, the meta says what that costs you, and
                    the rule between them is what makes the pair read as
                    one line rather than two stacked labels. */}
                <div className="mb-7 flex items-center gap-4">
                  <span className="text-[11px] font-bold uppercase tracking-[0.16em]">
                    {ph.label}
                  </span>
                  <span className="h-px flex-1" style={{ background: "var(--line)" }} aria-hidden="true" />
                  <span className="faint text-[12px]">{ph.meta}</span>
                </div>

          {/* `start` continues the count across the phase break — two
              <ol>s would otherwise number 1,2,3 then 1,2 for assistive
              tech while the page shows 4 and 5. */}
          <ol start={Number(steps[0].n)}>
            {steps.map((st, i) => {
              const lastInPhase = i === steps.length - 1;
              /* The loop hangs off the final step of the FINAL phase. */
              const last = ph.id === HP_HOW.phases[HP_HOW.phases.length - 1].id && lastInPhase;
              return (
                <li
                  key={st.n}
                  className="group/step relative grid grid-cols-[44px_1fr] gap-5 pb-9 last:pb-0 sm:grid-cols-[52px_1fr] sm:gap-7"
                >
                  {/* Spine + node. The line is drawn from BELOW the node
                      to the bottom of the row, so it joins this node to
                      the next one rather than passing behind either. */}
                  <div className="relative flex justify-center">
                    {/* Stops at each PHASE break, not just the end of
                        the section — a spine running past the last step
                        of phase one would trail into the phase header
                        below it and undo the grouping the header just
                        made. */}
                    {!lastInPhase && (
                      <span
                        className="absolute bottom-0 top-[46px] w-px"
                        style={{ background: "var(--line)" }}
                        aria-hidden="true"
                      />
                    )}
                    {/* Fills with the accent on row hover — the step
                        being read separates from the four that are not,
                        which is the same job the card lift does
                        elsewhere on the page, at a scale that suits a
                        rail. `aria-hidden` because the <ol> already
                        numbers these for assistive tech; rendering the
                        digit again would announce every step twice. */}
                    <span
                      className="step-node relative flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full text-[15px] font-semibold tabular-nums"
                      aria-hidden="true"
                    >
                      {st.n}
                    </span>
                  </div>

                  <div className="pt-2">
                    <h3 className="font-display text-lg font-semibold">{st.label}</h3>
                    <p className="muted mt-2 text-[15.5px] leading-relaxed">{st.body}</p>
                  </div>

                  {/* The return. Hangs off the last node, curving left
                      and back up — the only mark in the section that is
                      not part of the straight run. */}
                  {last && (
                    <div className="col-start-1 row-start-2 flex justify-center pt-3" aria-hidden="true">
                      {/* Down out of the node, a U-turn, then back UP —
                          the arrowhead has to point the way the process
                          goes, and the process goes back to step 1.
                          Pointing it down would draw an exit. */}
                      <svg width="30" height="34" viewBox="0 0 30 34" fill="none">
                        <path
                          d="M15 0v14c0 10-11 10-11 0v-6"
                          stroke="var(--brand)"
                          strokeWidth="1.5"
                          strokeDasharray="4 4"
                          opacity="0.5"
                        />
                        <path
                          d="M1 11l3-4 3 4"
                          stroke="var(--brand)"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          opacity="0.5"
                        />
                      </svg>
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
              </section>
            );
          })}
          </div>
        </Section>

        {/* ── Why LAMID ONE ────────────────────────────────────
            Now segmented by organisation size — the heading claims a
            range and one set of cards could not speak across it. Lives
            in WhyScale.tsx because the toggle needs state; the cards
            themselves are unchanged. */}
        <WhyScale />

        {/* ── FAQ ──────────────────────────────────────────────
            The last content section, and deliberately BEFORE the
            closing band rather than after it. The band is the page's
            terminus — one ask, no competing option — and a section
            underneath it would leave that ask stranded mid-page. An FAQ
            is also the right thing to sit immediately before a CTA: it
            is where the last objection gets answered. */}
        <Section id="faq" className="border-t">
          <p className="eyebrow">{HP_FAQ.eyebrow}</p>
          <div className="mt-5">
            <Faq items={HOME_FAQ} title={HP_FAQ.title} />
          </div>

          {/* Two ways out, for two different unanswered questions —
              see the note in content/homepage.ts. */}
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Button href={HP_FAQ.primary.href} variant="primary">
              {HP_FAQ.primary.label}
            </Button>
            <Link
              href={HP_FAQ.secondary.href}
              className="link-underline inline-flex items-center gap-1.5 text-sm font-semibold"
            >
              <span>{HP_FAQ.secondary.label}</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </Section>

        {/* ── Closing ────────────────────────────────────────────
            The design's own band: electric blue, one ask, no second
            option competing with it. */}
        <section
          className="relative overflow-hidden text-center"
          style={{ background: "linear-gradient(135deg, var(--brand), #0F5FE0)" }}
        >
          {/* The ecosystem's own shape, in faint white line work — one
              node branching to four suites branching to their tools.
              The page has just spent a section defining those three
              levels; this is the same structure a second time, at the
              moment of the ask.

              Behind the content and pointer-events-none, so nothing
              here can intercept the one button this band exists to
              hold. Kept far below legibility on purpose: anything
              readable would compete with that button. */}
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            <EcosystemMap />
          </div>

          <div className="shell relative py-24">
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
