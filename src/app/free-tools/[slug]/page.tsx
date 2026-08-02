import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { Clock, ArrowUpRight } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { Section, SectionHeading, Eyebrow } from "@/components/ui/Section";
import { Faq } from "@/components/sections/Faq";
import { FREE_TOOLS, FreeTool } from "@/content/freeTools";
import { SUITES_BY_ID, type SuiteId } from "@/content/suites";

export function generateStaticParams() {
  return FREE_TOOLS.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const tool = FREE_TOOLS.find((t) => t.slug === slug);
  if (!tool) return {};
  return { title: tool.name, description: tool.what };
}

/**
 * Free-tool detail page.
 *
 * Every tool routes to the SAME public, no-login diagnostic runner
 * the marketing suite pages already use (/diagnostics/{code}) —
 * fillable by anyone, result gated behind sign-up (or an upgrade, for
 * a paid-tier engine). `budget-estimator` is the one exception: it
 * routes to /diagnostics/budget, the dedicated calculator, because F02
 * isn't a rating-dimension assessment like the others.
 *
 * A tool with no `engineCode` yet is listed honestly as not wired to
 * a live computation rather than sending someone to a sign-up page
 * with nothing behind it once they arrive.
 */
export default async function FreeToolPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = FREE_TOOLS.find((t) => t.slug === slug);
  if (!tool) notFound();
  if (tool.externalHref) redirect(tool.externalHref);

  const suite = SUITES_BY_ID[tool.suite as SuiteId];
  const others = FREE_TOOLS.filter((t) => t.slug !== tool.slug).slice(0, 4);
  const runHref = tool.engineCode === "budget" ? "/diagnostics/budget" : tool.engineCode ? `/diagnostics/${tool.engineCode}` : null;

  return (
    <>
      <Header ctaSet="neutral" />
      <main id="main">
        <section className="border-b" style={{ borderColor: "var(--line-soft)" }}>
          <div className="shell py-8">
            <nav aria-label="Breadcrumb" className="faint text-sm">
              <Link href="/" className="hover:text-brand">Home</Link>
              <span className="mx-2" aria-hidden="true">/</span>
              <Link href="/free-tools" className="hover:text-brand">Free tools</Link>
              <span className="mx-2" aria-hidden="true">/</span>
              <span>{tool.name}</span>
            </nav>
          </div>
          <div className="shell pb-20">
            <div className="max-w-3xl">
              <Eyebrow>Free tool</Eyebrow>
              <h1 className="h-display mt-6">{tool.name}</h1>
              <p className="lead mt-6">{tool.what}</p>

              <div className="mt-8 flex flex-wrap items-center gap-5 text-sm">
                <span className="muted flex items-center gap-1.5">
                  <Clock className="h-4 w-4" aria-hidden="true" />
                  About {tool.minutes} minutes
                </span>
                <span className="muted flex items-center gap-1.5">
                  {runHref ? "Free to fill in — sign up to see the result" : "Not wired to a live engine yet"}
                </span>
                {suite && (
                  <Link href={`/suites/${suite.id}`} className="font-semibold hover:underline" style={{ color: suite.tint }}>
                    Part of {suite.name}
                  </Link>
                )}
              </div>

              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                {runHref ? (
                  <Button href={runHref} variant="primary">Try it now</Button>
                ) : (
                  <Button href="/suites" variant="secondary">Browse live suites instead</Button>
                )}
                {suite && <Button href={`/suites/${suite.id}`} variant="secondary">See the full suite</Button>}
              </div>
            </div>
          </div>
        </section>

        <Section id="start">
          <div className="card max-w-2xl p-8">
            {runHref ? (
              <>
                <h2 className="font-display text-xl">The tool itself runs in the application.</h2>
                <p className="muted mt-3 leading-relaxed">
                  {tool.name} is a reduced free tier over{" "}
                  <span className="font-medium">{tool.poweredBy}</span> — the same computation the
                  paid platform runs, with a smaller input surface. It is wired to the live engine
                  rather than reimplemented on this page.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Button href={runHref} variant="primary">
                    Try it now <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                  </Button>
                  <Button href="/free-tools" variant="ghost">All free tools</Button>
                </div>
              </>
            ) : (
              <>
                <h2 className="font-display text-xl">Not live yet.</h2>
                <p className="muted mt-3 leading-relaxed">
                  {tool.name} is not wired to a live engine yet, so there is nothing to run here
                  honestly — listed anyway rather than hidden, same reasoning as the trust
                  centre&apos;s &ldquo;not yet&rdquo; list.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Button href="/free-tools" variant="ghost">All free tools</Button>
                </div>
              </>
            )}
          </div>
        </Section>

        <Section className="border-t">
          <SectionHeading
            eyebrow="Why sign up"
            title="Free to fill in. An account only to see the result."
            blurb="Your answers are never asked to reveal who you are — only the computed score, and only because it is worth saving and re-opening rather than losing the moment you close the tab."
          />
        </Section>

        <Section className="border-t">
          <SectionHeading eyebrow="Other free tools" title="While you are here." />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {others.map((t: FreeTool) => (
              <Link key={t.slug} href={`/free-tools/${t.slug}`}
                    className="card p-6 transition-colors hover:border-[color:var(--brand-line)]">
                <h3 className="font-semibold">{t.name}</h3>
                <p className="muted mt-2 text-sm leading-relaxed">{t.what}</p>
              </Link>
            ))}
          </div>
        </Section>

        <Section className="border-t">
          <Faq
            items={[
              { q: `Is ${tool.name} really free?`, a: "Yes, with no time limit and no card. Filling it in never asks who you are — only seeing the computed result needs a free account, so your output is saved and you can re-open it. The paid plans exist for the full engine behind it, not for this." },
              { q: "What happens to the data I enter?", a: "It is encrypted in transit and at rest, and it is never used to train third-party AI models. If you fill in the form and never sign up, nothing is retained against an identity." },
              { q: "What is the paid version?", a: `${suite ? suite.name : "The full suite"} runs the complete engine with more inputs, history, comparison over time and export. This free tier is the same computation on a smaller surface.` },
            ]}
          />
        </Section>
      </main>
      <Footer />
    </>
  );
}
