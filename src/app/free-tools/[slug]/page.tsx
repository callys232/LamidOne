import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { Clock, Lock, Unlock } from "lucide-react";
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
 * States up front whether an account is needed and why, rather than
 * discovering it at the submit button. Gating tracks the value of what
 * you walk away with, and saying so removes the bait-and-switch feeling
 * (teardown §7.3).
 */
export default async function FreeToolPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = FREE_TOOLS.find((t) => t.slug === slug);
  if (!tool) notFound();

  const suite = SUITES_BY_ID[tool.suite as SuiteId];
  const others = FREE_TOOLS.filter((t) => t.slug !== tool.slug).slice(0, 4);

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
                  {tool.gated ? <Lock className="h-4 w-4" aria-hidden="true" /> : <Unlock className="h-4 w-4" aria-hidden="true" />}
                  {tool.gated ? "Free account required" : "No account required"}
                </span>
                {suite && (
                  <Link href={`/suites/${suite.id}`} className="font-semibold hover:underline" style={{ color: suite.tint }}>
                    Part of {suite.name}
                  </Link>
                )}
              </div>

              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <Button href={tool.gated ? "/signup" : "#start"} variant="primary">
                  {tool.gated ? "Create a free account" : "Start now"}
                </Button>
                {suite && <Button href={`/suites/${suite.id}`} variant="secondary">See the full suite</Button>}
              </div>
            </div>
          </div>
        </section>

        <Section id="start">
          <div className="card max-w-2xl p-8">
            <h2 className="font-display text-xl">The tool itself runs in the application.</h2>
            <p className="muted mt-3 leading-relaxed">
              {tool.name} is a reduced free tier over{" "}
              <span className="font-medium">{tool.poweredBy}</span> — the same computation the paid
              platform runs, with a smaller input surface. It is wired to the live engine rather
              than reimplemented on this page.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button href={tool.gated ? "/signup" : "/demo"} variant="primary">
                {tool.gated ? "Create a free account" : "Open the tool"}
              </Button>
              <Button href="/free-tools" variant="ghost">All free tools</Button>
            </div>
          </div>
        </Section>

        <Section className="border-t">
          <SectionHeading
            eyebrow="Why this is free"
            title={tool.gated ? "Free, but we ask for an email." : "Free, and we do not ask for anything."}
            blurb={
              tool.gated
                ? "This one produces a document you will want to keep and re-open — so a free account holds it for you. Nothing is charged, now or later, unless you choose a paid plan."
                : "This one gives you a reading you look at once. There is nothing to store, so there is no reason to ask who you are."
            }
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
              { q: `Is ${tool.name} really free?`, a: `Yes, with no time limit and no card. ${tool.gated ? "It needs a free account so your output is saved and you can re-open it." : "It needs no account at all."} The paid plans exist for the full engine behind it, not for this.` },
              { q: "What happens to the data I enter?", a: "It is encrypted in transit and at rest, and it is never used to train third-party AI models. If you used the tool without an account, nothing is retained against an identity." },
              { q: "What is the paid version?", a: `${suite ? suite.name : "The full suite"} runs the complete engine with more inputs, history, comparison over time and export. This free tier is the same computation on a smaller surface.` },
            ]}
          />
        </Section>
      </main>
      <Footer />
    </>
  );
}
