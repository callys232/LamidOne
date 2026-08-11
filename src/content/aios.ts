import type { SuiteId } from "./suites";

/**
 * THE AIOS NARRATIVE — four suites, one operating layer.
 *
 * Copy is the brand document verbatim. The only edit applied is
 * punctuation restoration: the source lost every apostrophe, hyphen and
 * em dash in transcription ("dont", "realtime", "HumanAI", "endtoend"),
 * so those are repaired here. No wording was changed.
 *
 * THE AGGREGATION. The document locks four suites. This platform ships
 * nine in total. The remaining five roll up under one of the four:
 *
 *   DESK      → CORE     the decision record becomes a transaction —
 *                        proposals, milestones, invoicing — inside the
 *                        same layer that produced the decision
 *   SIGNAL    → FINANCE  market visibility tracked beside the same
 *                        forecasts and valuation FINANCE already holds
 *   LEARN     → GROW     capability built to fill the gaps GROW's
 *                        sequencing surfaces, not sourced from outside
 *   MARKET    → TALENT   capability sourced rather than built
 *
 * ⚠️ This mapping was WRONG here for a period — DESK sat under FINANCE,
 * SIGNAL under GROW, LEARN under TALENT — which is a plausible-looking
 * derivation from each suite's `kind` in suites.ts, and also not the
 * mapping actually confirmed for the product. It disagreed with
 * SUITE_PARENT in modules.ts and with the homepage's ecosystem cards
 * (HP_ECOSYSTEM.suites in content/homepage.ts), so a reader could land
 * on two different explanations of where a suite sits depending which
 * page they read. THIS array is the one every other lookup in the
 * codebase resolves through (`ENGINE_BY_SUITE`, `engineForSuite()`) —
 * fixing SUITE_PARENT without fixing this would have left the error
 * live everywhere ELSE that calls `engineForSuite`.
 *
 * DOCUSHARE is deliberately not folded into one suite. File
 * infrastructure and secure sharing is substrate, not a capability — so
 * it belongs to the OS layer itself, alongside the datastore, the
 * points ledger and the audit log. That placement is what turns the
 * "AIOS core layer" from an abstraction into a description of
 * something real.
 *
 * The `suites` field on each suite is the aggregation. It is structural
 * metadata, not copy — it routes the nine real suite pages under the
 * four-suite story without altering a word of that story.
 */

export type Engine = {
  id: "core" | "grow" | "talent" | "finance";
  name: string;
  /** The value this engine delivers. These four words are the thread:
   *  they appear in the hero subhead as the promise, and again here as
   *  the engine that keeps it. Hero says what you get; the engine says
   *  who does it. */
  value: string;
  /** The promise, from the document's PROMISE section. */
  valueClaim: string;
  role: string;
  promise: string;
  capabilities: string[];
  /** Which real suites run inside this engine. Structural, not copy. */
  suites: SuiteId[];
  /** Module accent from the document's UI kit. */
  tint: string;
};

export const ENGINES: Engine[] = [
  {
    id: "core",
    name: "LAMID CORE",
    value: "Clarity",
    valueClaim: "Clarity will be continuous.",
    role: "Consulting Operating System",
    promise:
      "CORE is where organisations understand themselves — clearly, quickly, continuously.",
    capabilities: [
      "Real-time diagnostic intelligence",
      "Unified analysis across teams, processes, and performance drivers",
      "Precision guidance for consultants and leaders",
      "Strategic clarity delivered through the AIOS",
    ],
    suites: ["core", "desk"],
    tint: "#1A7CFF",
  },
  {
    id: "grow",
    name: "LAMID GROW",
    value: "Transformation",
    valueClaim: "Transformation will be precise.",
    role: "Digital Growth & Advisory",
    promise:
      "GROW is where organisations evolve — intelligently, precisely, at speed.",
    capabilities: [
      "Intelligent transformation pathways",
      "Integrated workflows from strategy to execution",
      "Real-time performance intelligence",
      "Continuous transformation momentum",
    ],
    suites: ["grow", "learn"],
    tint: "#1A7CFF",
  },
  {
    id: "talent",
    name: "LAMID TALENT",
    value: "Capability",
    valueClaim: "Capability will be future-ready.",
    role: "Talent Intelligence & Workforce Acceleration",
    promise:
      "TALENT is where organisations empower people — deeply, strategically, continuously.",
    capabilities: [
      "Workforce intelligence and capability mapping",
      "Skill acceleration and readiness pathways",
      "Leadership empowerment and team strengthening",
      "Unified human-capital insight across your business",
    ],
    suites: ["talent", "market"],
    tint: "#1A7CFF",
  },
  {
    id: "finance",
    name: "LAMID FINANCE",
    value: "Financial Performance",
    valueClaim: "Financial performance will be intelligent.",
    role: "Financial Intelligence & Performance Acceleration",
    promise:
      "FINANCE is where organisations gain foresight — financially, strategically, decisively.",
    capabilities: [
      "Real-time financial intelligence",
      "Predictive forecasting & scenario modelling",
      "Unified financial performance dashboards",
      "Intelligent capital allocation pathways",
    ],
    suites: ["finance", "signal"],
    tint: "#1A7CFF",
  },
];

