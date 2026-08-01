/**
 * Homepage copy.
 *
 * FAQ questions are written in the SEARCHER'S voice and sequenced
 * generic → branded → competitive, so the "vs" query is captured on our
 * own domain (teardown §6.2). Contrast ProdLamid's original five, which
 * were all brand-voice ("How does the AI matching actually work?") and
 * captured no search intent at all.
 */

import type { FaqItem } from "@/components/sections/Faq";

export const HOME_COMPARISON = {
  headline: "Consultants leave. Spreadsheets forget. LAMID ONE stays.",
  blurb:
    "Most organisations run strategy through a consulting engagement, execution through a project tool, and the numbers through a spreadsheet. Each does part of the job, and none of them remembers why a decision was made.",
  columns: ["LAMID ONE", "One-off consultants", "Internal spreadsheets"],
  rows: [
    { capability: "Decision rationale retained after the engagement ends", values: [true, false, false] as (true | false | "partial")[] },
    { capability: "Arithmetic shown and exportable", values: [true, "partial", true] as (true | false | "partial")[] },
    { capability: "Updates continuously as the business moves", values: [true, false, "partial"] as (true | false | "partial")[] },
    { capability: "Specialist expertise available on demand", values: [true, true, false] as (true | false | "partial")[] },
    { capability: "Payment held until the work is approved", values: [true, "partial", false] as (true | false | "partial")[] },
    { capability: "Capability stays in the building afterwards", values: [true, false, "partial"] as (true | false | "partial")[] },
    { capability: "Priced per outcome, not per consultant day", values: [true, false, true] as (true | false | "partial")[] },
  ],
};

export const HOME_FAQ: FaqItem[] = [
  /* generic — category capture */
  {
    q: "What is decision intelligence software?",
    a: "Decision intelligence software captures how an organisation makes decisions — the options considered, the factors weighted, the rationale, and the outcome — and keeps them connected. Instead of a decision living in a deck and its result living in a spreadsheet, both stay attached to one record, so you can trace an outcome back to the reasoning that produced it.",
  },
  {
    q: "How much does LAMID ONE cost?",
    a: "There is a free plan for up to two users. Starter is $39 per seat per month billed annually, Growth is $119 per seat per month billed annually, and Enterprise starts from $1,850 per month. Agent and marketplace usage runs on LAMID Points, charged per completed outcome, and every paid plan includes a monthly allowance. Full pricing is on the pricing page.",
  },
  {
    q: "Is my data used to train AI models?",
    a: "No. Third-party AI providers are contractually prohibited from training their models on your data. Data is encrypted in transit and at rest, agent access is scoped to your own records, and Enterprise plans can select a data residency region. Details are in the trust centre.",
  },
  /* branded */
  {
    q: "What is the difference between the suites and the marketplace?",
    a: "The suites are software you run yourself — CORE, GROW, TALENT, FINANCE, DESK, SIGNAL, LEARN and DOCUSHARE. LAMID MARKET is where you source a vetted expert when you need capability you do not have, with milestone escrow so payment is only released on work you have approved. The two share one record: a diagnostic you run in CORE can become the brief that sources an expert in MARKET.",
  },
  {
    q: "Do I have to buy every suite?",
    a: "No. Start with one and add others when you need them. Seat price follows your account tier rather than the number of suites, so adding a suite does not re-price your seats — which is why the bundle costs less than buying suites separately.",
  },
  {
    q: "Can I cancel at any time?",
    a: "Yes. Monthly plans end at the close of the current billing cycle and annual plans are prorated for unused months. Purchased LAMID Points never expire, and you can export your data at any time.",
  },
  /* competitive — capture the "vs" query on our own domain */
  {
    q: "How is LAMID ONE different from hiring a consulting firm?",
    a: "A consulting engagement produces a recommendation and ends. LAMID ONE keeps the model, the reasoning and the working after the engagement is over, so the next decision starts from what you already know. When you do need specialist help, LAMID MARKET sources it per engagement with escrow-backed milestones rather than a retainer — and LAMID LEARN certifies your own team so the dependency shrinks over time.",
  },
  {
    q: "How is LAMID ONE different from a spreadsheet?",
    a: "Spreadsheets do arithmetic well and everything else badly: no audit trail, no version everyone trusts, and no link between a number and the decision it was for. LAMID ONE shows the same arithmetic — you can export the working — but keeps it versioned, permissioned, and attached to the decision, the engagement and the payment it relates to.",
  },
];
