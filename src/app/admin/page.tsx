import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Section, SectionHeading, Eyebrow } from "@/components/ui/Section";
import { ADMIN_MODULES } from "@/content/platform";
import { ADMIN_AGENTS } from "@/content/agents";

export const metadata: Metadata = {
  title: "Operator console",
  robots: { index: false, follow: false },
};

/**
 * OPERATOR CONSOLE — the admin surface.
 *
 * Documented here so the rebuild does not lose it. Nineteen modules
 * carried over from ProdLamid's admin components and API routes.
 *
 * Deliberately:
 *  · `noindex` — this is not a marketing page.
 *  · Not linked from the nav or footer. Operators reach it directly;
 *    listing it publicly only advertises an attack surface.
 *  · `admin` is a ROLE, not a purchasable tier, and does not appear in
 *    any pricing table.
 */
export default function AdminPage() {
  return (
    <>
      <Header ctaSet="neutral" />
      <main id="main">
        <section className="border-b" style={{ borderColor: "var(--line-soft)" }}>
          <div className="shell py-20">
            <div className="max-w-3xl">
              <Eyebrow>Operator console</Eyebrow>
              <h1 className="h-display mt-6">Platform operations.</h1>
              <p className="lead mt-6">
                {ADMIN_MODULES.length} modules covering escrow, verification, finance, accounts,
                governance and outreach. Access is role-gated and every action is written to the
                audit log.
              </p>
            </div>
          </div>
        </section>

        <Section>
          <SectionHeading
            eyebrow="Modules"
            title="Everything the operations team runs."
            blurb="Each module maps to existing API routes and components rather than being rebuilt."
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ADMIN_MODULES.map((m) => (
              <div key={m.name} className="card card-interactive p-6">
                <h3 className="font-semibold">{m.name}</h3>
                <p className="muted mt-2 text-sm leading-relaxed">{m.description}</p>
                <ul className="faint mt-4 space-y-1 font-mono text-[11px]">
                  {m.backedBy.map((b) => <li key={b}>{b}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </Section>

        <Section className="border-t">
          <SectionHeading
            eyebrow="Operator agents"
            title="Two agents that serve the platform, not a customer."
            blurb="Never metered and never billed to an account."
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:max-w-3xl">
            {ADMIN_AGENTS.map((a) => (
              <div key={a.id} className="card card-interactive p-6">
                <a.Icon className="faint h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
                <h3 className="mt-4 font-display text-xl">{a.name}</h3>
                <p className="faint text-xs">{a.role}</p>
                <p className="muted mt-3 text-sm leading-relaxed">{a.what}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section className="border-t">
          <div className="card max-w-2xl p-8">
            <h2 className="font-display text-xl">The console itself lives in the application.</h2>
            <p className="muted mt-3 leading-relaxed">
              This page is the module inventory. The working console is behind authentication and
              role checks, wired to the existing admin routes — it is not reimplemented on the
              marketing surface.
            </p>
          </div>
        </Section>
      </main>
      <Footer />
    </>
  );
}
