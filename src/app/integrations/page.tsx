import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Section, SectionHeading, Eyebrow } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { IntegrationCard } from "@/components/integrations/IntegrationCard";
import { DashboardConnectDemo } from "@/components/integrations/DashboardConnectDemo";
import { VERIFIED_INTEGRATIONS, VERIFIED_INTEGRATION_CATEGORIES } from "@/content/platform";
import { CTA } from "@/content/brand";

export const metadata: Metadata = {
  title: "Integrations",
  description: "What's live today, and what's next — plus how to actually turn each one on.",
};

/**
 * Integrations — live vs. roadmap, not one undifferentiated list.
 *
 * This page used to render ALL of ProdLamid's integrations (Stripe,
 * SAML/SCIM, Cloudflare Turnstile, Sentry — 20 in total) as though
 * every one of them was wired into this site, because the underlying
 * data (content/platform.ts) was ProdLamid's own capability audit,
 * not this repo's. Same honest split the trust centre already uses
 * for certifications: what is real today, and what genuinely is not
 * yet, named plainly rather than folded into one confident-sounding
 * number.
 *
 * Each card expands in place to a "how to use it" explainer —
 * content/platform.ts's `howTo` field, not invented per-render. The
 * demo slide shows the one integration flow a customer can run
 * themselves today (a webhook URL pasted in Dashboard → Settings) as
 * built mockup frames rather than a recorded video, since no video
 * asset exists yet and a mockup can't drift out of sync with the real
 * component the way a recording would.
 *
 * The roadmap ("not yet") list that used to run below the directory
 * has been removed from this page by request — those entries still
 * exist in content/platform.ts as verified: false for internal
 * reference, just not rendered here.
 *
 * The directory itself is one flat grid rather than a section per
 * category: at 8 live integrations across 5 categories, several
 * categories were a single sparse row. Each card carries its own
 * category pill instead.
 */
export default function IntegrationsPage() {
  return (
    <>
      <Header ctaSet="neutral" />
      <main id="main">
        <section className="border-b" style={{ borderColor: "var(--line-soft)" }}>
          <div className="shell py-20">
            <div className="max-w-3xl">
              <Eyebrow>Integrations</Eyebrow>
              <h1 className="h-display mt-6">What&apos;s live, and what&apos;s next.</h1>
              <p className="lead mt-6">
                LAMID ONE is the operating system running four suites — CORE, GROW, TALENT and
                FINANCE — plus DESK, SIGNAL, LEARN and MARKET, on one shared record. This page is
                what connects that record to the rest of your stack: real payments, a real model
                layer, real data, and real connections to LAMID&apos;s own ecosystem apps — named
                plainly, not folded into one confident-sounding number.
              </p>
            </div>
          </div>
        </section>

        <Section id="demo" className="border-b" >
          <SectionHeading
            eyebrow="See it work"
            title="Connecting an integration, step by step."
            blurb="The webhook flow below is the one integration you can wire up yourself right now — everything else on this page is either automatic (no setup) or not built yet."
          />
          <DashboardConnectDemo />
        </Section>

        <Section id="directory">
          <SectionHeading
            eyebrow="Live directory"
            title="Everything wired in today."
            blurb={`${VERIFIED_INTEGRATIONS.length} integrations across ${VERIFIED_INTEGRATION_CATEGORIES.length} categories — open a card for how to actually turn it on.`}
          />
          <div className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {VERIFIED_INTEGRATIONS.map((i) => (
              <IntegrationCard key={i.name} integration={i} />
            ))}
          </div>
        </Section>

        <section style={{ background: "var(--ink)" }}>
          <div className="shell py-24 text-center">
            <h2 className="h-display mx-auto max-w-3xl" style={{ color: "var(--page)" }}>
              Keep your stack. Add the layer that connects it.
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
