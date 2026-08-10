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

/**
 * WHAT HAPPENS AFTER THE ANSWER.
 *
 * The homepage showed a visitor how to get a diagnosis and then stopped,
 * which left the most important thing about this platform unsaid: the
 * engines do not implement. Every function in lib/intelligence is a
 * `compute*` that returns a result — analysis, diagnosis and, in the
 * twenty specialised modules, a recommendation. Nothing in there
 * executes anything.
 *
 * That is the product, not a gap. A traditional engagement ends with a
 * consultant leaving and taking the reasoning with them. Here the
 * reasoning stays, and the customer decides who acts on it — themselves,
 * a specialist they source per engagement, or a dedicated manager. The
 * user is in the chair.
 *
 * ⚠️  ACCURACY: escrow does NOT hold money. Milestone status
 * (pending/submitted/approved/disputed) is real and enforced, but no
 * balance is held or released against it — see the trust centre, which
 * lists this under "Not wired yet". The copy below says approval gates
 * the work, never that funds are held. Do not "improve" it into a
 * payment-protection claim.
 */
export const AFTER_THE_ANSWER = {
  eyebrow: "After the answer",
  title: "The engines stop at the recommendation. You decide who acts on it.",
  blurb:
    "A consulting engagement ends when the consultant leaves, and the reasoning leaves with them. Here the reasoning stays on your record — and acting on it is your call, not a renewal conversation.",
  /* `id` selects the artwork in components/graphics/RouteArt.tsx;
     `tint` is the accent that artwork and the slide are drawn in.
     Route 1 takes the brand blue because doing it yourself is the
     default path; 2, 3 and 4 borrow the suite colour of whatever they
     hand off to — TALENT sources the specialist, GROW carries the
     pathway — so the palette stays the four-suite one rather than
     introducing a fifth set of colours. */
  routes: [
    {
      id: "self",
      tint: "#1A7CFF",
      title: "Run it yourself",
      body:
        "The engines return a sequenced pathway with the working attached, not a deck. Re-run it after you have changed something and the next result comes back as a comparison. A new account includes one full diagnostic, free.",
      cta: { label: "Start with a diagnostic", href: "/diagnostics/q44" },
    },
    {
      id: "sourced",
      tint: "#1A7CFF",
      title: "Bring in a vetted specialist",
      /* The breadth line is checkable: lib/matching.ts scores on the
         disciplines a brief actually names, as free text, so the
         network is not a fixed panel of practice areas. The named
         fields are illustrative and the sentence says so — deliberately
         NOT "30+ industries", which is the figure in brand.ts REACH and
         carries verified: false. */
      body:
        "Consulting in any discipline your brief names — strategy, finance, operations, people, technology, market entry. Every expert is scored against it on discipline overlap, rating, reliability and verification: a ranked shortlist, not a directory. Delivery is split into milestones you approve before the work moves on.",
      cta: { label: "Vet and compare experts", href: "/experts" },
    },
    {
      id: "managed",
      tint: "#1A7CFF",
      title: "Hand delivery to a dedicated manager",
      body:
        "For complex, high-value programmes, Concierge puts a named delivery manager on it — running the engines, the specialists and the milestones on your behalf. Access is reviewed and approved rather than purchased.",
      cta: { label: "Request Concierge access", href: "/concierge" },
    },
    {
      /* The fourth route is a different KIND of answer to the other
         three, and that is the point. One, two and three are "who does
         this piece of work" — you, a specialist, a manager. This one is
         "and then what", which is the question a diagnosis actually
         leaves behind. Without it the section ends at delivery and the
         platform reads as a one-off engagement, which is the exact
         model it exists to replace. */
      id: "growth",
      tint: "#1A7CFF",
      title: "Compound it into a growth pathway",
      body:
        "GROW takes what the diagnosis found and sequences it against your real capacity — which options you can resource, in what order, and what gets deferred and why. Progress writes back to the same record, so the next diagnostic starts where this one ended rather than from scratch.",
      cta: { label: "Open LAMID GROW", href: "/suites/grow" },
    },
  ],
};
