import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Section, SectionHeading, Eyebrow } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { INTEGRATIONS, INTEGRATION_CATEGORIES } from "@/content/platform";
import { CTA } from "@/content/brand";

export const metadata: Metadata = {
  title: "Integrations",
  description: "Payments, identity, storage, documents, AI and the wider LAMID ecosystem.",
};

/**
 * Integrations — a risk-reducer, not a feature.
 *
 * The buyer's objection is "I would have to rip out my stack". This
 * page says no. It gets a compact treatment because it only needs to
 * defuse an objection, not sell (teardown §6).
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
              <h1 className="h-display mt-6">Works with what you already run.</h1>
              <p className="lead mt-6">
                {INTEGRATIONS.length} integrations across {INTEGRATION_CATEGORIES.length} categories.
                You do not have to migrate anything to start.
              </p>
            </div>
          </div>
        </section>

        <Section id="directory">
          <div className="space-y-12">
            {INTEGRATION_CATEGORIES.map((cat) => {
              const items = INTEGRATIONS.filter((i) => i.category === cat);
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

        <Section id="api" tone="tint" className="border-t">
          <SectionHeading
            eyebrow="Build on it"
            title="A REST API, webhooks and SDKs."
            blurb="Read access from Growth, read and write on Enterprise. DocuShare exposes its own file API and webhooks."
          />
          <Button href="/developers" variant="ghost">Developer documentation</Button>
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
