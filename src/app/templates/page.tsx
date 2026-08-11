import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Section, SectionHeading, Eyebrow } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Templates",
  description: "Decision records, budget models, cadence reviews and engagement briefs. No account needed.",
};

/**
 * Templates — was a stub (`SimplePage` + `appEntry`) whose own lead
 * promised "no account needed", while the page itself was a sign-up
 * wall. Each structure below is the real field set the corresponding
 * suite already runs on (see suites.ts's CORE, FINANCE and MARKET use
 * cases) — visible in full on this page, with the account only needed
 * to save one against a live engagement.
 */
type TemplateField = { label: string; hint: string };
type Template = {
  name: string;
  suite: string;
  suiteHref: string;
  tint: string;
  summary: string;
  fields: TemplateField[];
};

const TEMPLATES: Template[] = [
  {
    name: "Decision record",
    suite: "LAMID CORE",
    suiteHref: "/suites/core#use-cases",
    tint: "#1A7CFF",
    summary: "The structure CORE's decision intelligence runs on — map it once, and the rationale stays attached to the outcome permanently.",
    fields: [
      { label: "Decision statement", hint: "The single choice being made, written as a sentence — not the problem behind it." },
      { label: "Options considered", hint: "Every option that was genuinely on the table, including the one you rejected." },
      { label: "Weighted factors", hint: "What mattered, and how much — the same factors and weightings a board would check." },
      { label: "Owner", hint: "The one person who owns the outcome. A decision without an owner is the failure this record exists to catch." },
      { label: "Rationale", hint: "Why the chosen option won against the weighted factors — kept attached, not summarised from memory later." },
      { label: "Date and review point", hint: "When it was made, and when it should be revisited if the assumptions change." },
    ],
  },
  {
    name: "Budget model",
    suite: "LAMID FINANCE",
    suiteHref: "/suites/finance#use-cases",
    tint: "#1A7CFF",
    summary: "The same line structure the FINANCE budgeting engine recalculates live — overhead, contingency and tax shown, never estimated by a model.",
    fields: [
      { label: "Line items", hint: "Every costed line for the project or period, itemised rather than bundled." },
      { label: "Overhead %", hint: "Applied to the line total — recalculates automatically as lines change." },
      { label: "Contingency %", hint: "Set against risk, not a flat guess — shown as its own line, not folded into overhead." },
      { label: "Tax", hint: "Applied last, on the overhead- and contingency-adjusted total." },
      { label: "Budget total", hint: "The arithmetic result of every line above — exportable, not just displayed." },
      { label: "Actual vs. budget", hint: "Tracked per line against real spend, so drift shows up before the period closes." },
    ],
  },
  {
    name: "Cadence review",
    suite: "LAMID CORE",
    suiteHref: "/suites/core#use-cases",
    tint: "#1A7CFF",
    summary: "What CORE's operating-rhythm mapping checks for every unit — the real delivery pace against the planned one, not the pace in the deck.",
    fields: [
      { label: "Team or unit", hint: "The group whose cadence is being reviewed." },
      { label: "Planned cadence", hint: "The rhythm the plan assumes — sprint length, release cycle, review interval." },
      { label: "Actual cadence", hint: "The rhythm the team is genuinely running at, measured, not reported." },
      { label: "Drift", hint: "The gap between planned and actual, named plainly rather than smoothed into an average." },
      { label: "Who's notified", hint: "The owner alerted the moment drift crosses the threshold — not at the next scheduled review." },
      { label: "Next check-in", hint: "When this gets reviewed again." },
    ],
  },
  {
    name: "Engagement brief",
    suite: "LAMID MARKET",
    suiteHref: "/suites/market#use-cases",
    tint: "#1A7CFF",
    summary: "The fields MARKET's matching actually runs on — industry, challenge type, budget, timeline and working style — plus the milestone structure every engagement delivers against.",
    fields: [
      { label: "Discipline / challenge type", hint: "What kind of expertise the brief needs — the primary match signal." },
      { label: "Budget", hint: "What you're able to commit — matched against, not negotiated blind." },
      { label: "Timeline", hint: "When the work needs to start and land." },
      { label: "Working style", hint: "How you want to work — embedded, async, fixed cadence." },
      { label: "Milestones", hint: "The deliverables that gate payment, one at a time, each with its own approval." },
      { label: "Deliverable definition", hint: "What 'done' means for each milestone, stated before work starts." },
    ],
  },
];

function TemplateCard({ t }: { t: Template }) {
  return (
    <article className="card p-8" style={{ ["--suite-tint" as string]: t.tint }}>
      <p className="text-sm font-semibold" style={{ color: t.tint }}>{t.suite}</p>
      <h2 className="font-display mt-2 text-2xl">{t.name}</h2>
      <p className="muted mt-3 leading-relaxed">{t.summary}</p>

      <dl className="mt-6 divide-y" style={{ borderColor: "var(--line-soft)" }}>
        {t.fields.map((f) => (
          <div key={f.label} className="py-3.5 first:pt-0">
            <dt className="text-sm font-semibold">{f.label}</dt>
            <dd className="muted mt-1 text-sm leading-relaxed">{f.hint}</dd>
          </div>
        ))}
      </dl>

      <Button href={t.suiteHref} variant="ghost" className="mt-6">Use this in {t.suite}</Button>
    </article>
  );
}

export default function TemplatesPage() {
  return (
    <>
      <Header ctaSet="neutral" />
      <main id="main">
        <section className="border-b" style={{ borderColor: "var(--line-soft)" }}>
          <div className="shell py-20">
            <div className="max-w-3xl">
              <Eyebrow>Templates</Eyebrow>
              <h1 className="h-display mt-6">Working templates, free.</h1>
              <p className="lead mt-6">
                Decision records, budget models, cadence reviews and engagement briefs — the full
                field structure, visible below, no account needed to read it.
              </p>
            </div>
          </div>
        </section>

        <Section id="templates">
          <SectionHeading
            eyebrow="Four templates"
            title="The same structure the live engine runs on."
            blurb="Fill these in on paper, or open the suite and let it compute against them directly."
          />
          <div className="grid gap-6 lg:grid-cols-2">
            {TEMPLATES.map((t) => <TemplateCard key={t.name} t={t} />)}
          </div>
        </Section>

        <section style={{ background: "var(--ink)" }}>
          <div className="shell py-24 text-center">
            <h2 className="h-display mx-auto max-w-3xl" style={{ color: "var(--page)" }}>
              Ready to let the engine do the arithmetic?
            </h2>
            <p className="mx-auto mt-6 max-w-xl" style={{ color: "var(--ink-faint)" }}>
              Every template here maps to a live suite. Start free and fill it in there instead.
            </p>
            <div className="mt-10 flex justify-center gap-3">
              <Button href="/signup" variant="primary">Start free</Button>
              <Button href="/playbooks" variant="contrast">See the playbooks</Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
