import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Section, SectionHeading, Eyebrow } from "@/components/ui/Section";
import { ADDED_FOR_SMB, SUITES_BY_ID, type SuiteId } from "@/content/suites";
import { PLATFORM_AGENTS } from "@/content/agents";

export const metadata: Metadata = { title: "What's new" };

/**
 * Release notes, organised BY WHAT THE CUSTOMER IS TRYING TO DO rather
 * than by feature or by team (teardown §7.6). A reader scanning this
 * page is asking "does this help me", not "what did engineering ship".
 */
const RELEASES = [
  {
    period: "Current release",
    goal: "Reach the small business",
    items: ADDED_FOR_SMB.map((id) => {
      const s = SUITES_BY_ID[id as SuiteId];
      return { title: `${s.name} — ${s.kind}`, body: s.subhead };
    }),
  },
  {
    period: "Current release",
    goal: "Make the AI layer legible",
    items: [
      { title: "Ten named agents", body: `Catalyst, Compass, Scout, Scribe, Cadence, Sentry, Arbiter, Vantage, Blueprint and Aide — each with a published per-outcome price rather than an unspecified "AI included".` },
      { title: "LAMID Points on the pricing page", body: "The meter that already existed in the product is now a first-class pillar, with an estimator that names the cheapest plan covering your expected volume." },
      { title: "Outcome-based billing", body: "Agents charge on a completed result. A run that fails costs nothing." },
    ],
  },
  {
    period: "Current release",
    goal: "Make the commercials honest",
    items: [
      { title: "One reconciled tier ladder", body: "Three conflicting pricing systems became one: Free, Starter, Growth, Enterprise, Concierge — with seat price following the account tier rather than the suite count." },
      { title: "The complete feature comparison", body: "Every engine and function named per tier, rather than a module count. A buyer needs to know what they can open." },
      { title: "A trust centre that lists what is not certified", body: "Including SOC 2, which we have not started. Previously the site claimed compliance we do not hold." },
    ],
  },
];

export default function WhatsNewPage() {
  return (
    <>
      <Header ctaSet="neutral" />
      <main id="main">
        <section className="border-b" style={{ borderColor: "var(--line-soft)" }}>
          <div className="shell py-20">
            <div className="max-w-3xl">
              <Eyebrow>What&rsquo;s new</Eyebrow>
              <h1 className="h-display mt-6">Grouped by what you are trying to do.</h1>
              <p className="lead mt-6">
                Not by feature, not by team. If a release does not help you do something, it does
                not need a paragraph.
              </p>
            </div>
          </div>
        </section>

        {RELEASES.map((r, i) => (
          <Section key={r.goal} className={i > 0 ? "border-t" : ""} tone={i % 2 ? "tint" : "default"}>
            <SectionHeading eyebrow={r.period} title={r.goal} />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {r.items.map((item) => (
                <div key={item.title} className="card card-interactive p-6">
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="muted mt-2.5 text-sm leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          </Section>
        ))}

        <Section className="border-t">
          <SectionHeading
            eyebrow="Agent directory"
            title={`${PLATFORM_AGENTS.length} agents currently shipping.`}
            blurb="Each with a published per-outcome cost."
          />
          <ul className="flex flex-wrap gap-2">
            {PLATFORM_AGENTS.map((a) => (
              <li key={a.id} className="rounded-lg px-3 py-2 text-sm" style={{ border: "1px solid var(--line)" }}>
                <span className="font-semibold">{a.name}</span>
                <span className="faint ml-2 text-xs">{a.points} pts</span>
              </li>
            ))}
          </ul>
        </Section>
      </main>
      <Footer />
    </>
  );
}
