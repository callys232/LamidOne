import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Section, SectionHeading, Eyebrow } from "@/components/ui/Section";
import { Button, CtaPair } from "@/components/ui/Button";
import { ComparisonTable } from "@/components/sections/ComparisonTable";
import { Faq } from "@/components/sections/Faq";
import {
  PLATFORM_AGENTS, ADMIN_AGENTS, POINTS_EXPLAINER, outcomeCost,
  AGENT_COUNT, AGENT_COUNT_WORD, numberWord,
} from "@/content/agents";
import { SUITES_BY_ID, type SuiteId } from "@/content/suites";
import { CTA } from "@/content/brand";
import { PRIMARY_SUITES, primarySuiteForSuite } from "@/content/aios";
import { AgentMock } from "@/components/mock/ProductMock";

export const metadata: Metadata = {
  title: "LAMID Agents",
  description:
    "Eleven AI agents across the platform, charged per completed outcome. A run that fails costs nothing.",
};

/**
 * Agent directory.
 *
 * "Pay for work delivered" appears as a CAPABILITY on the comparison
 * table, not as a billing footnote — pricing model as competitive
 * differentiator (teardown §7.10 #3). It only works because the model
 * is honest enough to survive the claim.
 *
 * AI trust is answered inline and ABOVE pricing, because for an AI
 * product it is a purchase blocker rather than a compliance footnote.
 */
