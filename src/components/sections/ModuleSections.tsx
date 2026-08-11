import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Section, SectionHeading } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { CTA } from "@/content/brand";
import { ENGINES } from "@/content/aios";
import { MODULE_BY_ENGINE, SUITE_PARENT } from "@/content/modules";
import { microcopyForEngine } from "@/content/microcopy";
import type { SuiteId } from "@/content/suites";

/**
 * The brand document's module landing page, rendered under the four
 * main suite pages (/suites/core, /grow, /talent, /finance).
 *
 * Returns null for the other five suites, so DESK, SIGNAL, LEARN,
 * MARKET and DOCUSHARE keep their existing page untouched — the
 * document only ever wrote these four.
 *
 * The suite's own accent is used the same restrained way as everywhere
 * else: rules, numerals and flow nodes. Nothing is flooded with it.
 */
/**
 * Where a suite sits among the four.
 *
 * Renders on the five suites folded into one of the four — DESK,
 * SIGNAL, LEARN, MARKET — plus DOCUSHARE, which is the layer underneath
 * all four rather than folded into any one.
 *
 * Written and styled as placement, not demotion: the band leads with
 * the division of labour ("CORE decides. DESK delivers and bills it."),
 * carries the parent's accent rather than greying itself out, and links
 * both ways. A reader landing here from search learns how this suite
 * fits the story on the homepage instead of wondering why it wasn't in
 * it.
 */