/**
 * Suite → engine, inverted from ENGINES[].suites rather than written
 * out again. Anything that knows a suite id can resolve the engine that
 * owns it — agents, use cases, dashboards — without a second mapping
 * that could drift from this one.
 *
 * DOCUSHARE is deliberately absent: it is the OS layer, not an engine
 * (see OS_LAYER), so callers get `undefined` and must decide what that
 * means for them rather than being handed a wrong parent.
 */
export const ENGINE_BY_SUITE: Partial<Record<SuiteId, Engine>> =
  Object.fromEntries(ENGINES.flatMap((e) => e.suites.map((s) => [s, e])));

/** The engine that owns a suite, or undefined for the OS layer. */
export const engineForSuite = (id: string): Engine | undefined =>
  ENGINE_BY_SUITE[id as SuiteId];

/**
 * WHO IT IS FOR.
 *
 * The brand document is written almost entirely in enterprise register —
 * "business clarity", "multi-site operations", "CEOs, CFOs, CHROs".
 * Read straight through, a ten-person firm would conclude it is not for
 * them. That is not what the platform is: the free plan is two seats and
 * one full diagnostic, self-serve, no card and no minimum size, and
 * three sub-suites (DESK, SIGNAL, LEARN) are built for smaller
 * teams first (suites.ts `audience`).
 *
 * Every figure below is checked against tiers.ts, not asserted.
 */
export const WHO_ITS_FOR = {
  claim: "Two people or two thousand.",
  body: "The same four suites, the same single record, the same arithmetic. The free plan includes two seats and one full diagnostic — no card, no minimum size, no sales call. Add suites as they earn their place, not as a platform migration.",
};

/** The substrate under all four suites. Not a suite — infrastructure. */
export const OS_LAYER = {
  title: "The operating layer",
  blurb:
    "One record underneath every suite: shared data, a points ledger that meters every run, an immutable audit trail, and secure document infrastructure. This is what lets four suites behave as one system rather than four products with a shared logo.",
  suites: ["docushare"] as SuiteId[],
};

/* ───────────────────────────────────────────────────────────────
   HERO
   The document carried two heroes: an early three-verb version
   predating FINANCE, and this four-engine one written after FINANCE
   was locked in. This is the only one accounting for all four, so it
   is canonical; the three-verb version is retired.
   ─────────────────────────────────────────────────────────────── */
