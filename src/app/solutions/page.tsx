import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Section, SectionHeading, Eyebrow } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { SIZE_SOLUTIONS, ROLE_SOLUTIONS, type Solution } from "@/content/solutions";
import { USE_CASES } from "@/content/useCases";
import { CTA } from "@/content/brand";

export const metadata: Metadata = {
  title: "Solutions",
  description: "By organisation size, by role, and by the job you are trying to do.",
};

function SolutionCard({ s }: { s: Solution }) {
  return (
    <Link href={`/solutions/${s.slug}`}
          className="card group flex flex-col p-7 transition-colors hover:border-[color:var(--brand-line)]">
      <h3 className="font-display text-xl">{s.nav}</h3>
      <p className="muted mt-3 flex-1 text-sm leading-relaxed">{s.subhead}</p>
      <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold transition-colors group-hover:text-brand">
        Read more <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </span>
    </Link>
  );
}

export default function SolutionsIndex() {
  return (
    <>
      <Header />
      <main id="main">
        <section className="border-b" style={{ borderColor: "var(--line-soft)" }}>
          <div className="shell py-20">
            <div className="max-w-3xl">
              <Eyebrow>Solutions</Eyebrow>
              <h1 className="h-display mt-6">The right starting point for where you are.</h1>
              <p className="lead mt-6">
                <span className="text-brand">LAMID ONE</span> adapts to your size, your role and your objective —
                rather than expecting you to adapt to it. Every path below opens onto the same shared
                record, so switching starting points later never means starting over.
              </p>
            </div>
          </div>
        </section>

        <Section id="size">
          <SectionHeading eyebrow="By organisation size" title="Start where you actually are." />
          <div className="grid gap-5 lg:grid-cols-3">
            {SIZE_SOLUTIONS.map((s) => <SolutionCard key={s.slug} s={s} />)}
          </div>
        </Section>

        <Section id="role" className="border-t">
          <SectionHeading eyebrow="By role" title="What you own determines where you start." />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {ROLE_SOLUTIONS.map((s) => <SolutionCard key={s.slug} s={s} />)}
          </div>
        </Section>

        <Section id="objective" tone="tint" className="border-t">
          <SectionHeading
            eyebrow="By objective"
            title="Or start from the problem."
            action={<Link href="/use-cases" className="link-underline text-sm">All use cases</Link>}
          />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {USE_CASES.map((u) => (
              <Link key={u.slug} href={`/use-cases/${u.slug}`}
                    className="card group flex items-center justify-between gap-4 p-5 transition-colors hover:border-[color:var(--brand-line)]">
                <span className="text-sm font-semibold">{u.nav}</span>
                <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </Section>

        <section style={{ background: "var(--ink)" }}>
          <div className="shell py-24 text-center">
            <h2 className="h-display mx-auto max-w-3xl" style={{ color: "var(--page)" }}>
              Still not sure where to start?
            </h2>
            <p className="mx-auto mt-6 max-w-xl" style={{ color: "var(--ink-faint)" }}>
              Run the diagnostic. It will tell you which part of the business to look at first.
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