export function SuiteParentBand({ suiteId }: { suiteId: SuiteId }) {
  const parent = SUITE_PARENT[suiteId];
  if (!parent) return null;

  const engine = parent.engine ? ENGINES.find((e) => e.id === parent.engine) : null;
  const tint = engine?.tint ?? "var(--brand)";

  return (
    <Section id="where-it-sits" className="border-t">
      <div className="card p-8 sm:p-10" style={{ borderLeft: `4px solid ${tint}` }}>
        <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-7">
            <p className="eyebrow">Inside the operating system</p>
            <h2 className="h-section mt-5 text-2xl sm:text-3xl">{parent.claim}</h2>
            <p className="muted mt-5 text-[15px] leading-relaxed">{parent.body}</p>
          </div>

          <div className="lg:col-span-4 lg:col-start-9">
            {/* The division of labour — the line that makes this a
                partnership rather than a hierarchy. */}
            <p className="font-display text-xl leading-snug" style={{ color: tint }}>
              {parent.split}
            </p>
            {engine && (
              <Link
                href={`/suites/${engine.id}`}
                className="link-underline mt-6 inline-flex items-center gap-1.5 text-sm"
              >
                <span>Open {engine.name}</span> <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </Section>
  );
}

export function ModuleSections({ suiteId }: { suiteId: SuiteId }) {
  const mod = MODULE_BY_ENGINE[suiteId];
  if (!mod) return null;

  const engine = ENGINES.find((e) => e.id === mod.engine)!;
  const tint = engine.tint;
  const glossary = microcopyForEngine(engine.id);

  return (
    <>
      {/* ── The gap ───────────────────────────────────────────
          Optional — renders only where MODULE_PAGES sets `gap`. Same
          job TheGap does on the homepage — name the problem before the
          product — scoped to one suite. Text only: no chart, no score.
          See the note on ModulePage.gap for why. */}
      {mod.gap && (
        <Section className="border-t">
          <div className="grid items-start gap-10 md:grid-cols-12">
            <div className="md:col-span-5">
              <span
                className="inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-[13px] font-semibold"
                style={{ borderColor: "var(--line)" }}
              >
                <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: tint }} aria-hidden="true" />
                {mod.gap.badge}
              </span>
            </div>
            <div className="md:col-span-6 md:col-start-7">
              <h2 className="h-section">{mod.gap.title}</h2>
              <p className="lead mt-5">{mod.gap.body}</p>
            </div>
          </div>
        </Section>
      )}

      {/* ── Purpose ─────────────────────────────────────────── */}
      <Section id="purpose" className="border-t">
        <div className="grid gap-10 md:grid-cols-12">
          <h2 className="h-section md:col-span-5">{mod.purpose.title}</h2>
          <div className="md:col-span-6 md:col-start-7">
            {mod.purpose.paragraphs.map((p, i) => (
              <p key={p} className={`leading-relaxed ${i === 0 ? "lead" : "muted mt-4 text-[15px]"}`}>
                {p}
              </p>
            ))}
          </div>
        </div>
      </Section>

      {/* ── How this engine works ───────────────────────────── */}
      <Section id="how-it-works" tone="tint" className="border-t">
        <SectionHeading
          eyebrow={`How ${engine.name.replace("LAMID ", "")} works`}
          title={mod.worksTagline}
        />
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {mod.works.map((w, i) => (
            <li key={w.title} className="card p-6" style={{ borderTop: `3px solid ${tint}` }}>
              <span className="font-display text-lg tabular-nums" style={{ color: tint }}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-3 font-semibold leading-snug">{w.title}</h3>
              <p className="muted mt-2 text-sm leading-relaxed">{w.body}</p>
            </li>
          ))}
        </ol>
      </Section>

      {/* ── Capabilities ────────────────────────────────────── */}
      <Section id="capabilities" className="border-t">
        <SectionHeading eyebrow="Capabilities" title={`What ${engine.name.replace("LAMID ", "")} delivers.`} />
        <dl className="divide-hairline">
          {mod.capabilities.map((c) => (
            <div key={c.title} className="flex flex-col gap-1.5 py-5 sm:flex-row sm:gap-10">
              <dt className="flex items-baseline gap-3 font-semibold sm:w-80 sm:shrink-0">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: tint }} aria-hidden="true" />
                {c.title}
              </dt>
              <dd className="muted text-sm leading-relaxed">{c.body}</dd>
            </div>
          ))}
        </dl>
      </Section>

      {/* ── Intelligence flow ───────────────────────────────── */}
      <Section id="intelligence-flow" tone="ink" className="border-t">
        <div className="text-center">
          <p className="eyebrow justify-center" style={{ color: "var(--page)", opacity: 0.65 }}>
            Intelligence flow
          </p>
          <h2 className="h-section mx-auto mt-4 max-w-2xl" style={{ color: "var(--page)" }}>
            {mod.flowNote}
          </h2>
        </div>

        <ol className="mx-auto mt-12 flex max-w-4xl flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          {mod.flow.map((stage, i) => (
            <li key={stage} className="flex flex-1 items-center gap-3">
              <span
                className="flex-1 rounded-xl px-4 py-4 text-center text-sm font-semibold"
                style={{
                  border: `1px solid ${i === mod.flow.length - 1 ? tint : "rgba(255,255,255,.2)"}`,
                  color: "var(--page)",
                  background: i === mod.flow.length - 1 ? `${tint}26` : "transparent",
                }}
                title={glossary?.tooltips.find((t) => stage.includes(t.term))?.body}
              >
                {stage}
              </span>
              {i < mod.flow.length - 1 && (
                <span className="shrink-0 text-lg" style={{ color: tint }} aria-hidden="true">→</span>
              )}
            </li>
          ))}
        </ol>
      </Section>

      {/* ── Industry applications ───────────────────────────── */}
      <Section id="industries" className="border-t">
        <SectionHeading
          eyebrow="Industry applications"
          title={`${engine.name.replace("LAMID ", "")} adapts to every sector.`}
        />
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {mod.industries.map((ind) => (
            <li key={ind.name} className="card card-interactive flex gap-3 p-5">
              <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: tint }} aria-hidden="true" />
              {/* `body` is optional — a suite with no industry copy yet
                  renders exactly as this list did before: name only,
                  same size, same weight. Only when both are present does
                  the sector name become a heading over its own
                  sentence. */}
              {ind.body ? (
                <div>
                  <p className="text-sm font-semibold">{ind.name}</p>
                  <p className="muted mt-1 text-sm leading-snug">{ind.body}</p>
                </div>
              ) : (
                <span className="text-sm font-medium">{ind.name}</span>
              )}
            </li>
          ))}
        </ul>
      </Section>

      {/* ── Who this is for ──────────────────────────────────
          Optional — renders only where MODULE_PAGES sets `whoFor`.
          Audience framing lived on the homepage's scale card and
          nowhere on the suite's own page; a reader who arrived here
          directly from search had no line telling them whether this
          suite was built for something their size. */}
      {mod.whoFor && (
        <Section className="border-t">
          <SectionHeading eyebrow="Who this is for" title={mod.whoFor} />
        </Section>
      )}

      {/* ── Callout ───────────────────────────────────────────
          Optional — a single tinted pull-quote, standing on its own
          rather than inside a card. Same treatment as the ecosystem
          section's closing line on the homepage (dark band, one
          sentence), reused here rather than invented fresh.

          `border: var(--line)` matters here specifically: `--depth`
          and the page background sit only one step apart in dark mode
          (`#060C1A` vs `#0A0F1F`), so a fill alone reads as a "dark
          band" on the white light-mode page but nearly disappears into
          the dark-mode page around it. The same hairline every `.card`
          already carries gives the box an edge in both themes without
          lightening the midnight fill itself. */}
      {mod.callout && (
        <Section className="border-t">
          <p
            className="mx-auto max-w-3xl rounded-xl border px-7 py-6 text-center text-[17px] leading-relaxed"
            style={{ background: "var(--depth)", borderColor: "var(--line)", color: "rgba(255,255,255,0.9)" }}
          >
            {mod.callout}
          </p>
        </Section>
      )}

      {/* ── Module CTA ──────────────────────────────────────── */}
      <Section id="activate" tone="tint" className="border-t">
        <div className="text-center">
          <h2 className="h-section mx-auto max-w-2xl">{mod.cta.claim}</h2>
          <p className="lead mx-auto mt-5 max-w-2xl">{mod.cta.action}</p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Button href={CTA.primary.href} variant="primary">{CTA.primary.label}</Button>
            <Button href={CTA.secondary.href} variant="secondary">{CTA.secondary.label}</Button>
          </div>
        </div>
      </Section>
    </>
  );
}
