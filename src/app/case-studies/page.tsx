import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { Section, SectionHeading, Eyebrow } from "@/components/ui/Section";
import { CaseStudyRail, CASE_STUDIES } from "@/components/sections/CaseStudyRail";

export const metadata: Metadata = {
  title: "Case studies",
  description: "Named organisations with figures they have verified.",
};

/**
 * Case studies.
 *
 * Ships empty on purpose. The standard is a named person, their role,
 * their organisation and a figure they stand behind — because
 * attribution completeness is the entire difference between a
 * testimonial and a quote. Until one clears that bar, this page says so
 * rather than filling the space with anonymous praise.
 */
export default function CaseStudiesPage() {
  return (
    <>
      <Header ctaSet="neutral" />
      <main id="main">
        <section className="border-b" style={{ borderColor: "var(--line-soft)" }}>
          <div className="shell py-20">
            <div className="max-w-3xl">
              <Eyebrow>Case studies</Eyebrow>
              <h1 className="h-display mt-6">Named organisations. Numbers they verified.</h1>
              <p className="lead mt-6">
                We publish a case study when a customer will put their name, their role and a
                specific figure behind it. Anything less is an advert wearing a customer&rsquo;s
                clothes.
              </p>
            </div>
          </div>
        </section>

        <Section>
          <CaseStudyRail studies={CASE_STUDIES} />
        </Section>

        <Section className="border-t">
          <SectionHeading
            eyebrow="Our standard"
            title="What has to be true before we publish one."
          />
          <ol className="max-w-3xl space-y-5">
            {[
              "A named person, with their real role and organisation. Not 'a client in financial services'.",
              "A figure the customer has verified and is willing to have quoted back to them.",
              "A stated time window or comparison base — '40% faster' means nothing without 'than what, over what period'.",
              "Written approval to publish, on the record, which we keep.",
              "Anything we could not verify is left out rather than softened into vagueness.",
            ].map((s, i) => (
              <li key={s} className="flex gap-5">
                <span className="font-display text-2xl text-brand tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                <span className="muted leading-relaxed">{s}</span>
              </li>
            ))}
          </ol>
        </Section>

        <section style={{ background: "var(--ink)" }}>
          <div className="shell py-24 text-center">
            <h2 className="h-display mx-auto max-w-3xl" style={{ color: "var(--page)" }}>
              Want to be the first one?
            </h2>
            <p className="mx-auto mt-6 max-w-xl" style={{ color: "var(--ink-faint)" }}>
              Early customers get direct access to the team building the engines they use.
            </p>
            <div className="mt-10 flex justify-center gap-3">
              <Button href="/contact" variant="primary">Talk to us</Button>
              <Button href="/signup" variant="contrast">Start free</Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