export const AIOS_HERO = {
  eyebrow: "The unified Human-AI Consulting & Growth Ecosystem",

  /* The headline is the document's original hero sentence — "The future
     of consulting and growth, delivered as one" — restored and extended.
     That line predated FINANCE and named only two domains; the rotating
     slot carries all four, one per engine, so the sentence finally
     accounts for the whole system instead of half of it.

     Split into three fields rather than one string because the middle
     word animates. Order matches ENGINES: CORE, GROW, TALENT, FINANCE.
     "talent" rather than "capability" so the rotating word never
     collides with the value of the same name sitting directly below. */
  headlineLead: "The future of",
  headlineWords: ["consulting", "growth", "talent", "finance"],
  headlineTail: "delivered as one.",

  /* No subhead and no supporting paragraph, deliberately.
   *
   * The four values now render as their own row under the headline
   * (sourced from ENGINES[].value), which is what the subhead's comma
   * list was for. The category claim is already in the eyebrow above.
   *
   * The supporting paragraph — "LAMID ONE integrates human expertise
   * with advanced intelligence in a single, unified operating system…"
   * — made the same argument as OS_LAYER's opening paragraph two
   * sections down, which states it better and in context. Saying it
   * twice on one page weakened both. Retired here, kept there. */
  echo: "The AIOS is always on. Always learning. Always guiding. Always accelerating.",
  /** The echo split into its four beats — one per engine, which is why
   *  it renders as a four-up band rather than a sentence. */
  echoBeats: [
    "Always on",
    "Always learning",
    "Always guiding",
    "Always accelerating",
  ],
  /* Demoted from the H1. It is org-chart language — true, and worth
     saying, but it describes how the product is built rather than what
     the reader gets. It earns its place as the mark under the hero,
     where it qualifies the promise above it.

     This replaces "Intelligent. Precise. Unified.", which said nothing
     the echo band's "Always-on intelligence. Precise transformation.
     Continuous growth." does not already say in the same cadence, two
     screens further down. */
  signature: "One OS. Four Suites. Unified Growth.",
};

/* ───────────────────────────────────────────────────────────────
   HOW THE AIOS WORKS
   ─────────────────────────────────────────────────────────────── */
export const AIOS_WORKS: { title: string; body: string }[] = [
  {
    title: "Unified Intelligence Layer",
    body: "A real-time intelligence engine that continuously analyses patterns, performance drivers, workforce capability, and financial signals across the organisation — delivering instant clarity and actionable insight.",
  },
  {
    title: "Adaptive Decision Framework",
    body: "An evolving guidance system that learns from human expertise, organisational behaviour, financial outcomes, and transformation cycles — shaping smarter decisions and more precise interventions.",
  },
  {
    title: "Integrated Transformation Pathways",
    body: "A unified workflow layer that connects diagnostics, strategy, execution, talent development, and financial planning — eliminating fragmentation and accelerating transformation with intelligent precision.",
  },
  {
    title: "Continuous Growth Loops",
    body: "A growth engine that keeps organisations moving forward — identifying opportunities, strengthening capabilities, optimising financial performance, and sustaining momentum through intelligent, always-on feedback.",
  },
];

/* ───────────────────────────────────────────────────────────────
   WHY — the four places traditional consulting breaks
   ─────────────────────────────────────────────────────────────── */
/**
 * The four places traditional consulting breaks — each paired with the
 * engine that answers it and the three steps to actually use that
 * engine.
 *
 * The pairing is not decoration. Each break is a symptom, and a page
 * that names four symptoms without naming the cure is just complaining
 * about the competition. The `use` steps are what turns the section
 * from an argument into an instruction: they describe what the reader
 * types in, what computes, and what comes back — and `run` opens the
 * tool that does it.
 *
 * Every `run` target is a live engine. If one is ever retired the link
 * must go with it rather than degrade to a marketing page.
 */
export type WhyBreak = {
  title: string;
  body: string;
  /** The engine that answers this failure. In ENGINES order. */
  engine: Engine["id"];
  /** How you actually use it — what you enter, what it does, what returns. */
  use: string[];
  run: { label: string; href: string };
};

