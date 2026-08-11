import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Section, SectionHeading, Eyebrow } from "@/components/ui/Section";
import { ExternalLaunch } from "@/components/sections/SuiteGrid";
import { Faq } from "@/components/sections/Faq";
import { DOCUSHARE_INFO } from "@/content/docushare";

/**
 * DOCUSHARE'S OWN PAGE — bespoke, not the /suites/[id] template.
 *
 * WHY THIS FILE EXISTS. DOCUSHARE used to render through the shared
 * suite template at /suites/docushare, styled with `treatment:
 * "studio"` to at least look different from the eight real suites. The
 * page SHAPE was still a suite's: a diagnostic-flavoured hero CTA
 * slot, a hero capability strip, a "Compare LAMID DOCUSHARE vs
 * competitors" table pitched the way a product you evaluate and buy is
 * pitched. DOCUSHARE isn't evaluated and bought separately — it's the
 * record every suite already writes to, present whether or not you
 * ever open it directly. See content/docushare.ts's header comment for
 * the fuller version of this argument and the three places the site's
 * own copy already said as much before the page caught up.
 *
 * WHAT'S DIFFERENT FROM A SUITE PAGE, deliberately:
 *   · no `SUITE_DIAGNOSTIC`-style CTA ("Book a diagnostic") — the ask
 *     here is just "open the app"
 *   · no hero capability strip — three plain capability sections
 *     further down carry that instead
 *   · no dashboard-preview "slide 2" — DOCUSHARE has no diagnostic
 *     dashboard to preview; ExternalLaunch names the destination host
 *     instead, same component the studio-treatment suites use
 *   · the comparison is framed as "why not just use a shared drive"
 *     rather than a vs-competitors scorecard — the facts are the same
 *     ones the old `Suite.comparison` carried, the framing fits what
 *     DOCUSHARE actually is
 *
 * generateStaticParams for /suites/[id] no longer includes "docushare"
 * (it's not in SUITES), so the old URL 404s without help — see the
 * redirect in next.config.mjs.
 */

export const metadata: Metadata = {
  title: `${DOCUSHARE_INFO.name} — file infrastructure and secure sharing`,
  description: DOCUSHARE_INFO.subhead,
};

