import type { Metadata } from "next";
import Link from "next/link";
import { Clock } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Section, SectionHeading, Eyebrow } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { FREE_TOOLS, type FreeTool } from "@/content/freeTools";
import { SUITES_BY_ID, type SuiteId } from "@/content/suites";

export const metadata: Metadata = {
  title: "Free tools",
  description: "Score a decision, map your operating rhythm, or cost a project — free to fill in, sign up to see the result.",
};

function ToolCard({ tool }: { tool: FreeTool }) {
  const suite = SUITES_BY_ID[tool.suite as SuiteId];
  return (
    <article className="card card-interactive flex flex-col p-6">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-xl">{tool.name}</h3>
        {!tool.engineCode && !tool.externalHref && !tool.toolHref && (
          <span
            className="faint shrink-0 rounded px-2 py-1 text-[10px] font-medium uppercase tracking-wide"
            style={{ border: "1px solid var(--line)" }}
          >
            Coming soon
          </span>
        )}
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
        {tool.externalHref ? "Open" : tool.engineCode || tool.toolHref ? "Try it — free" : "Learn more"}
      </Button>
    </article>
  );
}

/**
 * Free tools index.
 *
 * Every tool is free to fill in, with no account — signing up (or
 * upgrading, for a paid-tier engine) is only needed to see the
 * computed result. Same rule for all of them now, so this page states
 * it once up top instead of splitting tools into two sections by
 * gating rule.
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
              <h1 className="h-display mt-6">{FREE_TOOLS.length} tools. Fill in free, no account.</h1>
              <p className="lead mt-6">
                Each one is a thin free tier over an engine that runs the paid platform — the same
                arithmetic, a smaller input surface. Filling one in never asks who you are; seeing
                the computed result does.
              </p>
            </div>
          </div>
        </section>

        <Section id="tools">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FREE_TOOLS.map((t) => <ToolCard key={t.slug} tool={t} />)}
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
