import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Section, SectionHeading, Eyebrow } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { StatRow } from "@/components/ui/Stat";
import { CORE, FINANCE, TALENT, type Suite, type UseCaseBlock } from "@/content/suites";
import { METHODS } from "@/content/methods";

export const metadata: Metadata = {
  title: "Playbooks",
  description: "How to structure a decision, design a cadence, model a cost base and read a capability gap.",
};

/**
 * Playbooks — was a stub (`SimplePage` + `appEntry`) with no content at
 * all, despite its own lead sentence already naming exactly four
 * playbooks. Built from what `suites.ts` and `methods.ts` already say —
 * no new claims, just a dedicated view of real use-case copy that
 * previously only lived on each suite's own page.
 */
type Playbook = { suite: Suite; useCase: UseCaseBlock; whyNotAverage?: string };

const chainLimited = METHODS.find((m) => m.name === "Chain-limited scoring")!.whyNotAverage;
const perSeatCoverage = METHODS.find((m) => m.name === "Per-seat coverage")!.whyNotAverage;

const PLAYBOOKS: Playbook[] = [
  { suite: CORE, useCase: CORE.useCases[0], whyNotAverage: chainLimited },
  { suite: CORE, useCase: CORE.useCases[1] },
  { suite: FINANCE, useCase: FINANCE.useCases[0] },
  { suite: TALENT, useCase: TALENT.useCases[0], whyNotAverage: perSeatCoverage },
];

function PlaybookCard({ playbook, index }: { playbook: Playbook; index: number }) {
  const { suite, useCase, whyNotAverage } = playbook;
  const { Icon } = suite;
  return (
    <article className="card p-8" style={{ ["--suite-tint" as string]: suite.tint }}>
      <div className="flex items-center gap-3">
        <span
          className="flex h-9 w-9 items-center justify-center rounded-lg"
          style={{ background: `${suite.tint}1A`, color: suite.tint }}
        >
          <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
        </span>
        <div>
          <p className="faint text-xs font-semibold tabular-nums">Playbook 0{index + 1}</p>
          <p className="text-sm font-semibold" style={{ color: suite.tint }}>{suite.name}</p>
        </div>
      </div>

      <h2 className="font-display mt-6 text-2xl">{useCase.title}</h2>
      <p className="muted mt-3 leading-relaxed">{useCase.body}</p>

      <ul className="mt-6 space-y-2.5">
        {useCase.bullets.slice(0, 4).map((b) => (
          <li key={b} className="flex gap-3 text-sm font-medium">
            <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: suite.tint }} aria-hidden="true" />
            {b}
          </li>
        ))}
      </ul>

      {whyNotAverage && (
        <p className="muted mt-6 border-t pt-5 text-sm leading-relaxed" style={{ borderColor: "var(--line-soft)" }}>
          <span className="font-semibold text-[color:var(--ink)]">Why this, not an average: </span>
          {whyNotAverage}
        </p>
      )}

      <StatRow stats={useCase.stats} className="mt-6" />

      <Link href={`/suites/${suite.id}#use-cases`} className="link-underline mt-6 inline-flex text-sm">
        See the full {suite.name} suite
      </Link>
    </article>
  );
}

export default function PlaybooksPage() {
  return (
    <>
      <Header ctaSet="neutral" />
      <main id="main">
        <section className="border-b" style={{ borderColor: "var(--line-soft)" }}>
          <div className="shell py-20">
            <div className="max-w-3xl">
              <Eyebrow>Playbooks</Eyebrow>
              <h1 className="h-display mt-6">The method behind each suite.</h1>
              <p className="lead mt-6">
                How to structure a decision, design a cadence, model a cost base and read a capability
                gap — the real method each suite runs, not a generic framework.
              </p>
            </div>
          </div>
        </section>

        <Section id="playbooks">
          <SectionHeading
            eyebrow="Four playbooks"
            title="Pick the one that matches your problem."
            blurb="Each one is the actual use case a suite runs — the same bullets, the same figures, one level closer to the method itself."
          />
          <div className="grid gap-6 lg:grid-cols-2">
            {PLAYBOOKS.map((p, i) => (
              <PlaybookCard key={`${p.suite.id}-${p.useCase.title}`} playbook={p} index={i} />
            ))}
          </div>
        </Section>

        <section style={{ background: "var(--ink)" }}>
          <div className="shell py-24 text-center">
            <h2 className="h-display mx-auto max-w-3xl" style={{ color: "var(--page)" }}>
              Run one of these on your own numbers.
            </h2>
            <p className="mx-auto mt-6 max-w-xl" style={{ color: "var(--ink-faint)" }}>
              Every playbook here is a live suite, not a document — start free and see it compute.
            </p>
            <div className="mt-10 flex justify-center gap-3">
              <Button href="/signup" variant="primary">Start free</Button>
              <Button href="/demo" variant="contrast">Book a demo</Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
