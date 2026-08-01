import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { Section, SectionHeading, Eyebrow } from "@/components/ui/Section";
import { ComparisonTable } from "@/components/sections/ComparisonTable";
import { Faq } from "@/components/sections/Faq";
import { HOME_COMPARISON } from "@/content/home";
import { SUITES } from "@/content/suites";
import { CTA } from "@/content/brand";

export const metadata: Metadata = {
  title: "Compare alternatives",
  description: "LAMID ONE against consultants, spreadsheets, point tools and freelance marketplaces.",
};

/**
 * Comparison library.
 *
 * Note the deliberate split from the per-suite tables: those compare
 * against CATEGORIES ("point solutions", "legacy CRM") because that
 * ages without maintenance and is legally safer. This page is where
 * category-level comparison lives at greater depth. Named-vendor pages
 * would go here too — their job is search capture, which is a different
 * job from the on-page comparison (teardown §7.9).
 */
export default function ComparePage() {
  const suiteTables = SUITES.filter((s) => ["core", "finance", "talent", "desk", "market"].includes(s.id));

  return (
    <>
      <Header ctaSet="neutral" />
      <main id="main">
        <section className="border-b" style={{ borderColor: "var(--line-soft)" }}>
          <div className="shell py-20">
            <div className="max-w-3xl">
              <Eyebrow>Compare</Eyebrow>
              <h1 className="h-display mt-6">How we compare, including where we do not win.</h1>
              <p className="lead mt-6">
                Every table below has a middle column state for &ldquo;partial&rdquo;. A comparison
                where the alternative scores zero on every row is not a comparison, it is an advert.
              </p>
            </div>
          </div>
        </section>

        <Section id="platform">
          <ComparisonTable {...HOME_COMPARISON} />
        </Section>

        {suiteTables.map((s, i) => (
          <Section key={s.id} id={s.id} className="border-t" tone={i % 2 ? "tint" : "default"}>
            <div className="mb-6 flex items-center gap-3">
              <s.Icon className="h-5 w-5" style={{ color: s.tint }} aria-hidden="true" />
              <Link href={`/suites/${s.id}`} className="link-underline text-sm">{s.name}</Link>
            </div>
            <ComparisonTable {...s.comparison} />
          </Section>
        ))}

        <Section id="faq" className="border-t">
          <Faq
            title="Questions about the comparison"
            items={[
              { q: "Why do you not name specific competitors?", a: "Because category comparisons age better and let every reader substitute the vendor they actually use. Naming a competitor also means maintaining an accurate claim about a product that changes without telling us — and getting it wrong is worse than not making the claim." },
              { q: "Where is a spreadsheet genuinely better?", a: "For a one-off calculation nobody else needs to see, a spreadsheet is faster and free. The trade only becomes worthwhile when more than one person relies on the number, or when you need to reproduce how it was built." },
              { q: "Where is a consulting firm genuinely better?", a: "When you need a single deliverable once, when you need an independent opinion for a board or regulator, or when the work needs someone in the room with authority. We are not a substitute for any of those." },
              { q: "What if we already run a mature enterprise stack?", a: "Then DESK and TALENT will duplicate your CRM and HRIS and you should not buy them. CORE and FINANCE may still add something, because decision records and computed modelling are not usually covered by either." },
            ]}
          />
        </Section>

        <section style={{ background: "var(--ink)" }}>
          <div className="shell py-24 text-center">
            <h2 className="h-display mx-auto max-w-3xl" style={{ color: "var(--page)" }}>
              Test the claim on your own data.
            </h2>
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
