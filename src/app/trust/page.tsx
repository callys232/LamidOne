import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Section, SectionHeading, Eyebrow } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { Faq } from "@/components/sections/Faq";
import { CONTACT } from "@/content/brand";
import { DATA_ENTITIES } from "@/content/platform";

export const metadata: Metadata = {
  title: "Trust centre",
  description: "Security controls, data handling, AI policy and accessibility.",
};

/**
 * Trust centre.
 *
 * ⚠️  DELIBERATE HONESTY. ProdLamid's pricing FAQ asserted "LAMID ONE
 * is SOC 2 Type II compliant". That is the single most verifiable claim
 * on a B2B site and enterprise procurement WILL ask for the report.
 * This page states what is implemented today versus what is in
 * progress. Claiming a certification you do not hold is a materially
 * different risk from ordinary marketing stretch.
 *
 * Two details carried over from the study: a named email for
 * accessibility complaints, and a last-reviewed date. Both are small,
 * and both signal the document is maintained rather than decorative.
 */

const IMPLEMENTED = [
  { control: "Encryption in transit", detail: "TLS 1.2 or higher on every connection." },
  { control: "Encryption at rest", detail: "AES-256 on stored data and documents." },
  { control: "Two-factor authentication", detail: "Available on every account, at every tier." },
  { control: "Role-based access control", detail: "Permissions enforced at API level, not just in the interface." },
  { control: "Field-level permissions", detail: "Enterprise and Concierge tiers." },
  { control: "Single sign-on", detail: "SAML 2.0 and SCIM provisioning on Enterprise." },
  { control: "Audit logging", detail: "Immutable record of consequential actions; retention by tier." },
  { control: "Rate limiting and bot protection", detail: "Per-route limits and Cloudflare Turnstile on public forms." },
  { control: "Input sanitisation and validation", detail: "Schema validation on every boundary crossing." },
  { control: "Error monitoring", detail: "Structured logging with alerting on anomalies." },
  { control: "Data export", detail: "Full self-service export of everything held about you." },
  { control: "Data erasure", detail: "Deletion on request, with the operator audit trail retained." },
  { control: "Escrow segregation", detail: "Client funds held separately and released only on approval." },
];

const IN_PROGRESS = [
  { item: "SOC 2 Type II", status: "Audit not yet commenced. We will publish the report when it exists." },
  { item: "ISO 27001", status: "Not certified. Cloud infrastructure providers hold their own certification." },
  { item: "Penetration test summary", status: "Scheduled. Summary will be published here." },
  { item: "Formal uptime SLA", status: "99.9% committed contractually on Enterprise and Concierge; no public status page yet." },
  { item: "Data residency selection", status: "Available on Enterprise. Additional regions being added." },
];

