import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button, CtaPair } from "@/components/ui/Button";
import { Section, SectionHeading } from "@/components/ui/Section";
import { Faq } from "@/components/sections/Faq";
import { SuiteGrid } from "@/components/sections/SuiteGrid";
import { USE_CASES, getUseCase } from "@/content/useCases";
import { SUITES_BY_ID, type SuiteId } from "@/content/suites";
import { CTA } from "@/content/brand";
import { ENGINES, PROOF_POINTS, USE_CASES as AIOS_USE_CASES } from "@/content/aios";
import { MODULE_PAGES, SUITE_PARENT } from "@/content/modules";
import { microcopyForEngine } from "@/content/microcopy";

/**
 * USE CASE TEMPLATE — one file, nine pages.
 *
 * Deliberately carries NO PRICING. These pages sell the problem being
 * solved; introducing price mid-argument kills the argument. Price is
 * one click away in the nav (teardown §7.2).
 *
 * Ends with lateral navigation to sibling use cases, so a reader who
 * does not recognise themselves in this one can find another without
 * going back to the menu.
 */

export function generateStaticParams() {
  return USE_CASES.map((u) => ({ slug: u.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const uc = getUseCase(slug);
  if (!uc) return {};
  return { title: uc.nav, description: uc.subhead };
}

export default async function UseCasePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const uc = getUseCase(slug);
  if (!uc) notFound();

  const suites = uc.suites.map((id) => SUITES_BY_ID[id as SuiteId]).filter(Boolean);
  const siblings = USE_CASES.filter((u) => u.slug !== uc.slug).slice(0, 6);

  /* The four-engine structure, resolved from uc.engine. Every one of
     these is derived rather than written per page, so a use case can
     never disagree with the homepage about which engine owns it or what
     value that engine delivers. */
  const engine = ENGINES.find((e) => e.id === uc.engine)!;
  const modulePage = MODULE_PAGES.find((m) => m.engine === uc.engine)!;
  const docCase = uc.docUseCase
    ? AIOS_USE_CASES.find((d) => d.title === uc.docUseCase)
    : undefined;

  /* Suites this use case touches that run INSIDE an engine rather than
     being one. These get the division-of-labour line, which is what
     stops the section reading as a flat list of peers. */
  const inner = uc.suites
    .map((id) => ({ id, parent: SUITE_PARENT[id] }))
    .filter((s): s is { id: SuiteId; parent: (typeof SUITE_PARENT)[string] } => Boolean(s.parent));

  /* The document's episodic-versus-continuous proof point. Looked up by
     prefix rather than index so reordering PROOF_POINTS cannot silently
     swap this band for a different argument. */
  const continuous = PROOF_POINTS.find((p) => p.title.startsWith("Continuous Growth Loops"));

  /* The engine's own glossary. Attached to the flow stages below, which
     is what these tooltips were written to explain — "Insight streams
     show how patterns emerge across the organisation" is a definition of
     a stage in CORE's flow, not a general marketing line. */
  const glossary = microcopyForEngine(uc.engine);

  return (
    <>
      <Header />
      <main id="main">
        <section className="border-b" style={{ borderColor: "var(--line-soft)" }}>
          <div className="shell py-20">
            <div className="max-w-4xl">
              {/* The value first, in its engine's tint. The homepage
                  promises four values; this is the page where one of
                  them gets argued, so it says which one before it says
                  anything else. Written out rather than using <Eyebrow>
                  because that component's dot is hard-wired to the brand
                  red, and here the dot has to carry the engine. */}
              <p className="inline-flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-[0.16em]">
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: engine.tint }}
                  aria-hidden="true"
                />
                <span style={{ color: "var(--ink-muted)" }}>{engine.value}</span>
                <span className="faint font-normal normal-case tracking-normal">
                  · Use case
                </span>
              </p>
              <h1 className="h-display mt-6">{uc.headline}</h1>
              <p className="lead mt-6 max-w-2xl">{uc.subhead}</p>
              <CtaPair primary={CTA.primary} secondary={CTA.secondary} className="mt-10" />
            </div>
          </div>
        </section>

        {/* Name the problem before selling the fix. */}
        <Section id="problem">
          <div className="grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-6">
              <h2 className="h-section">{uc.problem.title}</h2>
              <p className="lead mt-5">{uc.problem.body}</p>
            </div>
            <div className="lg:col-span-5 lg:col-start-8">
              <p className="faint mb-4 text-[11px] font-semibold uppercase tracking-[0.14em]">
                You will recognise this if
              </p>
              <ul className="space-y-3">
                {uc.problem.symptoms.map((s) => (
                  <li key={s} className="muted flex gap-3 text-sm leading-relaxed">
                    <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-brand" aria-hidden="true" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Section>

        {/* The numbered framework IS the content. */}
        <Section id="framework" tone="tint" className="border-t">
          <SectionHeading eyebrow="The approach" title={uc.framework.title} />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {uc.framework.steps.map((s) => (
              <div key={s.n} className="card card-interactive p-7">
                <span className="font-display text-3xl text-brand">{s.n}</span>
                <h3 className="mt-5 font-semibold">{s.title}</h3>
                <p className="muted mt-2.5 text-sm leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section id="different" className="border-t">
          <div className="grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-6">
              <h2 className="h-section">{uc.different.title}</h2>
              <p className="lead mt-5">{uc.different.body}</p>
            </div>
            <ul className="space-y-3 lg:col-span-5 lg:col-start-8">
              {uc.different.points.map((p) => (
                <li key={p} className="flex gap-3 text-[15px] font-medium leading-snug">
                  <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-brand" aria-hidden="true" />
                  {p}
                </li>
              ))}
            </ul>
          </div>
        </Section>

        {/* ── Episodic → continuous ───────────────────────────
            The document's central thesis, stated verbatim. It appears
            on the homepage too, and that repetition is deliberate: a
            use-case page is its own landing surface — most readers
            arrive here from search and never see the homepage — so the
            argument that everything else on this page depends on
            cannot be left one click away. */}
        {continuous && (
          <Section id="continuous" className="border-t">
            <div className="border-l-4 pl-8 sm:pl-10" style={{ borderColor: engine.tint }}>
              <h2 className="h-section max-w-3xl">{continuous.title}</h2>
              <p className="lead mt-6 max-w-3xl">{continuous.body}</p>
            </div>
          </Section>
        )}

        {/* ── Which engine owns this ──────────────────────────
            The section that used to say "2 suites, one record" and
            render them as peers. It now names the engine, its promise,
            and the division of labour between the engine and the
            suites that run inside it. */}
        <Section id="engine" tone="tint" className="border-t">
          <SectionHeading
            eyebrow={`Inside ${engine.name}`}
            title={`${engine.value} runs on ${engine.name}.`}
            blurb={docCase?.body ?? engine.promise}
          />

          {/* The intelligence flow, showing what feeds this engine and
              what it feeds — the reason "one OS" is a claim this page
              demonstrates rather than asserts. */}
          <ol className="flex flex-col items-stretch gap-2.5 sm:flex-row sm:items-center">
            {modulePage.flow.map((stage, i) => (
              <li key={stage} className="flex flex-1 items-center gap-2.5">
                <span
                  className="card flex-1 px-4 py-3.5 text-center text-sm font-semibold"
                  style={
                    i === modulePage.flow.length - 1
                      ? { borderColor: engine.tint, color: engine.tint }
                      : undefined
                  }
                  /* A native title rather than a custom tooltip: these
                     are glossary definitions, not interactive content,
                     and a hand-rolled popover would need focus, escape
                     and touch handling to be no more useful. */
                  title={glossary?.tooltips.find((t) => stage.includes(t.term))?.body}
                >
                  {stage}
                </span>
                {i < modulePage.flow.length - 1 && (
                  <span className="shrink-0 text-lg" style={{ color: engine.tint }} aria-hidden="true">
                    →
                  </span>
                )}
              </li>
            ))}
          </ol>

          {/* Division of labour for the suites that run inside an
              engine. Placement, not demotion — each line says what the
              engine does and what the suite does, as a pair. */}
          {inner.length > 0 && (
            <dl className="mt-12 grid gap-x-10 gap-y-6 sm:grid-cols-2">
              {inner.map(({ id, parent }) => (
                <div key={id}>
                  <dt className="font-display text-lg leading-snug" style={{ color: engine.tint }}>
                    {parent.split}
                  </dt>
                  <dd className="muted mt-2 text-sm leading-relaxed">{parent.body}</dd>
                </div>
              ))}
            </dl>
          )}
        </Section>

        <Section id="suites" className="border-t">
          <SectionHeading
            eyebrow="What you actually use"
            title={suites.length === 1 ? "One suite does this." : `${suites.length} suites, one record.`}
            blurb="Every suite writes to the same record, so nothing is re-entered when work moves between them."
          />
          <SuiteGrid suites={suites} columns={suites.length >= 3 ? 3 : 2} />
        </Section>

        {/* ── Sectors ─────────────────────────────────────────
            The engine's industry applications, kept as a compact chip
            row rather than a card grid. There is no sector-specific
            data behind these, so they are positioned as where the
            engine is applied — not as proof it has been. */}
        <Section id="industries" className="border-t">
          <SectionHeading
            eyebrow="Where this applies"
            title={`${engine.name.replace("LAMID ", "")} adapts to every sector.`}
          />
          <ul className="flex flex-wrap gap-2.5">
            {modulePage.industries.map((name) => (
              <li
                key={name}
                className="inline-flex items-center gap-2.5 rounded-full border px-4 py-2 text-sm"
                style={{ borderColor: "var(--line)" }}
              >
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: engine.tint }}
                  aria-hidden="true"
                />
                {name}
              </li>
            ))}
          </ul>
        </Section>

        <Section id="faq" className="border-t">
          <Faq items={uc.faq} />
        </Section>

        {/* Lateral navigation between siblings. */}
        <Section id="other" className="border-t">
          <SectionHeading eyebrow="Other use cases" title="Not quite your problem?" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {siblings.map((s) => (
              <Link
                key={s.slug}
                href={`/use-cases/${s.slug}`}
                className="card group flex items-center justify-between gap-4 p-5 transition-colors hover:border-[color:var(--brand-line)]"
              >
                <span className="text-sm font-semibold">{s.nav}</span>
                <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </Section>

        <section style={{ background: "var(--ink)" }}>
          <div className="shell py-24 text-center">
            <h2 className="h-display mx-auto max-w-3xl" style={{ color: "var(--page)" }}>
              {uc.closing.title}
            </h2>
            <p className="mx-auto mt-6 max-w-xl" style={{ color: "var(--ink-faint)" }}>
              {uc.closing.body}
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