export default function AgentsPage() {
  return (
    <>
      <Header />
      <main id="main">
        <section className="border-b" style={{ borderColor: "var(--line-soft)" }}>
          <div className="shell py-20">
            <div className="max-w-3xl">
              <Eyebrow>LAMID Agents</Eyebrow>
              <h1 className="h-display mt-6">
                {AGENT_COUNT_WORD} agents that work on your own records<span className="text-brand">.</span>
              </h1>
              <p className="lead mt-6">
                Every agent is grounded in the data already in your engines — not in a general
                model&apos;s guess about your business. You pay per completed outcome, so a run that
                fails costs you nothing.
              </p>

              {/* Which primary suite each agent serves, counted from the
                  data rather than asserted. This is the human-AI
                  partnership the four-suite story rests on, made
                  countable: the agents are not a separate product bolted
                  alongside the suites, they are how each suite does its
                  work. */}
              <ul className="mt-8 flex flex-wrap gap-x-7 gap-y-3">
                {PRIMARY_SUITES.map((e) => {
                  const count = PLATFORM_AGENTS.filter(
                    (a) => primarySuiteForSuite(a.suite)?.id === e.id,
                  ).length;
                  /* GROW currently has none. Reported rather than
                     hidden — the same discipline as the trust centre,
                     which lists what is not certified. Set faint and
                     worded as "none yet" so it reads as a stated fact
                     rather than a chip that failed to load. */
                  return (
                    <li
                      key={e.id}
                      className={`flex items-center gap-2.5 text-sm ${count === 0 ? "faint" : ""}`}
                    >
                      <span
                        className="h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ background: e.tint, opacity: count === 0 ? 0.4 : 1 }}
                        aria-hidden="true"
                      />
                      {count === 0 ? (
                        <span>none yet in {e.name.replace("LAMID ", "")}</span>
                      ) : (
                        <>
                          <span className="font-semibold tabular-nums">{count}</span>
                          <span className="muted">in {e.name.replace("LAMID ", "")}</span>
                        </>
                      )}
                    </li>
                  );
                })}
              </ul>

              <CtaPair primary={CTA.primary} secondary={CTA.secondary} className="mt-9" />
            </div>

            <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <AgentMock
                agent="Catalyst"
                role="Diagnostic agent"
                prompt="Score decision quality for the operations function."
                lines={[
                  "Decision clarity — 68 / 100",
                  "Authority ambiguity in 3 of 11 decisions",
                  "Cadence drift between Ops and Delivery",
                ]}
                cost="40 pts · ≈ $2.80"
              />
              <AgentMock
                agent="Compass"
                role="Expert matching agent"
                prompt="Find three experts for a post-merger integration in financial services."
                lines={[
                  "6 matched on discipline and sector",
                  "Ranked by engagement history and fit",
                  "Median availability — 9 days",
                ]}
                cost="30 pts · ≈ $2.10"
              />
              <AgentMock
                agent="Arbiter"
                role="Dispute resolution agent"
                prompt="Milestone 3 rejected. Assemble the evidence."
                lines={[
                  "Deliverable compared against agreed scope",
                  "4 of 5 acceptance criteria met",
                  "Proposed: partial release, revise criterion 5",
                ]}
                cost="80 pts · ≈ $5.60"
              />
            </div>
          </div>
        </section>

        <Section id="directory">
          <SectionHeading
            eyebrow="The directory"
            title="Every agent, what it does, and what it costs."
            blurb="Costs are in LAMID Points and charged only on a completed outcome."
          />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead>
                <tr style={{ background: "var(--line-soft)" }}>
                  <th scope="col" className="px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.12em]">Agent</th>
                  <th scope="col" className="px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.12em]">Engine</th>
                  <th scope="col" className="px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.12em]">Suite</th>
                  <th scope="col" className="px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.12em]">Billed</th>
                  <th scope="col" className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.12em]">Cost</th>
                  <th scope="col" className="px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.12em]">From</th>
                </tr>
              </thead>
              <tbody>
                {PLATFORM_AGENTS.map((a) => {
                  const suite = SUITES_BY_ID[a.suite as SuiteId];
                  const primarySuite = primarySuiteForSuite(a.suite);
                  return (
                    <tr key={a.id} className="border-b" style={{ borderColor: "var(--line-soft)" }}>
                      <th scope="row" className="px-5 py-4 font-normal">
                        <span className="flex items-start gap-2.5">
                          <a.Icon className="mt-1 h-4 w-4 shrink-0 text-brand" strokeWidth={1.75} aria-hidden="true" />
                          <span>
                            <span className="font-display text-base">{a.name}</span>
                            <span className="faint ml-2 text-xs">{a.role}</span>
                            <span className="muted mt-1 block text-xs leading-snug">{a.what}</span>
                          </span>
                        </span>
                      </th>
                      <td className="px-5 py-4">
                        {primarySuite && (
                          <span className="flex items-center gap-2 text-xs">
                            <span
                              className="h-1.5 w-1.5 shrink-0 rounded-full"
                              style={{ background: primarySuite.tint }}
                              aria-hidden="true"
                            />
                            <span className="font-semibold">{primarySuite.value}</span>
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        {suite && (
                          <Link href={`/suites/${suite.id}`} className="muted text-xs hover:text-brand">
                            {suite.name}
                          </Link>
                        )}
                      </td>
                      <td className="muted px-5 py-4 text-xs">{a.unit}</td>
                      <td className="px-5 py-4 text-right tabular-nums">
                        <span className="font-semibold text-brand">{a.points} pts</span>
                        <span className="faint block text-xs">≈ ${outcomeCost(a.points).toFixed(2)}</span>
                      </td>
                      <td className="muted px-5 py-4 text-xs capitalize">{a.minTier}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="faint mt-6 text-xs">{POINTS_EXPLAINER.footnote}</p>
        </Section>

        {/* Trust — above pricing, deliberately. */}
        <Section id="trust" tone="tint" className="border-t">
          <SectionHeading
            eyebrow="Trust"
            title="Easy to use, and easy to check."
            blurb="For an AI product these are purchase questions, not compliance footnotes — so they are answered here rather than in a policy page."
          />
          <div className="grid gap-5 lg:grid-cols-3">
            {[
              { t: "Your data is not training data", d: "Third-party AI providers are contractually prohibited from training their models on your data. Nothing you enter improves a general model." },
              { t: "You control what each agent can reach", d: "Agent access is scoped to the records the invoking user can already see. Role-based permissions apply to agents exactly as they apply to people." },
              { t: "Every run is logged and priced openly", d: "Each invocation is recorded with its cost and its output. You can audit what ran, who ran it, and what it produced." },
            ].map((c) => (
              <div key={c.t} className="card card-interactive p-7">
                <h3 className="font-semibold">{c.t}</h3>
                <p className="muted mt-3 text-sm leading-relaxed">{c.d}</p>
              </div>
            ))}
          </div>
          <Link href="/trust" className="link-underline mt-8 inline-flex text-sm">Read the trust centre</Link>
        </Section>

        <Section id="compare" className="border-t">
          <ComparisonTable
            headline="Built on your records. Not on a general guess."
            blurb="Not all AI is built the same. The difference is whether it can see your actual data, and whether you pay when it fails."
            columns={["LAMID Agents", "Generic AI assistants", "Bolt-on AI features"]}
            rows={[
              { capability: "Grounded in your own organisational records", values: [true, false, "partial"] },
              { capability: "Scoped by your existing permissions", values: [true, false, "partial"] },
              { capability: "Pay for work delivered, not per attempt", values: [true, false, false] },
              { capability: "Output attached to the engagement record", values: [true, false, "partial"] },
              { capability: "Usable without a consultant or setup project", values: [true, true, "partial"] },
              { capability: "Full audit trail of every run", values: [true, false, "partial"] },
            ]}
          />
        </Section>

        <Section id="operator" className="border-t">
          <SectionHeading
            eyebrow="Operator agents"
            title="Two more that run the platform, not your account."
            blurb="Listed for completeness. These are internal operations tooling and are never billed to a customer."
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:max-w-3xl">
            {ADMIN_AGENTS.map((a) => (
              <div key={a.id} className="card card-interactive p-6">
                <a.Icon className="faint h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
                <h3 className="mt-4 font-display text-xl">{a.name}</h3>
                <p className="faint text-xs">{a.role}</p>
                <p className="muted mt-3 text-sm leading-relaxed">{a.what}</p>
                <p className="faint mt-4 text-xs">{a.unit}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section id="faq" className="border-t">
          <Faq
            items={[
              { q: "What is an AI agent?", a: "An agent completes a defined task end to end and returns a result you can act on — a shortlist, a drafted proposal, a scored diagnostic — rather than answering a question in a chat box. Each LAMID agent is scoped to one job and priced by the outcome it produces." },
              { q: "How are LAMID Agents priced?", a: "In LAMID Points, per completed outcome. A resolved dispute costs 80 points, a drafted proposal 60, a delivered shortlist 30, an answered question 15. If a run fails you are not charged. Every paid plan includes a monthly points allowance." },
              { q: "Can I build my own agent?", a: `Not yet. Custom engine configuration is available on Enterprise, and a custom agent builder is on the roadmap. Today the ${numberWord(AGENT_COUNT, true)} agents listed above are the full set.` },
              { q: "Who can use the agents?", a: "The Assistant, Diagnostic and Matching agents are available on the free plan. Proposal, Milestone, Deliverable and Project Match unlock at Starter. Dispute, Intelligence and Operating Model unlock at Growth. The full breakdown is in the pricing comparison." },
              { q: "How is this different from using ChatGPT directly?", a: "A general assistant cannot see your engagement records, your budget model or your workforce data, so it can only give you a plausible-sounding general answer. LAMID Agents read the data already in your engines, respect the permissions of the person invoking them, and write their output back to the record it belongs to." },
            ]}
          />
        </Section>

        <section style={{ background: "var(--ink)" }}>
          <div className="shell py-24 text-center">
            <h2 className="h-display mx-auto max-w-3xl" style={{ color: "var(--page)" }}>
              Run one agent and see what it costs.
            </h2>
            <p className="mx-auto mt-6 max-w-xl" style={{ color: "var(--ink-faint)" }}>
              The free plan includes 200 points — enough for a full diagnostic and a matched shortlist.
            </p>
            <div className="mt-10 flex justify-center gap-3">
              <Button href="/signup" variant="primary">Start free</Button>
              <Button href="/pricing#points" variant="contrast">See points pricing</Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
