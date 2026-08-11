import type { FaqItem } from "@/components/sections/Faq";

/**
 * Pricing FAQ, ordered by OBJECTION PRIORITY rather than by topic.
 * Security first, because it is the hardest blocker and the one
 * enterprise procurement verifies. ProdLamid's original FAQ had it
 * fourth (teardown §3 #6).
 */
export const PRICING_FAQ: FaqItem[] = [
  {
    q: "Is my data secure, and is it used to train AI models?",
    a: "Data is encrypted in transit and at rest, access is role-based, and third-party AI providers are contractually prohibited from training their models on your data. Enterprise plans add SSO, field-level permissions, an unlimited audit log and data residency selection. Our current certification status is published in the trust centre — we state what is certified today and what is in progress, rather than claiming a badge we do not hold.",
  },
  {
    q: "Can I cancel at any time?",
    a: "Yes. Monthly plans end at the close of the current billing cycle and annual plans are prorated for unused months. Purchased LAMID Points never expire, and you can export your data at any point before or after cancelling.",
  },
  {
    q: "What exactly am I buying — the suites, or the marketplace?",
    /* Was "milestone escrow so payment only releases on approved
       work" — the exact confusion lib/milestones.ts's ⚠️ note warns
       against: nothing is held, approval releases straight to the
       expert's payout balance. Rewritten to claim what actually
       happens. */
    a: "Both, on one plan. The suites are software your team runs. LAMID MARKET is where you source a vetted expert when you need capability you do not have, with milestones you approve one at a time before payment releases. Your plan covers access to both; expert fees are separate and agreed per engagement.",
  },
  {
    q: "How does seat pricing work if we use several suites?",
    /* Was "all nine" — stale since DOCUSHARE moved to its own
       optional, per-seat billed page (content/docushare.ts) and isn't
       one of the bundled suites this line is describing. */
    a: "Seat price follows your account tier, not the number of suites. If your account is on Growth, every seat is a Growth seat whether that person opens one suite or all eight. Moving up a tier re-prices every seat, which is a deliberate decision — but adding a suite at the same tier costs nothing extra per seat. That is why the bundle costs less than buying suites separately: it removes duplicate seat charges rather than discounting features.",
  },
  {
    q: "What are LAMID Points and what happens if I run out?",
    a: "Points meter the AI agents and marketplace actions, charged per completed outcome — a delivered shortlist, a drafted proposal, a resolved dispute. A run that fails costs nothing. A new free account is granted exactly 40 points, which is the cost of one full business diagnostic; every paid plan adds a monthly allowance, and you can buy more from $10 for 100 points. If you run out, nothing breaks: the suites, dashboards and engines keep working and only metered runs pause until you top up.",
  },
  {
    q: "Do LAMID LEARN and DOCUSHARE cost extra?",
    a: "Access is included in your plan and both open as their own applications in a new tab. DocuShare storage is the one metered extra: each tier includes local storage from 5 GB on Free up to unlimited on Enterprise, and cloud capacity is an optional add-on from $5 per month.",
  },
  {
    q: "What currency am I charged in?",
    a: "USD. Every plan and point package is priced and charged in US dollars, wherever you sign up from — there is no region-locked pricing.",
  },
  {
    q: "What does Enterprise include that Growth does not?",
    a: "SSO, SCIM provisioning, field-level permissions, approval workflows, multi-account management, a sandbox environment, data residency selection, an unlimited audit log, a 99.9% uptime commitment, a dedicated account director, migration assistance and a one-hour first-response target. Enterprise starts from $1,850 per month; the exact figure depends on seats and points, so it is agreed with sales.",
  },
  {
    q: "How is this priced compared with a consulting firm?",
    a: "A consulting engagement is priced per partner day and ends with a recommendation. LAMID ONE is priced per seat and per completed outcome, and keeps the model and reasoning afterwards. When you do need specialist help, LAMID MARKET sources it per engagement with escrow-backed milestones rather than a retainer.",
  },
];