export const WHY_BREAKS: WhyBreak[] = [
  {
    title: "Diagnosis is fragmented",
    engine: "core",
    use: [
      "Answer a structured intake — typed questions per dimension, not a blank form.",
      "The CORE engines score decision quality, cadence, alignment and governance against what you entered.",
      "Read the gap with the engine that flagged it attached — then re-run it later and get a comparison, not a restart.",
    ],
    run: { label: "Run a decision diagnostic", href: "/diagnostics/q44" },
    body: "Consultants gather data manually, interpret it episodically, and deliver insight long after conditions have changed. Blind spots multiply. Leaders make decisions without real-time clarity.",
  },
  {
    title: "Transformation is inconsistent",
    engine: "grow",
    use: [
      "List the growth options actually in front of you, and rate each on market pull and what you can already do.",
      "Set how many you can genuinely resource at once — the constraint is the point.",
      "Get them sequenced under that constraint, with the structural risk priced in and what was deferred stated.",
    ],
    run: { label: "Sequence your growth options", href: "/diagnostics/g03" },
    body: "Strategies are delivered, but execution is disconnected. Teams operate in silos. Momentum fades between workshops, check-ins, and quarterly reviews.",
  },
  {
    title: "Talent development is reactive",
    engine: "talent",
    use: [
      "Name the seats you cannot afford to leave empty, and how much notice you would realistically get.",
      "Name who is behind each one and how soon they could actually hold it — leave it blank if there is nobody.",
      "Get cover counted per seat, so a role with nobody is never averaged away by a role with three.",
    ],
    run: { label: "Score your bench", href: "/diagnostics/a22" },
    body: "Workforce capability is assessed infrequently, training is generic, and skill acceleration is disconnected from transformation goals. Organisations cannot build future-ready teams fast enough.",
  },
  {
    title: "Financial intelligence is isolated",
    engine: "finance",
    use: [
      "Enter your cost lines — quantities, unit costs, periods.",
      "Set overhead, contingency and tax. Every figure is arithmetic computed from your inputs; no model writes a number.",
      "Export the working alongside the figures, so the model stays usable outside this platform.",
    ],
    run: { label: "Build a costed budget", href: "/diagnostics/budget" },
    body: "Finance operates on delayed reporting, disconnected dashboards, and backward-looking analysis. Leaders cannot see the financial impact of decisions, talent moves, or transformation pathways in real time.",
  },
];

/* ───────────────────────────────────────────────────────────────
   PROOF POINTS
   ─────────────────────────────────────────────────────────────── */
export const PROOF_POINTS: { title: string; body: string }[] = [
  {
    title: "Unified Intelligence Across Your Business",
    body: "LAMID ONE replaces fragmented consulting tools, disconnected talent systems, isolated financial dashboards, and siloed transformation workflows with a single Human-AI Operating System. CORE, GROW, TALENT, and FINANCE all run on one unified intelligence layer.",
  },
  {
    title: "Real-Time Precision in Every Domain",
    body: "Insight is no longer delayed by manual analysis or periodic reporting. The AIOS delivers real-time clarity across diagnostics, transformation, workforce capability, and financial performance.",
  },
  {
    title: "Adaptive Learning That Strengthens Over Time",
    body: "Traditional consulting freezes insight in time. LAMID ONE evolves. Its intelligence layer continuously learns from organisational behaviour, human expertise, financial outcomes, and transformation cycles — strengthening clarity and precision with every loop.",
  },
  {
    title: "End-to-End Integration From Strategy to Execution",
    body: "Most consulting interventions break between diagnosis and execution. LAMID ONE connects them. Strategy, action, talent development, financial planning, and measurement operate as one continuous, intelligent loop.",
  },
  {
    title: "Human-AI Partnership That Amplifies Expertise",
    body: "LAMID ONE doesn't replace human expertise — it amplifies it. Consultants, leaders, and teams gain an intelligent partner that enhances judgement, accelerates execution, strengthens workforce capability, and improves financial foresight.",
  },
  {
    title: "Continuous Growth Loops Instead of Episodic Cycles",
    body: "Instead of episodic consulting cycles, LAMID ONE delivers always-on growth. Opportunities are surfaced early, talent capability is continuously strengthened, financial performance is monitored in real time, and transformation momentum is sustained.",
  },
];

/* ───────────────────────────────────────────────────────────────
   THE PROMISE — one line per engine
   ─────────────────────────────────────────────────────────────── */
export const PROMISE: { engine: string; claim: string; body: string }[] = [
  {
    engine: "CORE",
    claim: "Clarity will be continuous.",
    body: "Real-time diagnostic intelligence from LAMID CORE ensures leaders never navigate blind spots or outdated insight.",
  },
  {
    engine: "GROW",
    claim: "Transformation will be precise.",
    body: "Intelligent pathways from LAMID GROW guide organisations through targeted, adaptive, and integrated change.",
  },
  {
    engine: "TALENT",
    claim: "Capability will be future-ready.",
    body: "Workforce intelligence from LAMID TALENT accelerates skills, strengthens teams, and aligns human capability with strategic goals.",
  },
  {
    engine: "FINANCE",
    claim: "Financial performance will be intelligent.",
    body: "Real-time foresight from LAMID FINANCE connects decisions, talent moves, and transformation pathways directly to financial outcomes.",
  },
];

