import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button, CtaPair } from "@/components/ui/Button";
import { Section, SectionHeading, Eyebrow } from "@/components/ui/Section";
import { Faq } from "@/components/sections/Faq";
import { SuiteGrid } from "@/components/sections/SuiteGrid";
import { USE_CASES, getUseCase } from "@/content/useCases";
import { SUITES_BY_ID, type SuiteId } from "@/content/suites";
import { CTA } from "@/content/brand";

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

  return (
    <>
      <Header />
      <main id="main">
        <section className="border-b" style={{ borderColor: "var(--line-soft)" }}>
          <div className="shell py-20">
            <div className="max-w-4xl">
              <Eyebrow>Use case</Eyebrow>
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

        <Section id="suites" className="border-t">
          <SectionHeading
            eyebrow="What you use"
            title={suites.length === 1 ? "One suite does this." : `${suites.length} suites, one record.`}
            blurb="Every suite writes to the same record, so nothing is re-entered when work moves between them."
          />
          <SuiteGrid suites={suites} columns={suites.length >= 3 ? 3 : 2} />
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
