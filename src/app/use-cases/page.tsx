import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Section, SectionHeading, Eyebrow } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { USE_CASES } from "@/content/useCases";
import { AiosUseCases } from "@/components/sections/Aios";
import { SUITES_BY_ID, type SuiteId } from "@/content/suites";
import { CTA } from "@/content/brand";

export const metadata: Metadata = {
  title: "Use cases",
  description: "Nine jobs organisations hire LAMID ONE to do.",
};

/** The verb tree, listed. Same software as /products, filed by intent. */
export default function UseCasesIndex() {
  return (
    <>
      <Header />
      <main id="main">
        <section className="border-b" style={{ borderColor: "var(--line-soft)" }}>
          <div className="shell py-20">
            <div className="max-w-3xl">
              <Eyebrow>Solutions by objective</Eyebrow>
              <h1 className="h-display mt-6">What are you trying to fix?</h1>
              <p className="lead mt-6">
                The same four engines, filed by the job rather than the product. Start from the
                problem you actually have.
              </p>
            </div>
          </div>
        </section>

        <Section>
          <SectionHeading eyebrow="Nine jobs" title="Pick the one that sounds like this week." />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {USE_CASES.map((u) => (
              <Link
                key={u.slug}
                href={`/use-cases/${u.slug}`}
                className="card group flex flex-col p-7 transition-colors hover:border-[color:var(--brand-line)]"
              >
                <h2 className="font-display text-xl leading-snug">{u.nav}</h2>
                <p className="muted mt-3 flex-1 text-sm leading-relaxed">{u.subhead}</p>
                <div className="mt-5 flex flex-wrap gap-1.5">
                  {u.suites.map((id) => {
                    const s = SUITES_BY_ID[id as SuiteId];
                    return s ? (
                      <span key={id} className="rounded px-2 py-1 text-[10px] font-semibold"
                            style={{ background: `${s.tint}14`, color: s.tint }}>
                        {s.name.replace("LAMID ", "")}
                      </span>
                    ) : null;
                  })}
                </div>
                <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold transition-colors group-hover:text-brand">
                  Read more <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </span>
              </Link>
            ))}
          </div>
        </Section>

        {/* Moved off the homepage. These six are the document's own
            framing of where the OS delivers, and five of them link
            through to the page that argues them at length — which makes
            this the index's natural second layer rather than a
            duplicate of the grid above it. */}
        <AiosUseCases />

        <section style={{ background: "var(--ink)" }}>
          <div className="shell py-24 text-center">
            <h2 className="h-display mx-auto max-w-3xl" style={{ color: "var(--page)" }}>
              Not sure which one you have?
            </h2>
            <p className="mx-auto mt-6 max-w-xl" style={{ color: "var(--ink-faint)" }}>
              The diagnostic tells you. Ten minutes, free, no card.
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