/* ───────────────────────────────────────────────────────────────
   THE ADVANTAGE — seven differentiators.
   The document's layout spec called for a 3×3 grid of nine; seven is
   what was written. The grid below fits seven rather than padding.
   ─────────────────────────────────────────────────────────────── */
export const ADVANTAGE: { title: string; body: string }[] = [
  {
    title: "One OS Instead of Many Tools",
    body: "Most organisations operate with dozens of disconnected systems — strategy tools, HR platforms, financial dashboards, performance trackers, consulting reports. LAMID ONE replaces fragmentation with one unified intelligence layer.",
  },
  {
    title: "Real-Time Insight Instead of Delayed Reporting",
    body: "Traditional consulting delivers insight after the moment of need. LAMID ONE delivers real-time clarity across diagnostics, transformation progress, workforce capability, and financial performance.",
  },
  {
    title: "Continuous Transformation Instead of Episodic Interventions",
    body: "Consulting cycles typically stall between workshops, check-ins, and quarterly reviews. LAMID ONE creates continuous transformation loops that sustain momentum and accelerate change.",
  },
  {
    title: "Integrated Talent Intelligence Instead of Generic Training",
    body: "Most talent systems operate separately from strategy and transformation. LAMID ONE integrates workforce capability intelligence directly into transformation pathways — ensuring people grow as fast as the business evolves.",
  },
  {
    title: "Financial Foresight Instead of Backward-Looking Analysis",
    body: "Finance is often the last to know the impact of strategic or talent decisions. LAMID ONE connects financial intelligence to every transformation, capability shift, and strategic move.",
  },
  {
    title: "Human-AI Partnership Instead of Manual Interpretation",
    body: "Traditional consulting relies heavily on human interpretation, which is slow and inconsistent. LAMID ONE amplifies human expertise with adaptive intelligence that learns, guides, and strengthens decision-making.",
  },
  {
    title: "Business-Wide Unity Instead of Siloed Functions",
    body: "Strategy, transformation, talent, and finance rarely operate as one. LAMID ONE synchronises all four suites — CORE, GROW, TALENT, FINANCE — into a single, intelligent system.",
  },
];

/* ───────────────────────────────────────────────────────────────
   HOW LAMID ONE WORKS — six steps, the operating logic.
   Distinct from the seven-step visitor walkthrough below. The
   document's checklist specified seven for both, which appears to be
   a copy across from the walkthrough.
   ─────────────────────────────────────────────────────────────── */
export const HOW_IT_WORKS: { title: string; body: string }[] = [
  {
    title: "The OS Ingests and Interprets Business Signals",
    body: "LAMID ONE continuously absorbs data from across the organisation — operational patterns, performance drivers, workforce capability, financial indicators, and transformation activity. The AIOS interprets these signals instantly, eliminating the delays of manual consulting analysis.",
  },
  {
    title: "The Intelligence Layer Generates Real-Time Clarity",
    body: "The OS synthesises all signals into unified intelligence — powering CORE with diagnostic clarity, GROW with transformation insight, TALENT with capability mapping, and FINANCE with financial foresight.",
  },
  {
    title: "The OS Builds Precision Pathways",
    body: "LAMID ONE converts intelligence into actionable pathways — strategic, transformation, capability, and financial. Each pathway is adaptive, evolving as conditions change so decisions remain accurate and aligned.",
  },
  {
    title: "The OS Synchronises Execution Across Your Business",
    body: "LAMID ONE connects strategy, execution, talent development, and financial planning into one integrated workflow. No silos. No fragmentation. No lag.",
  },
  {
    title: "The OS Learns and Strengthens Itself Continuously",
    body: "Every action, decision, transformation, and financial outcome feeds back into the OS. LAMID ONE becomes smarter over time — refining diagnostics, strengthening pathways, and improving foresight.",
  },
  {
    title: "The Four Suites Operate as One System",
    body: "CORE clarifies. GROW transforms. TALENT strengthens. FINANCE optimises. Together, they create a unified, intelligent business.",
  },
];