export default function DocuSharePage() {
  const { Icon } = DOCUSHARE_INFO;

  return (
    <>
      <Header />
      <main id="main">

        {/* ── Hero ── */}
        <section className="border-b" style={{ borderColor: "var(--line-soft)", background: `${DOCUSHARE_INFO.tint}0A` }}>
          <div className="shell py-20 sm:py-24">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-[13px] font-bold uppercase tracking-[0.14em]" style={{ color: DOCUSHARE_INFO.tint }}>
                {DOCUSHARE_INFO.eyebrow}
              </p>

              <div className="mt-3 flex items-center justify-center gap-2.5">
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-lg"
                  style={{ background: `${DOCUSHARE_INFO.tint}1A`, color: DOCUSHARE_INFO.tint }}
                >
                  <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
                </span>
                <span className="font-display text-lg">{DOCUSHARE_INFO.name}</span>
                <span className="faint rounded px-2 py-1 text-[10px] font-medium uppercase tracking-wide" style={{ border: "1px solid var(--line)" }}>
                  Opens app
                </span>
              </div>

              <h1 className="h-display mx-auto mt-7">{DOCUSHARE_INFO.headline}</h1>
              <p className="lead mx-auto mt-6 max-w-2xl">{DOCUSHARE_INFO.subhead}</p>
            </div>

            <div className="mx-auto mt-10 max-w-3xl">
              <ExternalLaunch suite={DOCUSHARE_INFO} />
            </div>
          </div>
        </section>

        {/* ── What it is — not suite #9 ── */}
        <Section id="what-it-is">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="h-section">{DOCUSHARE_INFO.whatItIs.title}</h2>
            <p className="lead mt-5">{DOCUSHARE_INFO.whatItIs.body}</p>
            <p className="font-display mt-6 text-xl" style={{ color: DOCUSHARE_INFO.tint }}>
              {DOCUSHARE_INFO.whatItIs.split}
            </p>
          </div>
        </Section>

        {/* ── Capabilities ── */}
        <Section id="capabilities" tone="tint" className="border-t">
          <SectionHeading eyebrow="What it does" title="Three jobs, one record underneath all of them." />
          <div className="grid gap-6 lg:grid-cols-3">
            {DOCUSHARE_INFO.capabilities.map((c) => (
              <div key={c.title} className="card p-7">
                <Eyebrow>{c.eyebrow}</Eyebrow>
                <h3 className="h-section mt-4 text-xl">{c.title}</h3>
                <p className="muted mt-3 text-sm leading-relaxed">{c.body}</p>
                <ul className="mt-5 space-y-2.5">
                  {c.bullets.map((b) => (
                    <li key={b} className="flex gap-2.5 text-[14px] leading-snug">
                      <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: DOCUSHARE_INFO.tint }} aria-hidden="true" />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Section>

        {/* ── Why not just use a shared drive ── */}
        <Section id="why-not-a-drive" className="border-t">
          <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-6">
              <h2 className="h-section">{DOCUSHARE_INFO.whyNotJustDrive.title}</h2>
              <p className="lead mt-5">{DOCUSHARE_INFO.whyNotJustDrive.body}</p>
            </div>
            <ul className="space-y-3 lg:col-span-5 lg:col-start-8">
              {[
                "Password, expiry and download limits on every share",
                "View analytics by geography and device",
                "Attached to the engagement record it belongs to",
                "Audit log and data classification",
                "Connectors to the storage you already use",
              ].map((row) => (
                <li key={row} className="card flex items-center gap-3 p-4 text-sm font-medium">
                  <Check className="h-4 w-4 shrink-0" style={{ color: DOCUSHARE_INFO.tint }} aria-hidden="true" />
                  {row}
                </li>
              ))}
            </ul>
          </div>
        </Section>

        {/* ── Storage & pricing ── */}
        <Section id="storage" tone="tint" className="border-t">
          <SectionHeading
            eyebrow="Storage"
            title={DOCUSHARE_INFO.storage.title}
            blurb={DOCUSHARE_INFO.storage.seatNote}
            action={<Link href="/pricing" className="link-underline text-sm">Full pricing</Link>}
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {DOCUSHARE_INFO.storage.tiers.map((t) => (
              <div key={t.plan} className="card p-6">
                <p className="font-display text-lg">{t.plan}</p>
                <p className="mt-3 text-2xl font-semibold" style={{ color: DOCUSHARE_INFO.tint }}>{t.local}</p>
                <p className="faint text-xs">local storage included</p>
                <p className="muted mt-3 text-sm">{t.cloud === "—" ? "No cloud add-on" : t.cloud}</p>
              </div>
            ))}
          </div>
          <p className="faint mt-6 text-sm">{DOCUSHARE_INFO.storage.note}</p>
        </Section>

        {/* ── FAQ ── */}
        <Section id="faq" className="border-t">
          <Faq items={DOCUSHARE_INFO.faq} title="LAMID DOCUSHARE — frequently asked questions" />
        </Section>

        {/* ── Closing ── */}
        <Section tone="ink" className="border-t">
          <div className="text-center">
            <h2 className="h-section mx-auto max-w-2xl" style={{ color: "var(--page)" }}>
              {DOCUSHARE_INFO.closing.title}
            </h2>
            <p className="lead mx-auto mt-5 max-w-2xl" style={{ color: "var(--page)", opacity: 0.78 }}>
              {DOCUSHARE_INFO.closing.body}
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <a
                href={DOCUSHARE_INFO.external.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
              >
                {DOCUSHARE_INFO.external.label}
              </a>
            </div>
          </div>
        </Section>

      </main>
      <Footer />
    </>
  );
}
