import type { Metadata } from "next";
import Link from "next/link";
import { Clock, Lock, Unlock } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Section, SectionHeading, Eyebrow } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { FREE_TOOLS, UNGATED, GATED, type FreeTool } from "@/content/freeTools";
import { SUITES_BY_ID, type SuiteId } from "@/content/suites";

export const metadata: Metadata = {
  title: "Free tools",
  description:
    "Score a decision, map your operating rhythm, check your AI visibility or cost a project — free, most without an account.",
};

function ToolCard({ tool }: { tool: FreeTool }) {
  const suite = SUITES_BY_ID[tool.suite as SuiteId];
  return (
    <article className="card card-interactive flex flex-col p-6">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-xl">{tool.name}</h3>
        <span
          className="faint flex shrink-0 items-center gap-1 rounded px-2 py-1 text-[10px] font-medium uppercase tracking-wide"
          style={{ border: "1px solid var(--line)" }}
        >
          {tool.gated ? <Lock className="h-3 w-3" aria-hidden="true" /> : <Unlock className="h-3 w-3" aria-hidden="true" />}
          {tool.gated ? "Sign-up" : "No account"}
        </span>
      </div>
      <p className="muted mt-3 flex-1 text-sm leading-relaxed">{tool.what}</p>
      <div className="faint mt-5 flex items-center gap-4 text-xs">
        <span className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" aria-hidden="true" />
          {tool.minutes} min
        </span>
        {suite && (
          <Link href={`/suites/${suite.id}`} className="hover:text-brand" style={{ color: suite.tint }}>
            {suite.name}
          </Link>
        )}
      </div>
      <Button href={`/free-tools/${tool.slug}`} variant="ghost" className="mt-6 w-full">
        {tool.gated ? "Start — free account" : "Start now"}
      </Button>
    </article>
  );
}

/**
 * Free tools index.
 *
 * Gating is calibrated to output, and the page says so openly. Telling
 * people which tools need an account before they click is a small
 * honesty that costs nothing and removes the bait-and-switch feeling.
 */
export default function FreeToolsPage() {
  return (
    <>
      <Header ctaSet="neutral" />
      <main id="main">
        <section className="border-b" style={{ borderColor: "var(--line-soft)" }}>
          <div className="shell py-20">
            <div className="max-w-3xl">
              <Eyebrow>Free tools</Eyebrow>
              <h1 className="h-display mt-6">{FREE_TOOLS.length} tools. No card, ever.</h1>
              <p className="lead mt-6">
                Each one is a thin free tier over an engine that runs the paid platform — the same
                arithmetic, a smaller input surface. {UNGATED.length} need no account at all.
              </p>
            </div>
          </div>
        </section>

        <Section id="ungated">
          <SectionHeading
            eyebrow="No account needed"
            title="Get a verdict and leave."
            blurb="These return a score or a reading. You do not have to tell us who you are to see it."
          />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {UNGATED.map((t) => <ToolCard key={t.slug} tool={t} />)}
          </div>
        </Section>

        <Section id="gated" className="border-t">
          <SectionHeading
            eyebrow="Free account"
            title="Take something away with you."
            blurb="These produce a document you will want to keep and re-open — a budget, a gap list, a brief. A free account holds them for you."
          />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {GATED.map((t) => <ToolCard key={t.slug} tool={t} />)}
          </div>
        </Section>

        <section style={{ background: "var(--ink)" }}>
          <div className="shell py-24 text-center">
            <h2 className="h-display mx-auto max-w-3xl" style={{ color: "var(--page)" }}>
              The free plan keeps everything you make.
            </h2>
            <p className="mx-auto mt-6 max-w-xl" style={{ color: "var(--ink-faint)" }}>
              Two users and one full diagnostic, free. No card required.
            </p>
            <div className="mt-10 flex justify-center gap-3">
              <Button href="/signup" variant="primary">Get started free</Button>
              <Button href="/pricing" variant="contrast">See pricing</Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