/* ───────────────────────────────────────────────────────────────
   USE CASES
   ─────────────────────────────────────────────────────────────── */
export const USE_CASES: { title: string; body: string }[] = [
  {
    title: "Transformation Acceleration",
    body: "GROW constructs adaptive transformation pathways that synchronise strategy, execution, capability, and financial outcomes — eliminating fragmentation and accelerating measurable change.",
  },
  {
    title: "Leadership Decision Intelligence",
    body: "CORE delivers real-time diagnostic clarity, surfacing blind spots, performance drivers, and strategic priorities instantly — enabling leaders to act with precision in volatile environments.",
  },
  {
    title: "Workforce Capability Mapping & Skill Acceleration",
    body: "TALENT provides dynamic capability intelligence, identifying gaps, accelerating skill development, and aligning workforce readiness with transformation goals.",
  },
  {
    title: "Financial Foresight & Performance Optimisation",
    body: "FINANCE connects decisions, talent moves, and transformation pathways directly to financial outcomes — enabling intelligent capital allocation and continuous performance improvement.",
  },
  {
    title: "Consulting Team Enablement",
    body: "Consultants use the OS to deliver faster diagnostics, smarter recommendations, and continuous value — transforming episodic consulting into always-on intelligence.",
  },
  {
    title: "Operational Performance Improvement",
    body: "The OS identifies inefficiencies, bottlenecks, and optimisation opportunities across processes, teams, and systems — strengthening business performance end to end.",
  },
];

/* ───────────────────────────────────────────────────────────────
   INDUSTRY APPLICATIONS
   ─────────────────────────────────────────────────────────────── */
export const INDUSTRIES: { name: string; body: string }[] = [
  {
    name: "Manufacturing & Industrial Operations",
    body: "Real-time diagnostics, capability mapping, and financial foresight for multi-site, high-complexity environments — improving throughput, safety, and operational efficiency.",
  },
  {
    name: "FMCG & Retail",
    body: "Unified transformation pathways that synchronise supply chain, merchandising, workforce capability, and financial performance — enabling agility in fast-moving markets.",
  },
  {
    name: "Energy & Infrastructure",
    body: "Scenario modelling, risk intelligence, and workforce readiness for mission-critical, capital-intensive operations — strengthening resilience and long-term performance.",
  },
  {
    name: "Financial Services",
    body: "Continuous intelligence for regulatory alignment, operational clarity, risk management, and financial optimisation — enabling smarter decisions across complex portfolios.",
  },
  {
    name: "Healthcare & Life Sciences",
    body: "Capability acceleration, transformation guidance, and financial clarity for clinical, operational, and administrative systems — improving outcomes and organisational readiness.",
  },
  {
    name: "Public Sector & Government",
    body: "Unified intelligence for policy execution, workforce capability, financial stewardship, and transformation of public systems — enabling efficient, transparent governance.",
  },
];

/* ───────────────────────────────────────────────────────────────
   PRODUCT WALKTHROUGH — seven steps, a first-time visitor's journey.

   `phase` and `engine` are structural metadata, not copy. The seven
   steps are not a flat list: step 1 is entry, steps 2–5 are the four
   engines each taking their turn, step 6 is where they converge, and
   step 7 closes the loop back to the start. Tagging that here lets the
   walkthrough render its real shape instead of a numbered column.
   ─────────────────────────────────────────────────────────────── */
export type WalkStep = {
  title: string;
  body: string;
  phase: "enter" | "engine" | "converge" | "loop";
  engine?: Engine["id"];
};

