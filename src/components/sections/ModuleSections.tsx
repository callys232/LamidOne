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
 * engine suite pages (/suites/core, /grow, /talent, /finance).
 *
 * Returns null for the other five suites, so DESK, SIGNAL, LEARN,
 * MARKET and DOCUSHARE keep their existing page untouched — the
 * document only ever wrote these four.
 *
 * The engine's accent is used the same restrained way as everywhere
 * else: rules, numerals and flow nodes. Nothing is flooded with it.
 */
/**
 * Where a suite sits in the four-engine structure.
 *
 * Renders on the five suites that run inside an engine rather than
 * being one — DESK, SIGNAL, LEARN, MARKET — plus DOCUSHARE, which is
 * the layer underneath all four.
 *
 * Written and styled as placement, not demotion: the band leads with
 * the division of labour ("FINANCE models the money. DESK collects
 * it."), carries the parent's accent rather than greying itself out,
 * and links both ways. A reader landing here from search learns how
 * this suite fits the story on the homepage instead of wondering why
 * it wasn't in it.
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
          {mod.industries.map((name) => (
            <li key={name} className="card card-interactive flex items-center gap-3 p-5 text-sm font-medium">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: tint }} aria-hidden="true" />
              {name}
            </li>
          ))}
        </ul>
      </Section>

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
