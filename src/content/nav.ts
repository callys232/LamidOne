/**
 * NAVIGATION — a curation surface, not a directory.
 *
 * ProdLamid has ~400 engine routes and 170 API handlers. This menu
 * exposes about forty things. That is the point: HubSpot has tens of
 * thousands of pages and its mega-menu shows ~40, each grouped,
 * described and one click deep (teardown §6.6). Pour the engine routes
 * in here and it stops being navigation and becomes a sitemap.
 *
 * THE NOUN/VERB SPLIT (teardown §2)
 *   Products  = what it IS      → the four suites
 *   Solutions = what you're DOING → objectives, team size, why us
 * The same software appears twice. Buyers who know the category use
 * Products; buyers who only know their problem use Solutions.
 *
 * Pricing deliberately has NO dropdown. Zero friction between intent
 * and price.
 */

import { SUITES } from "./suites";
import { AGENT_COUNT, numberWord } from "./agents";

export type NavLink = {
  label: string;
  href: string;
  /** Never a bare list — every entry carries a one-line descriptor. */
  description?: string;
  external?: boolean;
  badge?: string;
};

export type NavColumn = { title: string; links: NavLink[] };

/** Above the main bar: language, contrast, support, sales, auth. */
export const UTILITY_NAV = {
  left: [
    { label: "English", href: "#", description: "Change language" },
    { label: "High contrast", href: "#", description: "Toggle high-contrast mode" },
    { label: "Customer support", href: "/support" },
    { label: "Contact sales", href: "/contact-sales" },
  ] as NavLink[],
  right: [
    { label: "Search", href: "/search" },
    { label: "Log in", href: "/signin" },
    { label: "About", href: "/about" },
  ] as NavLink[],
  /** Supply side lives here, not in the main nav, so it never competes
   *  with demand-side intent (teardown §2). */
  supplySide: { label: "For experts", href: "/for-experts", description: "List your practice" } as NavLink,
};

/* ── PRODUCTS — the noun tree ─────────────────────────────── */

const suiteLink = (id: string): NavLink => {
  const s = SUITES.find((x) => x.id === id)!;
  return {
    label: s.name,
    href: `/suites/${s.id}`,
    description: s.kind,
    external: false,
    badge: s.external ? "Opens app" : undefined,
  };
};

export const PRODUCTS_MENU = {
  header: {
    title: "The LAMID ONE ecosystem",
    blurb: "Four suites — CORE, GROW, TALENT and FINANCE — on one shared record. Clarity, transformation, capability and financial performance in a single operating system.",
    ctas: [
      { label: "Free tools", href: "/free-tools" },
      { label: "All products and features", href: "/products" },
    ] as NavLink[],
  },
  columns: [
    {
      title: "Decide and execute",
      links: [suiteLink("core"), suiteLink("grow")],
    },
    {
      title: "People and money",
      links: [suiteLink("talent"), suiteLink("finance")],
    },
    {
      title: "Clients and demand",
      links: [suiteLink("desk"), suiteLink("signal")],
    },
    {
      title: "Capability and sourcing",
      links: [suiteLink("learn"), suiteLink("market")],
    },
  ] as NavColumn[],
  /** Demoted below a rule — present, but ranked under the suites.
   *  DOCUSHARE was `suiteLink("docushare")`; it isn't a `Suite` to look
   *  up anymore (see content/docushare.ts), so it's a direct link now —
   *  same shape as its three neighbours here, which were never suites
   *  either. */
  secondary: [
    { label: "LAMID DOCUSHARE", href: "/docushare", description: "File infrastructure and secure sharing" },
    { label: "LAMID Agents", href: "/agents", description: `The ${numberWord(AGENT_COUNT, true)} AI agents and what each costs` },
    { label: "LAMID Points", href: "/points", description: "Pay per completed outcome" },
    { label: "Integrations", href: "/integrations", description: "Everything it connects to" },
  ] as NavLink[],
};

/* ── SOLUTIONS — the verb tree ────────────────────────────── */

export const SOLUTIONS_MENU = {
  /** Left rail + content pane: two levels in one panel, no cascading
   *  submenus and no hover tunnels (teardown §6.6). */
  rail: [
    { id: "objective", label: "By objective" },
    { id: "size", label: "By organisation size" },
    { id: "why", label: "Why LAMID ONE?" },
  ],
  panels: {
    objective: [
      {
        title: "Decide and align",
        links: [
          { label: "Diagnose the organisation", href: "/use-cases/diagnose", description: "Find what is actually wrong before you spend" },
          { label: "Align strategy and execution", href: "/use-cases/align-strategy", description: "Stop the plan and the work drifting apart" },
          { label: "Fix the execution cadence", href: "/use-cases/fix-cadence", description: "Find the tempo your teams really run at" },
        ],
      },
      {
        title: "Grow and fund",
        links: [
          { label: "Model the financials", href: "/use-cases/model-financials", description: "Budgets and forecasts with the arithmetic shown" },
          { label: "Find where growth is leaking", href: "/use-cases/find-growth", description: "See what compounds and what drains" },
          { label: "Get paid faster", href: "/use-cases/get-paid", description: "Quote, sign, deliver and collect in one place" },
        ],
      },
      {
        title: "People and capability",
        links: [
          { label: "Build the talent bench", href: "/use-cases/build-bench", description: "Know who is ready before you need them" },
          { label: "Source specialist expertise", href: "/use-cases/source-experts", description: "A matched shortlist, not a directory" },
          { label: "Certify your teams", href: "/use-cases/certify-teams", description: "Keep the capability after the engagement" },
        ],
      },
    ] as NavColumn[],
    size: [
      {
        title: "By organisation size",
        links: [
          { label: "Founders and small teams", href: "/solutions/small-business", description: "Start free, add suites as you grow" },
          { label: "Mid-market", href: "/solutions/mid-market", description: "Multiple suites, shared points, team workspaces" },
          { label: "Enterprise and government", href: "/solutions/enterprise", description: "Governance, residency, SSO and assurance" },
        ],
      },
      {
        title: "By role",
        links: [
          { label: "Chief executive", href: "/solutions/ceo", description: "One source of truth across the organisation" },
          { label: "Chief financial officer", href: "/solutions/cfo", description: "Financial clarity that moves as fast as you do" },
          { label: "Chief people officer", href: "/solutions/cpo", description: "People decisions with financial-grade evidence" },
          { label: "Strategy and transformation", href: "/solutions/strategy", description: "Decisions that survive contact with delivery" },
        ],
      },
    ] as NavColumn[],
    why: [
      {
        title: "Why LAMID ONE?",
        links: [
          { label: "Why choose LAMID ONE", href: "/why-lamid-one", description: "How we compare, honestly" },
          { label: "Case studies", href: "/case-studies", description: "Named organisations, real numbers" },
          { label: "Compare alternatives", href: "/compare", description: "Against consultants, spreadsheets and point tools" },
          { label: "Trust and security", href: "/trust", description: "Controls, residency and how AI handles your data" },
        ],
      },
    ] as NavColumn[],
  },
};

