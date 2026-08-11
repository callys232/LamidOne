/**
 * Per-suite FAQ, generated on the studied pattern:
 * generic → branded → cross-sell → competitive.
 *
 * The generic question uses the suite's own category noun, which is the
 * literal search term. The competitive question names the alternative
 * so that query lands on our domain.
 */

import type { FaqItem } from "@/components/sections/Faq";
import type { Suite } from "./suites";

const SPECIFIC: Partial<Record<string, FaqItem[]>> = {
  core: [
    {
      q: "What is decision intelligence software?",
      a: "It captures the options considered, the factors weighted, the rationale and the outcome of a decision, and keeps them connected. Six months later the answer to 'why did we choose this?' is in the record rather than in somebody's memory.",
    },
  ],
  finance: [
    {
      q: "Does LAMID FINANCE use AI to produce the numbers?",
      a: "No. Every figure is computed arithmetically from the inputs you enter, and the working is shown and exportable. AI agents can explain a result or draft commentary around it, but they never generate the numbers themselves.",
    },
  ],
  learn: [
    {
      q: "Does LAMID LEARN open in a separate application?",
      a: "Yes. LAMID Learning runs as its own multi-tenant application and opens in a new tab. Your seat, certification records and completion reporting sync back to LAMID ONE automatically, so capability uplift shows against your TALENT baseline.",
    },
  ],
  docushare: [
    {
      q: "Does DOCUSHARE open in a separate application?",
      a: "Yes. DocuShare runs as its own application and opens in a new tab. Files attached to an engagement remain linked to that engagement's record in LAMID ONE.",
    },
    {
      q: "Is storage included in my seat price?",
      a: "Each tier includes local storage — 5 GB on Free, 50 GB on Starter, 500 GB on Growth, and unlimited on Enterprise. Cloud storage is a separate add-on starting at $5 per month for 50 GB, so you only pay for capacity you actually use.",
    },
  ],
  market: [
    {
      /* Rewritten twice now — first to stop claiming a fund hold that
         was never built, then again because the second fix (approval
         now genuinely releases the expert's withdrawable balance — see
         lib/milestones.ts) made "it does not move money" stale in the
         OTHER direction. Both halves are true simultaneously: nothing
         is captured from the client up front, and approval does
         release real money to the expert — just not by holding the
         client's funds first. */
      q: "How does milestone approval protect me?",
      a: "Work is agreed as milestones, and a milestone only clears when you approve the deliverable — or automatically if you raise no objection inside the review window. A dispute stops that immediately and the Dispute Agent assembles the evidence from both sides before anything clears. Nothing is captured from you up front — there is no fund hold. Approval releases that amount to the expert's withdrawable balance immediately, which they draw out to their own bank whenever they choose. The trust centre lists exactly what is and is not built.",
    },
  ],
};

export function suiteFaq(suite: Suite): FaqItem[] {
  const specific = SPECIFIC[suite.id] ?? [];

  return [
    {
      q: `What is ${suite.kind.toLowerCase()}?`,
      a: `${suite.subhead} In ${suite.name} that means ${suite.features.length} capabilities rolling up ${suite.engineCount} engines, all writing to the same record as the rest of the platform.`,
    },
    ...specific,
    {
      q: `How much does ${suite.name} cost?`,
      a: `${suite.name} is included from ${suite.tiers.includes("free") ? "the free plan" : "Starter"}. Seat price follows your account tier rather than the number of suites you use, so adding ${suite.name} does not re-price seats you already pay for. Agent usage within the suite runs on LAMID Points, charged per completed outcome.`,
    },
    {
      q: `How does ${suite.name} work with the other suites?`,
      a: `Every suite writes to one record. A diagnostic run in LAMID CORE can become the brief that sources an expert in LAMID MARKET, the scope in LAMID DESK, and the milestone that releases payment — without re-entering anything. That is the point of the bundle: adding a suite at the same tier costs nothing extra per seat.`,
    },
    {
      q: `How is ${suite.name} different from ${suite.comparison.columns[1].toLowerCase()}?`,
      a: `${suite.comparison.blurb} The full capability comparison is on this page, including where the alternatives genuinely do part of the job.`,
    },
  ];
}
