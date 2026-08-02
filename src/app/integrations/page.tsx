import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Section, SectionHeading, Eyebrow } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { INTEGRATIONS, VERIFIED_INTEGRATIONS, VERIFIED_INTEGRATION_CATEGORIES } from "@/content/platform";
import { CTA } from "@/content/brand";

export const metadata: Metadata = {
  title: "Integrations",
  description: "What's live today, and what's next.",
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
 */
export default function IntegrationsPage() {
  const roadmap = INTEGRATIONS.filter((i) => !i.verified);

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
                {VERIFIED_INTEGRATIONS.length} integrations across {VERIFIED_INTEGRATION_CATEGORIES.length} categories
                are live in production today. The rest are named below, not hidden.
              </p>
            </div>
          </div>
        </section>

        <Section id="directory">
          <div className="space-y-12">
            {VERIFIED_INTEGRATION_CATEGORIES.map((cat) => {
              const items = VERIFIED_INTEGRATIONS.filter((i) => i.category === cat);
              return (
                <section key={cat}>
                  <div className="mb-6 flex items-baseline gap-5">
                    <h2 className="font-display text-2xl">{cat}</h2>
                    <span className="h-px flex-1" style={{ background: "var(--line)" }} aria-hidden="true" />
                    <span className="faint text-sm tabular-nums">{items.length}</span>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {items.map((i) => (
                      <div key={i.name} className="card card-interactive p-6">
                        <h3 className="font-semibold">{i.name}</h3>
                        <p className="muted mt-2 text-sm leading-relaxed">{i.what}</p>
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </Section>

        <Section id="roadmap" tone="tint" className="border-t">
          <SectionHeading
            eyebrow="Not yet"
            title="On the roadmap."
            blurb="Named because omitting them would be the misleading choice, same as the trust centre."
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {roadmap.map((i) => (
              <div key={i.name} className="card p-6 opacity-70">
                <h3 className="font-semibold">{i.name}</h3>
                <p className="muted mt-2 text-sm leading-relaxed">{i.what}</p>
              </div>
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
