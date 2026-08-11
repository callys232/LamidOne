import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Section, Eyebrow } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { Faq } from "@/components/sections/Faq";
import { HOME_FAQ } from "@/content/home";
import { PRICING_FAQ } from "@/content/pricingFaq";

export const metadata: Metadata = {
  title: "Questions and answers",
  description:
    "Everything asked most often about LAMID ONE — what it is, what it costs, how your data is handled, and how it differs from a consulting firm or a spreadsheet.",
};

/**
 * THE FULL FAQ.
 *
 * Built because the homepage's FAQ section needed a "see all questions"
 * destination and there was none — every FAQ on this site was scoped to
 * the page it sat on (pricing, trust, a suite, a use case), so a reader
 * with a question outside the one they were looking at had nowhere to
 * go but search.
 *
 * NOTHING IS WRITTEN HERE. Both groups are the existing content files
 * rendered in full, so an answer corrected on the pricing page is
 * corrected here in the same commit. A page that restated them in its
 * own words would be a second set of answers to keep in sync, and the
 * two would disagree within a release.
 *
 * GROUPED, NOT MERGED. The two sets answer different kinds of question
 * — what the product is, versus what it costs — and a reader arriving
 * from the pricing page should be able to skip the first half.
 */
export default function FaqsPage() {
  return (
    <>
      <Header />
      <main id="main">
        <section className="border-b" style={{ borderColor: "var(--line-soft)" }}>
          <div className="shell py-20">
            <div className="max-w-3xl">
              <Eyebrow>Questions and answers</Eyebrow>
              <h1 className="h-display mt-6">Everything we get asked.</h1>
              <p className="lead mt-6">
                The product, the pricing, the data handling, and the two comparisons people
                actually make — a consulting firm and a spreadsheet. If yours is not here,
                support will answer it.
              </p>
            </div>
          </div>
        </section>

        <Section id="general">
          <Faq items={HOME_FAQ} title="About the platform" />
        </Section>

        <Section id="pricing" tone="tint" className="border-t">
          <Faq items={PRICING_FAQ} title="Pricing, points and billing" />
        </Section>

        <Section id="more" className="border-t">
          <div className="max-w-2xl">
            <h2 className="h-section">Still unanswered?</h2>
            <p className="lead mt-5">
              The playbooks go a level deeper — the method behind each suite, and what running
              one actually looks like. Anything else, support answers directly.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Button href="/playbooks" variant="primary">
                Read the playbooks
              </Button>
              <Button href="/support" variant="secondary">
                Contact support
              </Button>
            </div>
          </div>
        </Section>
      </main>
      <Footer />
    </>
  );
}
