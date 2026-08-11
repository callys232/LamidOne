import Link from "next/link";
import { Check, ArrowRight } from "lucide-react";
import { Section, SectionHeading, Eyebrow } from "@/components/ui/Section";
import { SUITES_BY_ID } from "@/content/suites";
import { DOCUSHARE_INFO } from "@/content/docushare";
import { WalkthroughOrbit } from "@/components/sections/WalkthroughOrbit";
import { WhyAccordion } from "@/components/sections/WhyAccordion";
import { SYSTEM_FLOW } from "@/content/modules";
import { USE_CASES as USE_CASE_PAGES } from "@/content/useCases";
import {
  ENGINES, OS_LAYER, WHO_ITS_FOR, AIOS_WORKS, PROOF_POINTS, PROMISE,
  ADVANTAGE, HOW_IT_WORKS, USE_CASES, INDUSTRIES, QUOTES,
  ECHO_TAGLINE, CTA_TRIO,
} from "@/content/aios";

/**
 * THE AIOS SECTIONS — the brand document's homepage, as components.
 *
 * Copy lives entirely in content/aios.ts; nothing here writes prose.
 *
 * ON COLOUR. The document assigns each engine a bright accent (blue,
 * green, purple, gold). This site rations one red accent deliberately
 * (globals.css §6.3), so four saturated accents used at full strength
 * would fight it. They are applied here the same way the existing
 * per-suite tints already are: a hairline top rule and the engine
 * numeral, nothing else. The engine identity reads; the page stays calm.
 */