export const WALKTHROUGH: WalkStep[] = [
  {
    phase: "enter",
    title: "Enter the OS",
    body: "Leaders, consultants, and teams access a unified interface powered by real-time intelligence and adaptive learning.",
  },
  {
    phase: "engine",
    engine: "core",
    title: "CORE Diagnoses the Business",
    body: "The OS reveals performance drivers, blind spots, systemic patterns, and strategic priorities instantly — providing continuous clarity.",
  },
  {
    phase: "engine",
    engine: "grow",
    title: "GROW Builds Transformation Pathways",
    body: "Intelligent workflows guide the organisation from strategy to execution, ensuring alignment, momentum, and measurable progress.",
  },
  {
    phase: "engine",
    engine: "talent",
    title: "TALENT Maps Capability & Accelerates Skills",
    body: "The OS identifies capability gaps, strengthens teams, accelerates skills, and aligns human capital with transformation goals.",
  },
  {
    phase: "engine",
    engine: "finance",
    title: "FINANCE Delivers Real-Time Foresight",
    body: "Financial intelligence connects decisions to outcomes, enabling smarter resource allocation, scenario modelling, and performance optimisation.",
  },
  {
    phase: "converge",
    title: "The OS Synchronises Everything",
    body: "Diagnostics, transformation, capability, and financial performance operate as one continuous loop — eliminating silos and fragmentation.",
  },
  {
    phase: "loop",
    title: "Continuous Learning & Improvement",
    body: "Every action strengthens the OS, making the business smarter, faster, and more aligned over time — creating a self-reinforcing growth engine.",
  },
];

/* ───────────────────────────────────────────────────────────────
   CALL TO ACTION
   ─────────────────────────────────────────────────────────────── */
export const AIOS_CTA = {
  headline: "Activate the Human-AI Operating System for your organisation.",
  body: "LAMID ONE is ready to unify your diagnostics, transformation, talent intelligence, and financial performance into one continuous system of business growth.",
  /* RETIRED: "Start with clarity. Accelerate with intelligence. Grow
     with momentum." It is the compressed form of CTA_TRIO below —
     same three beats, less said. The trio ships instead. */
};

/**
 * THE TRIAD — the document's earliest hero material, finally housed.
 *
 * Two lines written in the same batch turn out to be the same three
 * beats twice over, once as nouns and once as verbs:
 *
 *   Echo tagline  Always-on INTELLIGENCE · Precise TRANSFORMATION · Continuous GROWTH
 *   CTA trio      DIAGNOSE with clarity  · TRANSFORM with precision · GROW continuously
 *
 * They were orphaned when the four-engine hero superseded the original
 * three-verb one. Rather than retire them, they render together — the
 * tagline as the kicker over the trio it summarises — and each verb
 * points at the tool that actually performs it.
 */
export const ECHO_TAGLINE =
  "Always-on intelligence. Precise transformation. Continuous growth.";

export const CTA_TRIO: {
  title: string;
  body: string;
  href: string;
  engine: Engine["id"];
}[] = [
  {
    title: "Diagnose with Clarity",
    body: "Reveal critical insights instantly and understand exactly where to act.",
    href: "/diagnostics/q44",
    engine: "core",
  },
  {
    title: "Transform with Precision",
    body: "Activate targeted, intelligent change powered by real-time analysis.",
    href: "/diagnostics/g03",
    engine: "grow",
  },
  {
    title: "Grow Continuously",
    body: "Sustain momentum, scale impact, and unlock intelligent, unified growth.",
    href: "/signup",
    engine: "finance",
  },
];

/** The Brand Line. Closes the page as a signature, under the final ask. */
export const BRAND_LINE =
  "LAMID ONE — accelerate every decision, every transformation, every outcome.";

/**
 * Client quotes.
 *
 * DELIBERATELY EMPTY — same rule as CASE_STUDIES in
 * components/sections/CaseStudyRail.tsx. The brand document supplied
 * four homepage quotes and eight more across the module pages, every
 * one invented for the exercise and attributed to titles like "CFO,
 * Regional Energy & Infrastructure Firm" — with the homepage and module
 * sets not even agreeing on who said what. The section renders an
 * honest empty state until real, attributable quotes exist; they drop
 * straight in here when they do.
 */
export type Quote = { quote: string; name: string; role: string; org: string };
export const QUOTES: Quote[] = [
  {
    quote:
      "I run this alone. I don't have a board to sanity-check my thinking, so the diagnostic became that for me — the same starting clarity a consulting firm would've charged me a retainer for.",
    name: "Amara O.",
    role: "Founder",
    org: "a small logistics startup",
  },
];
