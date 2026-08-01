import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Section, Eyebrow } from "@/components/ui/Section";
import { LEGAL_DOCS, getLegalDoc } from "@/content/legal";
import { CONTACT } from "@/content/brand";

export function generateStaticParams() {
  return LEGAL_DOCS.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const doc = getLegalDoc(slug);
  if (!doc) return {};
  return { title: doc.title, description: doc.lead };
}

export default async function LegalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const doc = getLegalDoc(slug);
  if (!doc) notFound();

  const reviewed = new Date().toLocaleDateString("en-GB", { year: "numeric", month: "long" });

  return (
    <>
      <Header ctaSet="neutral" />
      <main id="main">
        <section className="border-b" style={{ borderColor: "var(--line-soft)" }}>
          <div className="shell py-20">
            <div className="max-w-3xl">
              <Eyebrow>Legal</Eyebrow>
              <h1 className="h-display mt-6">{doc.title}</h1>
              <p className="lead mt-6">{doc.lead}</p>
              <p className="faint mt-6 text-sm">Last reviewed: {reviewed}</p>
            </div>
          </div>
        </section>

        {/* Visible, not buried. A plausible-looking unreviewed policy is
            more dangerous than an obvious placeholder, because nobody
            remembers to replace the one that looks finished. */}
        <div style={{ background: "var(--brand-soft)" }}>
          <div className="shell py-5">
            <p className="max-w-3xl text-sm leading-relaxed">
              <strong className="font-semibold">Draft pending legal review.</strong>{" "}
              <span className="muted">
                This document sets out the intended structure and substance. It has not yet been
                reviewed by counsel and must not be relied on as the operative agreement. Questions
                to <a href={`mailto:${CONTACT.securityEmail}`} className="link-underline">{CONTACT.securityEmail}</a>.
              </span>
            </p>
          </div>
        </div>

        <Section>
          <div className="max-w-3xl space-y-12">
            {doc.sections.map((s) => (
              <section key={s.heading}>
                <h2 className="font-display text-2xl">{s.heading}</h2>
                <ul className="mt-5 space-y-3">
                  {s.body.map((b) => (
                    <li key={b} className="muted flex gap-3 leading-relaxed">
                      <span className="mt-[10px] h-1 w-1 shrink-0 rounded-full bg-brand" aria-hidden="true" />
                      {b}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </Section>
      </main>
      <Footer />
    </>
  );
}