/* ── RESOURCES ────────────────────────────────────────────── */

export const RESOURCES_MENU = {
  columns: [
    {
      title: "Learn",
      links: [
        { label: "LAMID Learning", href: "https://learn-by-lamid.vercel.app/", description: "Courses, programmes and certification", external: true },
        { label: "Playbooks", href: "/playbooks", description: "The method behind each suite" },
        { label: "Templates", href: "/templates", description: "Budgets, decision records and reviews" },
      ],
    },
    {
      title: "Free tools",
      links: [
        { label: "Decision clarity check", href: "/free-tools/decision-clarity", description: "Score a decision in five questions" },
        { label: "Operating rhythm scorecard", href: "/free-tools/operating-rhythm", description: "Find your real delivery cadence" },
        { label: "Budget estimator", href: "/free-tools/budget-estimator", description: "Cost a project in minutes" },
        { label: "AI visibility check", href: "/free-tools/visibility-check", description: "See how assistants describe your firm" },
        { label: "All free tools", href: "/free-tools", description: "Everything that costs nothing" },
      ],
    },
    {
      title: "For experts",
      links: [
        { label: "Expert programme", href: "/for-experts", description: "Membership, revenue share and certification" },
        { label: "Join the network", href: "/signup?role=expert", description: "Create a profile and start bidding" },
        { label: "Expert directory", href: "/experts", description: "Browse the vetted network" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "About us", href: "/about", description: "Who we are and why this exists" },
        { label: "What's new", href: "/whats-new", description: "Releases, grouped by what you are trying to do" },
        { label: "Careers", href: "/careers", description: "Where the bold go to build" },
        { label: "Contact", href: "/contact", description: "Talk to a human" },
      ],
    },
  ] as NavColumn[],
};

/* ── The bar itself ───────────────────────────────────────── */

export type NavItem =
  | { label: string; kind: "mega"; menu: "products" | "solutions" | "resources" }
  | { label: string; kind: "link"; href: string };

export const MAIN_NAV: NavItem[] = [
  { label: "Products", kind: "mega", menu: "products" },
  { label: "Solutions", kind: "mega", menu: "solutions" },
  { label: "Pricing", kind: "link", href: "/pricing" },
  { label: "Resources", kind: "mega", menu: "resources" },
  { label: "Demo", kind: "link", href: "/demo-dev" },
];

/* ── Footer ───────────────────────────────────────────────── */

export const FOOTER: NavColumn[] = [
  {
    title: "Suites",
    links: SUITES.map((s) => ({ label: s.name, href: `/suites/${s.id}` })),
  },
  {
    title: "Free tools",
    links: [
      { label: "Decision clarity check", href: "/free-tools/decision-clarity" },
      { label: "Operating rhythm scorecard", href: "/free-tools/operating-rhythm" },
      { label: "Budget estimator", href: "/free-tools/budget-estimator" },
      { label: "AI visibility check", href: "/free-tools/visibility-check" },
      { label: "Templates", href: "/templates" },
      { label: "All free tools", href: "/free-tools" },
    ],
  },
  {
    title: "Platform",
    links: [
      { label: "Pricing", href: "/pricing" },
      { label: "LAMID Agents", href: "/agents" },
      { label: "LAMID Points", href: "/points" },
      { label: "Integrations", href: "/integrations" },
      { label: "All features", href: "/products" },
      { label: "Developers", href: "/developers" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About us", href: "/about" },
      { label: "Careers", href: "/careers" },
      { label: "Case studies", href: "/case-studies" },
      { label: "What's new", href: "/whats-new" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Experts and partners",
    links: [
      { label: "Expert programme", href: "/for-experts" },
      { label: "Expert directory", href: "/experts" },
      { label: "Concierge", href: "/concierge" },
      { label: "Support", href: "/support" },
    ],
  },
];

/** Security and accessibility sit in the legal row, not buried —
 *  enterprise procurement looks for exactly these two. */
export const LEGAL_NAV: NavLink[] = [
  { label: "Trust centre", href: "/trust" },
  { label: "Security", href: "/trust#implemented" },
  { label: "Privacy policy", href: "/legal/privacy" },
  { label: "Terms", href: "/legal/terms" },
  { label: "Accessibility", href: "/legal/accessibility" },
  { label: "Cookie preferences", href: "/legal/cookies" },
];