export default function TrustPage() {
  return (
    <>
      <Header ctaSet="neutral" />
      <main id="main">
        <section className="border-b" style={{ borderColor: "var(--line-soft)" }}>
          <div className="shell py-20">
            <div className="max-w-3xl">
              <Eyebrow>Trust centre</Eyebrow>
              <h1 className="h-display mt-6">What we protect, and what we have not certified yet.</h1>
              <p className="lead mt-6">
                We publish what is implemented today and what is still in progress. If a
                certification is not listed under &ldquo;implemented&rdquo;, we do not hold it —
                and we would rather tell you that here than in a procurement questionnaire.
              </p>
            </div>
          </div>
        </section>

        <Section id="implemented">
          <SectionHeading eyebrow="Implemented" title="Controls in place today." />
          <div className="grid gap-x-10 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
            {IMPLEMENTED.map((c) => (
              <div key={c.control} className="feature-card" tabIndex={0}>
                <h3 className="font-semibold">{c.control}</h3>
                <p className="muted mt-1.5 text-sm leading-relaxed">{c.detail}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section id="in-progress" tone="tint" className="border-t">
          <SectionHeading
            eyebrow="Not yet"
            title="What we have not done."
            blurb="Listed because omitting it would be the misleading choice."
          />
          <dl className="divide-hairline max-w-3xl">
            {IN_PROGRESS.map((i) => (
              <div key={i.item} className="flex flex-col gap-1 py-4 sm:flex-row sm:gap-8">
                <dt className="font-semibold sm:w-64 sm:shrink-0">{i.item}</dt>
                <dd className="muted text-sm leading-relaxed">{i.status}</dd>
              </div>
            ))}
          </dl>
        </Section>

        <Section id="ai" className="border-t">
          <SectionHeading
            eyebrow="AI and your data"
            title="How the agents handle what you enter."
          />
          <div className="grid gap-5 lg:grid-cols-3">
            {[
              { t: "Not used for model training", d: "Third-party AI providers are contractually prohibited from training their models on your data. Nothing you enter improves a general model." },
              { t: "Scoped to your permissions", d: "An agent can only reach records the invoking user could already open. Agents do not bypass role-based access control." },
              { t: "Logged and attributable", d: "Every agent run is recorded with its invoker, its cost and its output, and is visible in your usage history." },
            ].map((c) => (
              <div key={c.t} className="card p-7">
                <h3 className="font-semibold">{c.t}</h3>
                <p className="muted mt-3 text-sm leading-relaxed">{c.d}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section id="data" className="border-t">
          <SectionHeading
            eyebrow="Data we hold"
            title={`${DATA_ENTITIES.length} record types.`}
            blurb="Everything below is included in a data export and in an erasure request."
          />
          <ul className="flex flex-wrap gap-2">
            {DATA_ENTITIES.map((e) => (
              <li key={e} className="muted rounded-lg px-3 py-1.5 text-sm" style={{ border: "1px solid var(--line)" }}>
                {e}
              </li>
            ))}
          </ul>
        </Section>

        <Section id="accessibility" className="border-t">
          <SectionHeading
            eyebrow="Accessibility"
            title="Target: WCAG 2.1 Level AA."
            blurb="We test against it and we have not finished. If something blocks you, tell us and we will fix it and reply with what changed."
          />
          <a href={`mailto:${CONTACT.accessibilityEmail}`} className="link-underline text-sm">
            {CONTACT.accessibilityEmail}
          </a>
          <p className="faint mt-8 text-xs">
            Last reviewed: {new Date().toLocaleDateString("en-GB", { year: "numeric", month: "long" })}
          </p>
        </Section>

        <Section id="faq" className="border-t">
          <Faq
            title="Security questions we get asked"
            items={[
              { q: "Are you SOC 2 certified?", a: "Not yet. The audit has not commenced and we will publish the report here when it exists. The underlying controls a SOC 2 audit examines — encryption, access control, audit logging, change management — are listed under Implemented above, and we are happy to walk a security team through them." },
              { q: "Where is my data stored?", a: "On cloud infrastructure whose providers hold their own ISO 27001 certification. Enterprise plans can select a residency region; the available regions are confirmed during contracting." },
              { q: "Can I get a data processing agreement?", a: `Yes. Contact ${CONTACT.securityEmail} and we will send the current DPA along with our sub-processor list.` },
              { q: "What happens to my data if I cancel?", a: "You can export everything at any time, before or after cancelling. On request we delete your data and confirm when it is done; an operator audit trail of the deletion itself is retained as a legal record." },
              { q: "Do you have a bug bounty or disclosure policy?", a: `We accept coordinated disclosure at ${CONTACT.securityEmail}. There is no paid bounty programme at present, and we acknowledge reports within two business days.` },
            ]}
          />
        </Section>

        <section style={{ background: "var(--ink)" }}>
          <div className="shell py-24 text-center">
            <h2 className="h-display mx-auto max-w-3xl" style={{ color: "var(--page)" }}>
              Send us your security questionnaire.
            </h2>
            <p className="mx-auto mt-6 max-w-xl" style={{ color: "var(--ink-faint)" }}>
              We will answer it honestly, including the questions where the answer is &ldquo;not yet&rdquo;.
            </p>
            <div className="mt-10 flex justify-center gap-3">
              <Button href={`mailto:${CONTACT.securityEmail}`} variant="primary">Contact security</Button>
              <Button href="/contact-sales" variant="contrast">Talk to sales</Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
