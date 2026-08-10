/**
 * Legal and policy pages.
 *
 * ⚠️  These are STRUCTURAL DRAFTS, not legal advice. Each carries a
 * visible notice saying so. They must be reviewed by counsel before
 * launch — publishing an unreviewed privacy policy or terms of service
 * creates real liability, and a plausible-looking draft is more
 * dangerous than an obvious placeholder because nobody remembers to
 * replace it.
 */

export type LegalDoc = {
  slug: string;
  title: string;
  lead: string;
  sections: { heading: string; body: string[] }[];
};

export const LEGAL_DOCS: LegalDoc[] = [
  {
    slug: "privacy",
    title: "Privacy policy",
    lead: "What we collect, why, how long we keep it, and how to get it back or have it erased.",
    sections: [
      {
        heading: "What we collect",
        body: [
          "Account data: name, work email, organisation, role and authentication credentials. Credentials are stored hashed and are never recoverable in plain text.",
          "Platform data: the inputs you enter into engines, the outputs they compute, engagement records, messages, documents and transaction history.",
          "Technical data: IP address, device and browser information, and audit records of consequential actions.",
          "Payment data is processed by Stripe and Paystack. We do not store full card numbers.",
        ],
      },
      {
        heading: "Why we process it",
        body: [
          "To provide the service you have asked for, under the contract between us.",
          "To meet legal obligations, including financial record-keeping on escrow and payments.",
          "For legitimate interests including security, fraud prevention and service improvement, where those interests do not override your rights.",
          "With consent, for marketing communications — which you can withdraw at any time without affecting the service.",
        ],
      },
      {
        heading: "AI processing",
        body: [
          "Agent runs send the relevant records to a third-party model provider to compute a result.",
          "Those providers are contractually prohibited from training their models on your data.",
          "Agent access is scoped to records the invoking user is already permitted to see.",
          "Every agent run is logged with its invoker, its cost and its output.",
        ],
      },
      {
        heading: "How long we keep it",
        body: [
          "Account and platform data for as long as your account is active.",
          "Financial and escrow records for the period required by applicable law after an engagement closes.",
          "Audit logs according to your tier, from 30 days on Starter to unlimited on Enterprise.",
          "On erasure we delete your data and confirm when it is done; an operator audit record of the deletion itself is retained as a legal record.",
        ],
      },
      {
        heading: "Your rights",
        body: [
          "Access and portability: export everything held about you at any time, in CSV.",
          "Erasure: request deletion through the application or by email.",
          "Rectification, restriction and objection, as provided under applicable data protection law.",
          "The right to complain to your local supervisory authority.",
        ],
      },
      {
        heading: "Sharing and transfers",
        body: [
          "We share data with sub-processors who provide infrastructure, payments, email and AI computation. A current sub-processor list is available on request.",
          "We do not sell personal data.",
          "Enterprise plans can select a data residency region. Where data is transferred across borders, appropriate safeguards apply.",
        ],
      },
    ],
  },
  {
    slug: "terms",
    title: "Terms of service",
    lead: "The agreement between you and LAMID ONE for use of the platform.",
    sections: [
      {
        heading: "The service",
        body: [
          "LAMID ONE provides software for organisational diagnostics, planning and operations, an expert marketplace, and connected applications for learning and document management.",
          "Availability, features and limits depend on your plan, as described on the pricing page at the time of purchase.",
          "We may change features over time. We will not materially reduce what a paid plan includes during a term you have already paid for.",
        ],
      },
      {
        heading: "Your account",
        body: [
          "You are responsible for the security of your credentials and for activity under your account.",
          "Seats are per named individual and may not be shared between people.",
          "You must have authority to bind your organisation if you are contracting on its behalf.",
        ],
      },
      {
        heading: "Fees, points and billing",
        body: [
          "Subscription fees are charged in advance, monthly or annually, in USD unless otherwise agreed.",
          "LAMID Points are consumed on completed outcomes. Failed runs are not charged. Purchased points do not expire; monthly plan allowances do not roll over.",
          "Monthly plans end at the close of the current billing cycle. Annual plans are prorated for unused months on cancellation.",
          "Prices exclude applicable tax.",
        ],
      },
      {
        /* ⚠️  These clauses previously stated that LAMID ONE provides
           escrow and that "escrowed funds are held against agreed
           milestones". No fund holds exist — lib/milestones.ts imports
           no payment or ledger module and places no hold. A term of
           service promising custody of a client's money, where no
           custody occurs, is a misrepresentation in a contract rather
           than a marketing overstatement, and it exposes the business
           far more than any homepage line.

           Restated to describe the milestone-approval mechanism that
           genuinely runs. Restore the custody wording only once holds
           and settlement are wired, and have it reviewed before it
           ships. */
        heading: "Marketplace engagements and milestones",
        body: [
          "Engagements are contracts between the client and the expert. LAMID ONE provides the platform, matching and the milestone record, and is not a party to the engagement itself.",
          "Work is agreed as milestones. A milestone is approved by the client, or approved automatically where no objection is raised inside the stated review window. Approval marks the milestone as cleared for payment between the parties; LAMID ONE does not currently hold, transfer or take custody of engagement funds, and payment is settled directly between client and expert.",
          "Disputes follow the platform's structured resolution process. Our determination is final as between the parties for platform purposes, and does not limit either party's legal rights.",
        ],
      },
      {
        heading: "Your data and outputs",
        body: [
          "You retain ownership of everything you enter and of the outputs computed from it.",
          "You grant us the licence necessary to operate the service on your behalf.",
          "Engine outputs are decision support, not professional advice. They are not an audit opinion, a legal opinion, or a substitute for professional judgement.",
        ],
      },
      {
        heading: "Liability",
        body: [
          "We provide the service with reasonable skill and care but do not warrant that outputs are error-free or fit for a particular decision.",
          "To the extent permitted by law, our aggregate liability is limited to the fees paid in the twelve months before the claim.",
          "Nothing limits liability for death or personal injury caused by negligence, fraud, or anything else that cannot be limited by law.",
        ],
      },
    ],
  },
  {
    slug: "accessibility",
    title: "Accessibility statement",
    lead: "Our target is WCAG 2.1 Level AA. We test against it, and we have not finished.",
    sections: [
      {
        heading: "What we aim for",
        body: [
          "WCAG 2.1 Level AA across the marketing site and the application.",
          "Full keyboard operability, visible focus indicators and a skip-to-content link on every page.",
          "Semantic structure, correct heading order and programmatic labels on every control.",
          "Colour is never the only carrier of meaning: comparison tables pair colour with a symbol and a text legend, and tier rank is encoded by position as well as by dots.",
          "Support for reduced-motion preferences, and a dark theme that is a selected palette rather than an automatic inversion.",
        ],
      },
      {
        heading: "Known gaps",
        body: [
          "Wide comparison tables scroll horizontally on small screens, and the sticky header does not apply below the large breakpoint.",
          "Some engine interfaces in the application have not yet been audited to the same standard as the marketing surface.",
          "We have not yet completed an independent third-party accessibility audit.",
        ],
      },
      {
        heading: "Tell us",
        body: [
          "If something blocks you, email us. We will acknowledge within two business days, tell you what we are doing, and reply again when it is fixed.",
          "If you need information in an alternative format, ask and we will provide it.",
        ],
      },
    ],
  },
  {
    slug: "cookies",
    title: "Cookie preferences",
    lead: "What we set, what it does, and how to turn it off.",
    sections: [
      {
        heading: "Strictly necessary",
        body: [
          "Session and authentication cookies that keep you signed in and protect against cross-site request forgery.",
          "Your theme and language preference.",
          "These cannot be turned off without breaking the service.",
        ],
      },
      {
        heading: "Analytics",
        body: [
          "Aggregate usage measurement so we can see which pages and engines are actually used.",
          "You can decline these without any loss of functionality.",
        ],
      },
      {
        heading: "Marketing",
        body: [
          "Attribution for campaigns and referrals.",
          "Off by default. Only set if you opt in.",
        ],
      },
    ],
  },
];

export const getLegalDoc = (slug: string) => LEGAL_DOCS.find((d) => d.slug === slug);
