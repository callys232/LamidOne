import { FolderLock } from "lucide-react";

/**
 * DOCUSHARE — the one thing on this platform that is deliberately NOT a
 * `Suite`.
 *
 * IT USED TO BE ONE. `suites.ts` carried a `DOCUSHARE: Suite` object,
 * rendered through the shared `/suites/[id]` template, and sat in the
 * `SUITES` array alongside CORE, GROW, TALENT, FINANCE, DESK, SIGNAL,
 * LEARN and MARKET — even though the platform's own content already
 * disagreed with that framing in three separate places:
 *
 *   · aios.ts's OS_LAYER: "The substrate under all four suites. Not a
 *     suite — infrastructure."
 *   · modules.ts's SUITE_PARENT.docushare: "DOCUSHARE is not folded
 *     into one suite. It is the floor all four stand on."
 *   · nav.ts already demoted it out of the four-column suite grid into
 *     a secondary list beside LAMID Agents, LAMID Points and
 *     Integrations — platform capabilities, not products you pick.
 *
 * The page template just never caught up to what the copy already
 * knew. This file, and the bespoke page at /docushare, are that catch-
 * up: DOCUSHARE gets its own shape instead of borrowing a suite's.
 *
 * WHAT'S DELIBERATELY ABSENT vs a Suite: no `comparison` grid pitched
 * as "us vs competitors" framing (kept the underlying facts, reframed
 * as "why not just use a shared drive"), no diagnostic-flavoured CTA
 * (`SUITE_DIAGNOSTIC`), no hero capability strip. What's kept: the
 * three real capability groups, the storage-tier facts (checked
 * against tiers.ts, not restated from memory), and the FAQ specific to
 * DocuShare from suiteFaq.ts, none of which stops being true just
 * because the page shape changed.
 */

export const DOCUSHARE_INFO = {
  id: "docushare" as const,
  name: "LAMID DOCUSHARE",
  tint: "#1A7CFF",
  Icon: FolderLock,
  external: {
    url: "https://fileshare-six-phi.vercel.app/",
    appName: "HybridShare",
    label: "Open DocuShare",
  },

  eyebrow: "Not a suite. The floor the suites stand on.",
  headline: "Every file, every version, every share — accounted for.",
  subhead:
    "Workspaces, connectors and controlled sharing with password-protected links, expiry dates and view analytics. One document layer underneath every suite, rather than four filing systems that disagree.",

  /* `title` was "DOCUSHARE is not folded into one suite. It is the
     floor all four stand on." — verbatim from modules.ts
     SUITE_PARENT.docushare, and weak on this page specifically: the
     eyebrow directly above it already says "Not a suite. The floor
     the suites stand on.", so the H2 was repeating the eyebrow rather
     than adding to it, and led with a negation before ever stating
     what DOCUSHARE actually does. Replaced with the positive,
     verb-led claim the negation was dancing around; `body` and
     `split` are unchanged — `body` was already carrying "every suite
     writes to" and now the title sets that up instead of duplicating
     the eyebrow. */
  whatItIs: {
    title: "Every suite writes to one record. This is it.",
    body: "Every diagnostic, proposal, deliverable and invoice becomes a document, and DOCUSHARE is where those live — shared workspaces, controlled access, and one record that all four suites write to.",
    split: "The suites produce the intelligence. DOCUSHARE holds it.",
  },

  capabilities: [
    {
      eyebrow: "Storage and workspaces",
      title: "Give every team, project and department its own room.",
      body: "Upload, organise and version-control files inside workspaces with fine-grained permissions — no one maintaining a folder tree by hand.",
      bullets: [
        "Team, project and department workspaces",
        "Version control on every file",
        "Fine-grained permissions per member",
        "Roles: Owner, Admin, Editor, Viewer",
      ],
    },
    {
      eyebrow: "Controlled sharing",
      title: "Share outside the organisation without losing the file.",
      body: "Password-protected links with expiry dates and download limits, plus view analytics showing who opened what, from where, on which device.",
      bullets: [
        "Password-protected share links",
        "Expiry dates and download limits",
        "View analytics with geography and device",
        "Revoke access without recalling an email",
      ],
    },
    {
      eyebrow: "Connectors and compliance",
      title: "Bring in what already lives somewhere else.",
      body: "Sync from Google Drive, OneDrive, Dropbox, databases and REST APIs, with audit logs, 2FA, access control lists and data classification over the top.",
      bullets: [
        "Connectors for Drive, OneDrive, Dropbox, databases and REST",
        "Audit logs and access reporting",
        "Data classification and ACLs",
        "SAML 2.0, SCIM and custom domain on Enterprise",
      ],
    },
  ],

  /* Compact summary — not the full 18-row feature table (that's
     tiers.ts's DOCUSHARE group, still the source of truth on
     /pricing). Just enough to answer "what does it cost" without
     duplicating a table that could drift from the real one.
     `seatNote` is deliberately unpriced: DocuShare is billed per
     seat, added alongside suite seats as a team grows, but no
     confirmed rate exists yet to state here — same rule this
     codebase already applies to case studies and testimonials
     (QUOTES in aios.ts, CaseStudyRail.tsx): a real, checkable number
     when there is one, an honest gap until then, never a guess. */
  storage: {
    title: "Storage scales with your plan. DocuShare seats scale with your team.",
    tiers: [
      { plan: "Free", local: "5 GB", cloud: "—" },
      { plan: "Starter", local: "50 GB", cloud: "+$5/mo → 50 GB" },
      { plan: "Growth", local: "500 GB", cloud: "+$10/mo → 500 GB" },
      { plan: "Enterprise", local: "Unlimited", cloud: "+$50/mo → 10 TB" },
    ],
    seatNote: "DocuShare is billed per seat, added as you add seats to your suites — it isn't bundled free into a suite's seat price. Current rates are on the pricing page.",
    note: "Full feature-by-tier breakdown is on the pricing page.",
  },

  /* Was framed as "LAMID DOCUSHARE vs Consumer cloud drives vs Email
     attachments" — a competitive comparison table, the wrong shape for
     infrastructure nobody shops for separately. Same facts, reframed
     as the question a reader actually has: why not just use what I
     already have. */
  whyNotJustDrive: {
    title: "A shared drive tells you a file exists. It doesn't tell you who opened it.",
    body: "Consumer cloud drives and email attachments don't expire links, don't log who viewed what from where, and don't attach a file to the engagement record it belongs to. DOCUSHARE does all three, plus the audit trail and access controls procurement actually asks for.",
  },

  faq: [
    {
      q: "Does DOCUSHARE open in a separate application?",
      a: "Yes. DocuShare runs as its own application and opens in a new tab. Files attached to an engagement remain linked to that engagement's record in LAMID ONE.",
    },
    {
      q: "Is DocuShare included in my seat price?",
      a: "Local storage is included at every tier — 5 GB on Free up to unlimited on Enterprise. DocuShare itself is billed per seat, added as you add seats to your suites, separately from what you pay for a suite seat. Cloud storage capacity is a further add-on on top of that. Current rates are on the pricing page.",
    },
    {
      q: "Why isn't DOCUSHARE one of the suites?",
      a: "Because it isn't a capability you turn on or off — every suite already writes to it, whether or not you ever open DocuShare directly. It's still billed like one, though: a DocuShare seat is its own line item, added as your team grows, the same way a suite seat is.",
    },
  ],

  closing: {
    title: "Put the document layer under every engagement.",
    body: "Start with 5 GB free — no card required.",
  },
};
