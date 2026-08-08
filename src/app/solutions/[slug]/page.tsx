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
import { PricingCards } from "@/components/sections/PricingCards";
import { SOLUTIONS, getSolution } from "@/content/solutions";
import { SUITES_BY_ID, type SuiteId } from "@/content/suites";
import { TIERS_BY_ID } from "@/content/tiers";
import { CTA } from "@/content/brand";
import { ENGINES } from "@/content/aios";

/** Segment and role pages — one template, ten routes. */
export function generateStaticParams() {
  return SOLUTIONS.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const sol = getSolution(slug);
  if (!sol) return {};
  return { title: sol.nav, description: sol.subhead };
}

export default async function SolutionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const sol = getSolution(slug);
  if (!sol) notFound();

  const suites = sol.suites.map((id) => SUITES_BY_ID[id as SuiteId]).filter(Boolean);
  const tier = TIERS_BY_ID[sol.recommendedTier];
  const siblings = SOLUTIONS.filter((s) => s.kind === sol.kind && s.slug !== sol.slug);
  /* Undefined on the three size pages by design — see the `engine` note
     in solutions.ts. */
  const engine = sol.engine ? ENGINES.find((e) => e.id === sol.engine) : undefined;

  return (
    <>
      <Header />
      <main id="main">
        <section className="border-b" style={{ borderColor: "var(--line-soft)" }}>
          <div className="shell py-20">
            <div className="max-w-4xl">
              <Eyebrow>{sol.eyebrow}</Eyebrow>
              <h1 className="h-display mt-6">{sol.headline}</h1>
              <p className="lead mt-6 max-w-2xl">{sol.subhead}</p>

              {/* The value thread, cut two ways.
                  A role page names the one value that role is actually
                  shopping for — a CFO buys Financial Performance, a CPO
                  buys Capability — and carries its engine's tint. A size
                  page gets all four, because a founder is not buying one
                  of them; they are buying the whole system at a size
                  that fits. Same thread either way. */}
              {engine ? (
                <p className="mt-8 inline-flex items-center gap-2.5 text-sm font-semibold">
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ background: engine.tint }}
                    aria-hidden="true"
                  />
                  {engine.value}
                  <span className="faint font-normal">· delivered by {engine.name}</span>
                </p>
              ) : (
                <p className="text-gradient-brand mt-8 text-base font-semibold sm:text-lg">
                  {ENGINES.map((e) => `${e.value}.`).join(" ")}
                </p>
              )}

              <CtaPair primary={CTA.primary} secondary={CTA.secondary} className="mt-9" />
            </div>
          </div>
        </section>

        <Section id="pains">
          <div className="grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <h2 className="h-section">What this usually looks like.</h2>
            </div>
            <ul className="space-y-4 lg:col-span-6 lg:col-start-7">
              {sol.pains.map((p) => (
                <li key={p} className="flex gap-3 text-[15px] leading-relaxed">
                  <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-brand" aria-hidden="true" />
                  {p}
                </li>
              ))}
            </ul>
          </div>
        </Section>

        <Section id="path" tone="tint" className="border-t">
          <SectionHeading eyebrow="Where to start" title="A sequence, not a shopping list." />
          <div className={`grid gap-5 sm:grid-cols-2 ${sol.path.length >= 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
            {sol.path.map((p, i) => (
              <div key={p.title} className="card card-interactive p-7">
                <span className="font-display text-3xl text-brand">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="mt-5 font-semibold">{p.title}</h3>
                <p className="muted mt-2.5 text-sm leading-relaxed">{p.body}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section id="suites" className="border-t">
          <SectionHeading
            eyebrow="What you use"
            title={`${suites.length} suites for this.`}
            blurb="Seat price follows your account tier, so using more of them costs nothing extra per seat."
          />
          <SuiteGrid suites={suites} columns={3} />
        </Section>

        <Section id="pricing" className="border-t">
          <SectionHeading
            eyebrow="Pricing"
            title={`Most start on ${tier.name}.`}
            blurb={tier.positioning}
            action={<Link href="/pricing" className="link-underline text-sm">Full comparison</Link>}
          />
          <PricingCards show={["free", sol.recommendedTier === "free" ? "starter" : sol.recommendedTier, "enterprise"]} />
        </Section>

        <Section id="faq" className="border-t">
          <Faq items={sol.faq} />
        </Section>

        {siblings.length > 0 && (
          <Section id="other" className="border-t">
            <SectionHeading eyebrow="Other" title="Not your situation?" />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {siblings.map((s) => (
                <Link
                  key={s.slug}
                  href={`/solutions/${s.slug}`}
                  className="card group flex items-center justify-between gap-4 p-5 transition-colors hover:border-[color:var(--brand-line)]"
                >
                  <span className="text-sm font-semibold">{s.nav}</span>
                  <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </Link>
              ))}
            </div>
          </Section>
        )}

        <section style={{ background: "var(--ink)" }}>
          <div className="shell py-24 text-center">
            <h2 className="h-display mx-auto max-w-3xl" style={{ color: "var(--page)" }}>
              {sol.closing.title}
            </h2>
            <p className="mx-auto mt-6 max-w-xl" style={{ color: "var(--ink-faint)" }}>{sol.closing.body}</p>
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