/* ── Secondary: a new category, and the four engines ───────── */
export function AiosEngines() {
  return (
    <Section id="engines" className="border-t">
      <SectionHeading
        eyebrow="A new category of business intelligence"
        title="Four engines. One continuous intelligence loop."
        blurb="LAMID ONE replaces fragmented tools, episodic consulting cycles, and siloed decision-making with a unified Human-AI Operating System."
      />
      <div className="grid items-start gap-4 sm:grid-cols-2">
        {ENGINES.map((e) => (
          <div key={e.id} className="card p-7" style={{ borderTop: `3px solid ${e.tint}` }}>
            {/* The value leads, the engine name follows. The four values
                are the promise made in the hero subhead; naming them
                here is what makes the thread visible rather than
                implied. */}
            <p
              className="text-[11px] font-bold uppercase tracking-[0.14em]"
              style={{ color: e.tint }}
            >
              {e.value}
            </p>
            <div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <h3 className="font-display text-xl">{e.name}</h3>
              <span className="faint text-xs uppercase tracking-wide">{e.role}</span>
            </div>
            <p className="mt-3 font-semibold">{e.valueClaim}</p>
            <ul className="mt-5 space-y-2">
              {e.capabilities.map((c) => (
                <li key={c} className="flex gap-2.5 text-sm leading-relaxed">
                  <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full" style={{ background: e.tint }} aria-hidden="true" />
                  <span className="muted">{c}</span>
                </li>
              ))}
            </ul>
            <p className="mt-5 text-sm font-medium leading-relaxed">{e.promise}</p>

            {/* The aggregation, made visible: which real suites run
                inside this engine. */}
            <div className="mt-5 flex flex-wrap gap-1.5 border-t pt-4" style={{ borderColor: "var(--line-soft)" }}>
              {e.suites.map((id) => (
                <Link
                  key={id}
                  href={`/suites/${id}`}
                  className="faint rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors hover:text-brand"
                  style={{ border: "1px solid var(--line)" }}
                >
                  {SUITES_BY_ID[id].name}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Who it is for. The document speaks almost entirely to large
          enterprises; the platform does not. This sits directly under
          the engine grid because that is where a smaller team decides
          whether to keep reading. */}
      <div className="mt-4 grid gap-8 rounded-2xl p-7 sm:p-9 lg:grid-cols-12 lg:items-center" style={{ border: `1px solid var(--brand-line)` }}>
        <h3 className="h-section text-2xl lg:col-span-5">{WHO_ITS_FOR.claim}</h3>
        <p className="muted text-[15px] leading-relaxed lg:col-span-6 lg:col-start-7">
          {WHO_ITS_FOR.body}
        </p>
      </div>

      <div className="card mt-4 p-7" style={{ background: "var(--brand-soft)" }}>
        <h3 className="font-display text-lg">{OS_LAYER.title}</h3>
        <p className="muted mt-2 max-w-3xl text-sm leading-relaxed">{OS_LAYER.blurb}</p>
        {/* Was `OS_LAYER.suites.map(id => SUITES_BY_ID[id].name)` — that
            resolved through the suite registry, which DOCUSHARE (the
            only thing OS_LAYER.suites has ever named) no longer belongs
            to; see the header comment on content/docushare.ts. Linked
            straight to its own bespoke page instead of the redirect. */}
        <div className="mt-4 flex flex-wrap gap-1.5">
          <Link
            href="/docushare"
            className="faint rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors hover:text-brand"
            style={{ border: "1px solid var(--line)" }}
          >
            {DOCUSHARE_INFO.name}
          </Link>
        </div>
      </div>
    </Section>
  );
}

/* ── The system flow: what it is, and what a leader gets ───── */
export function AiosSystemFlow() {
  return (
    <Section id="system-flow" className="border-t">
      <div className="grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <h2 className="h-section">{SYSTEM_FLOW.title}</h2>
          <p className="muted mt-6 text-[15px] leading-relaxed">{SYSTEM_FLOW.body}</p>
        </div>
        <div className="lg:col-span-5 lg:col-start-8">
          <p className="eyebrow">The organisation runs smarter</p>
          <ul className="divide-hairline mt-5">
            {SYSTEM_FLOW.gives.map((g) => (
              <li key={g} className="flex items-start gap-3 py-3.5 text-[15px] font-medium">
                <Check className="mt-1 h-4 w-4 shrink-0 text-brand" aria-hidden="true" />
                {g}
              </li>
            ))}
          </ul>
          <p className="muted mt-6 text-sm leading-relaxed">{SYSTEM_FLOW.close}</p>
        </div>
      </div>
    </Section>
  );
}

/* ── The triad: three ways in ───────────────────────────────
   Houses the document's two earliest orphaned lines — the Echo
   tagline and the CTA trio — which turn out to be the same three
   beats as nouns and as verbs. See the note on CTA_TRIO. */
export function AiosTriad() {
  return (
    <Section id="ways-in" className="border-t">
      <div className="text-center">
        <p className="font-display text-xl sm:text-2xl">{ECHO_TAGLINE}</p>
        <p className="muted mx-auto mt-4 max-w-xl text-sm">
          Three ways in. Each one opens the tool that actually does it.
        </p>
      </div>
      <div className="mt-12 grid gap-4 lg:grid-cols-3">
        {CTA_TRIO.map((c, i) => {
          const tint = ENGINES.find((e) => e.id === c.engine)?.tint ?? "var(--brand)";
          return (
            <Link
              key={c.title}
              href={c.href}
              className="card card-interactive group flex flex-col p-7"
              style={{ borderTop: `3px solid ${tint}` }}
            >
              <span className="font-display text-lg tabular-nums" style={{ color: tint }}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="font-display mt-3 text-xl">{c.title}</h3>
              <p className="muted mt-3 flex-1 text-sm leading-relaxed">{c.body}</p>
              <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold transition-colors group-hover:text-brand">
                Start here <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </span>
            </Link>
          );
        })}
      </div>
    </Section>
  );
}

/* ── Why: the four places traditional consulting breaks ────── */
export function AiosWhy() {
  return (
    <Section id="why-aios" tone="tint" className="border-t">
      <SectionHeading
        eyebrow="Why LAMID ONE"
        title="Traditional consulting breaks in four places."
        blurb="Organisations don't fall short because they lack intelligence, talent, or ambition. They fall short because the model is fundamentally limited."
      />
      <WhyAccordion />
    </Section>
  );
}

/* ── The AIOS: how the operating layer works ───────────────── */
export function AiosLayer() {
  return (
    <Section id="aios" className="border-t">
      <SectionHeading
        eyebrow="The AIOS"
        title="How the operating system works."
        blurb="An intelligent core that powers every diagnostic, transformation, talent, and financial capability across your business."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {AIOS_WORKS.map((a) => (
          <div key={a.title} className="card card-interactive p-6">
            <h3 className="font-semibold">{a.title}</h3>
            <p className="muted mt-3 text-sm leading-relaxed">{a.body}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ── OS architecture diagram ───────────────────────────────── */
export function AiosArchitecture() {
  return (
    <Section id="architecture-visual" tone="ink" className="border-t">
      <div className="text-center">
        <p className="eyebrow justify-center" style={{ color: "var(--page)", opacity: 0.65 }}>
          The OS architecture
        </p>
        <h2 className="h-section mx-auto mt-4 max-w-2xl" style={{ color: "var(--page)" }}>
          Four engines. One core. A loop that closes.
        </h2>
      </div>

      <div className="mx-auto mt-14 max-w-4xl">
        <div
          className="rounded-xl p-5 text-center"
          style={{ border: "1px solid rgba(255,255,255,.22)", background: "rgba(255,255,255,.05)" }}
        >
          <p className="font-semibold" style={{ color: "var(--page)" }}>LAMID ONE — AIOS core layer</p>
          <p className="mt-1 text-sm" style={{ color: "var(--page)", opacity: 0.6 }}>
            Unified intelligence · adaptive learning · real-time signal processing · continuous growth loops
          </p>
        </div>

        <p className="py-3 text-center text-lg tracking-[0.6em]" style={{ color: "var(--page)", opacity: 0.35 }} aria-hidden="true">↓↓↓↓</p>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {ENGINES.map((e) => (
            <div
              key={e.id}
              className="rounded-xl p-4 text-center"
              style={{ border: "1px solid rgba(255,255,255,.18)", borderTop: `3px solid ${e.tint}` }}
            >
              <p className="text-sm font-bold" style={{ color: "var(--page)" }}>{e.name.replace("LAMID ", "")}</p>
              <p className="mt-1.5 text-[11px] leading-relaxed" style={{ color: "var(--page)", opacity: 0.6 }}>
                {e.role}
              </p>
            </div>
          ))}
        </div>

        <p className="py-3 text-center text-lg tracking-[0.6em]" style={{ color: "var(--page)", opacity: 0.35 }} aria-hidden="true">↓↓↓↓</p>

        <div
          className="rounded-xl p-5 text-center"
          style={{ border: "1px solid var(--brand)", background: "rgba(193,33,41,.12)" }}
        >
          <p className="text-sm leading-relaxed" style={{ color: "var(--page)", opacity: 0.85 }}>
            Every decision, action, capability shift, and financial outcome feeds back into the OS —
            refining diagnostics, strengthening pathways, and enhancing foresight.
          </p>
        </div>

        <p className="mt-8 text-center text-sm" style={{ color: "var(--page)", opacity: 0.6 }}>
          Clarity → Transformation → Capability → Financial strength. Unified, synchronised, continuous.
        </p>
      </div>
    </Section>
  );
}

/* ── The advantage: seven differentiators ──────────────────── */
export function AiosAdvantage() {
  return (
    <Section id="advantage" className="border-t">
      <SectionHeading
        eyebrow="The LAMID ONE advantage"
        title="Why the unified operating system changes everything."
        blurb="Not a tool, a platform, or a consulting framework — an operating system that synchronises diagnostics, transformation, capability, and financial performance into one loop."
      />
      <div className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ADVANTAGE.map((a) => (
          <div key={a.title} className="card card-interactive p-6">
            <h3 className="font-semibold leading-snug">{a.title}</h3>
            <p className="muted mt-3 text-sm leading-relaxed">{a.body}</p>
          </div>
        ))}
      </div>
      <p className="muted mt-10 max-w-3xl text-sm leading-relaxed">
        Organisations move faster. Leaders decide smarter. Teams grow stronger. Financial performance
        becomes clearer. Transformation becomes continuous — and the whole business operates with
        intelligence, cohesion, and momentum.
      </p>
    </Section>
  );
}

/* ── How LAMID ONE works: six steps ────────────────────────── */
export function AiosHowItWorks() {
  return (
    <Section id="how-aios-works" tone="tint" className="border-t">
      <SectionHeading
        eyebrow="How LAMID ONE works"
        title="The operating system in motion."
        blurb="Four engines inside a single Human-AI Operating System, working as one continuous loop."
      />
      <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {HOW_IT_WORKS.map((s, i) => (
          <li key={s.title} className="card p-6">
            <span
              className="font-display flex h-8 w-8 items-center justify-center rounded-full text-sm tabular-nums"
              style={{ background: "var(--brand)", color: "var(--brand-ink)" }}
            >
              {i + 1}
            </span>
            <h3 className="mt-4 font-semibold leading-snug">{s.title}</h3>
            <p className="muted mt-2 text-sm leading-relaxed">{s.body}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}

/* ── Proof points and the promise ──────────────────────────── */
export function AiosProof() {
  return (
    <Section id="proof" className="border-t">
      <SectionHeading eyebrow="Proof points" title="What the operating system delivers." />
      <div className="grid gap-x-10 gap-y-7 sm:grid-cols-2 lg:grid-cols-3">
        {PROOF_POINTS.map((p) => (
          <div key={p.title} className="feature-card" tabIndex={0}>
            <h3 className="font-semibold leading-snug">{p.title}</h3>
            <p className="muted mt-2 text-sm leading-relaxed">{p.body}</p>
          </div>
        ))}
      </div>

      <div className="mt-16">
        <SectionHeading
          eyebrow="The promise"
          title="One system. One intelligence. Four engines working as one."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PROMISE.map((p) => {
            const engine = ENGINES.find((e) => e.name.endsWith(p.engine));
            return (
              <div key={p.engine} className="card p-6" style={{ borderTop: `3px solid ${engine?.tint ?? "var(--brand)"}` }}>
                <p className="faint text-xs font-semibold uppercase tracking-wide">{p.engine}</p>
                <h3 className="mt-2 font-semibold leading-snug">{p.claim}</h3>
                <p className="muted mt-2 text-sm leading-relaxed">{p.body}</p>
              </div>
            );
          })}
        </div>
      </div>
    </Section>
  );
}

/* ── Use cases ─────────────────────────────────────────────── */
export function AiosUseCases() {
  return (
    <Section id="use-cases-aios" className="border-t">
      <SectionHeading
        eyebrow="Use cases"
        title="Where the operating system delivers real breakthroughs."
      />
      {/* Five of the six have a real use-case page arguing them at
          length. Those become links, so this grid is a way into the
          detail rather than a second copy of it — the same text now
          reads as the teaser it is. The sixth has no page and stays a
          plain card rather than being given a destination it lacks. */}
      <div className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {USE_CASES.map((u) => {
          const page = USE_CASE_PAGES.find((p) => p.docUseCase === u.title);
          const body = (
            <>
              <h3 className="font-semibold leading-snug">{u.title}</h3>
              <p className="muted mt-3 text-sm leading-relaxed">{u.body}</p>
              {page && (
                <span className="link-underline mt-4 inline-flex items-center gap-1.5 text-sm">
                  <span>{page.nav}</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </span>
              )}
            </>
          );

          return page ? (
            <Link key={u.title} href={`/use-cases/${page.slug}`} className="card card-interactive p-6">
              {body}
            </Link>
          ) : (
            <div key={u.title} className="card p-6">
              {body}
            </div>
          );
        })}
      </div>
    </Section>
  );
}

/* ── Industry applications ─────────────────────────────────── */
export function AiosIndustries() {
  return (
    <Section id="industries" tone="tint" className="border-t">
      <SectionHeading
        eyebrow="Industry applications"
        title="Precision across sectors. Intelligence across complexity."
      />
      <dl className="divide-hairline">
        {INDUSTRIES.map((i) => (
          <div key={i.name} className="flex flex-col gap-1.5 py-5 sm:flex-row sm:gap-10">
            <dt className="font-semibold sm:w-72 sm:shrink-0">{i.name}</dt>
            <dd className="muted text-sm leading-relaxed">{i.body}</dd>
          </div>
        ))}
      </dl>
    </Section>
  );
}

/* ── Product walkthrough: the orbit ────────────────────────── */
export function AiosWalkthrough() {
  return (
    <Section id="walkthrough" className="border-t">
      <SectionHeading
        eyebrow="Product walkthrough"
        title="A guided view of how the operating system works in practice."
        blurb="Control passes from the core, around the four engines, and back — step through it."
      />
      <WalkthroughOrbit />
    </Section>
  );
}

/**
 * Client quotes — renders the honest empty state until real ones exist.
 * Mirrors CaseStudyRail's rule: an empty section beats an invented one.
 */
export function AiosQuotes() {
  return (
    <Section id="quotes" className="border-t">
      <SectionHeading
        eyebrow="Voices"
        title="Named organisations. Quotes they approved."
        blurb="We publish attributable quotes from named organisations, not anonymous testimonials. The first go up as engagements complete."
      />
      {QUOTES.length === 0 ? (
        <div className="card p-8">
          <p className="muted text-sm leading-relaxed">
            No client quotes published yet. This section fills as engagements complete and
            organisations approve what we may attribute to them.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {QUOTES.map((q) => (
            <blockquote key={q.quote} className="card p-7">
              <p className="text-[15px] leading-relaxed">{q.quote}</p>
              <footer className="faint mt-4 text-xs">
                {q.name} — {q.role}, {q.org}
              </footer>
            </blockquote>
          ))}
        </div>
      )}
    </Section>
  );
}

/* Re-exported for the hero, which lives in page.tsx. */
export { Eyebrow };
