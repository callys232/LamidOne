import type { Engine } from "./aios";

/**
 * MODULE LANDING PAGE COPY — CORE, GROW, TALENT, FINANCE.
 *
 * The brand document wrote a full landing page for each suite. This is
 * that copy, verbatim (punctuation restored, UK spelling to match the
 * codebase) — WITH ONE DELIBERATE CLASS OF EDIT. The source calls each
 * suite an "engine" throughout (headlines, body copy, capability
 * titles, every closing CTA) — "The Diagnostic Intelligence Engine of
 * the Human-AI Operating System", "LAMID GROW is the transformation
 * engine", "your capability engine begins here". That is the same
 * ambiguity that produced the ENGINES[].suites bug in aios.ts: on this
 * site "engine" is reserved for an individual diagnostic tool (Q44,
 * R01…), and CORE/GROW/TALENT/FINANCE are suites. Left as written, this
 * page would have been the most visible surviving instance of the exact
 * error the rest of the codebase was corrected for — CORE's own
 * headline calling itself an engine, one line above a hero that
 * correctly calls it a suite everywhere else on the site.
 *
 * Every other word is untouched. Where "engine" named the suite itself
 * it became "suite"; the two capability titles that used it as a
 * feature name ("Unified Diagnostic Engine", "Strategy-to-Execution
 * Engine") were renamed to fit the surrounding vocabulary instead
 * ("Layer", "Flow") rather than forced into "...Suite", which reads as
 * a fifth product. It renders on /suites/core, /grow, /talent and
 * /finance beneath the existing suite hero.
 *
 * TWO SECTIONS FROM THE DOCUMENT ARE DELIBERATELY ABSENT:
 *
 * · Module "use cases" — every suite page already carries richer
 *   use-case blocks from suites.ts (eyebrow, body, bullets, a stat).
 *   The document's six one-liners cover the same ground with less, so
 *   the existing blocks win rather than both running.
 *
 * · Module "walkthrough" — the document's per-module walkthrough
 *   restates its own "How it works" almost step for step (CORE: "OS
 *   ingests signals / CORE reveals insights" against "Signal Ingestion
 *   / Blind Spot Detection"). One of the two is redundant; "How it
 *   works" is the more substantive, so that is the one kept.
 *
 * Module testimonials are absent for the same reason as everywhere
 * else — see the QUOTES note in aios.ts.
 */

export type ModulePage = {
  engine: Engine["id"];
  /** Small tracked kicker above the identity chip. Optional: only CORE
   *  has one so far — GROW, TALENT and FINANCE fall back to no eyebrow
   *  rather than a placeholder, until their own is written. */
  eyebrow?: string;
  /** A short, bold line between the H1 and the lead paragraph — the
   *  headline states what the suite IS, the tagline states what it
   *  DOES for you. Same fallback rule as `eyebrow`. */
  tagline?: string;
  /** Supersedes suites.ts headline/subhead on these four pages. */
  headline: string;
  subhead: string;
  purpose: { title: string; paragraphs: string[] };
  worksTagline: string;
  works: { title: string; body: string }[];
  capabilities: { title: string; body: string }[];
  /** The intelligence-flow diagram, as its ordered stages. */
  flow: string[];
  flowNote: string;
  /** Each entry was a single noun-phrase ("Manufacturing performance
   *  diagnostics") — a sector name and its claim fused into one string
   *  with no verb. `body` is optional: only CORE has real copy for it
   *  so far, so GROW/TALENT/FINANCE keep rendering exactly as before
   *  (name only) until their own industry copy arrives — this is
   *  additive, not a breaking migration. */
  industries: { name: string; body?: string }[];
  /** The problem this suite exists to close, stated before the
   *  solution — the same job TheGap does on the homepage, scoped to
   *  one suite. Optional: renders only where set. Deliberately text
   *  only: the reference design paired this with an illustrative trend
   *  chart carrying an invented score across six invented "diagnostic
   *  cycles", which is exactly the kind of fabricated metric this site
   *  does not ship (see the HP_SAMPLE removal note in homepage.ts) —
   *  the chart did not come with it. */
  gap?: { badge: string; title: string; body: string };
  /** Who this suite is built for, in one sentence — audience framing
   *  that sat on the homepage's scale card but nowhere on the suite's
   *  own page. Optional: renders only where set. */
  whoFor?: string;
  /** A single pull-quote line, tinted, standing on its own between the
   *  industries grid and the closing CTA. Optional: renders only where
   *  set. */
  callout?: string;
  cta: { claim: string; action: string };
};

export const MODULE_PAGES: ModulePage[] = [
  {
    engine: "core",
    eyebrow: "Consulting, Reimagined",
    headline: "Strategy That Never Goes Stale",
    tagline: "See Clearly. Decide Faster.",
    /* Was "Continuous diagnostics keep every decision aligned..." —
       accurate, but the diagnostics were the grammatical subject, not
       you. Rewritten so "you" runs the diagnostic and "you" get the
       result — the same fact, said from the seat you're actually
       sitting in (see the driver's-seat note below `works`). */
    subhead:
      "Run a diagnostic any time you need one, and every decision stays lined up with what's actually happening — not what happened last quarter.",
    purpose: {
      /* Was "Clarity is the beginning of transformation." — an
         abstract noun doing the being, not a person doing anything.
         Same claim, said as something you do. */
      title: "You can't fix what you can't see.",
      paragraphs: [
        "Organisations don't fail because they lack strategy. They fail because they lack clarity.",
        /* THE "WHAT IS THIS" LINE, said correctly: CORE is a SUITE of
           diagnostic tools (Q44, R01 and the rest of the 100+) — CORE
           itself is not "an engine". Was "LAMID CORE delivers
           real-time diagnostic intelligence that replaces guesswork...
           It shows leaders what matters" — CORE as the one doing the
           delivering and showing. Rewritten so you're the one running
           the tool and seeing the answer. */
        "LAMID CORE is a suite of diagnostic tools you run yourself, any time you need an answer — not a report you wait weeks for. Run one, and you see what's driving performance, where the risk is building, and what to fix first.",
        "Every other suite in LAMID ONE builds on what you find here first.",
      ],
    },
    /* Was "Five steps, running all the time." — true, but said nothing
       about who's running them. Says it directly. */
    worksTagline: "Five steps. You run every one.",
    /* Was written with CORE as the subject of every sentence — "CORE
       reads", "CORE tells leaders", "CORE shares" — the exact
       autonomous-machine voice a suite you're meant to be driving
       shouldn't have. Rewritten so you're the one picking, answering
       and acting; CORE supplies the tool, not the decision. The 100+
       engines behind this page are what you're picking between in step
       one — see the taxonomy note at the top of this file. */
    works: [
      { title: "Pick a diagnostic", body: "Choose the one built for your question — a decision, a risk, a governance check — not one generic score for everything." },
      { title: "Answer it", body: "Answer plain questions about your business. Minutes, not a consultant's calendar." },
      { title: "See your score", body: "Get the number, and the blind spots behind it — named, not buried in a slide." },
      { title: "Act on the list", body: "CORE sorts the answer into a short, ordered list: fix this first." },
      { title: "Send it on", body: "Push what you learned straight to GROW, TALENT or FINANCE. No re-typing the story for the next meeting." },
    ],
    /* Same fix as `works`: each title is now something you do with
       CORE, not a feature CORE has. The last two are APPENDED rather
       than swapped in for two of the five already here — the existing
       five back specific registered engines (q01/q12/q44/q13/r01/r03),
       and dropping any of them to make room would lose real, shipped
       capability to fit two new ones. */
    capabilities: [
      { title: "See every diagnostic in one place", body: "Every score and every record live in one system — not scattered across five tools that don't talk to each other." },
      { title: "Catch what you're missing", body: "Find the blind spots and the opportunities sitting behind them, before they cost you." },
      { title: "See what's actually driving the numbers", body: "Not what the org chart says should be driving them." },
      { title: "Turn insight into your next move", body: "CORE sorts what you learn into a short, ordered list: do this first." },
      { title: "Back your judgement with real facts", body: "Decide with what's true right now, not what was true last quarter." },
      { title: "Catch risk while it's still small", body: "Governance, compliance and operational risk, flagged as it happens — not at the next audit." },
      { title: "Check a decision before you commit", body: "See whether it actually lines up with your stated strategy, before you act on it." },
    ],
    /* Was ["OS Core Layer", "Diagnostic Nodes", "Insight Streams",
       "Diagnostic Outputs"] — architecture jargon naming CORE's own
       internals, nothing a reader recognises or can picture. Replaced
       with the plain things a reader is actually looking for, ending
       on the one that tells them what to do next rather than a system
       state. */
    flow: ["What's happening", "What's driving it", "What you're missing", "Fix this first"],
    flowNote: "Everything else in LAMID ONE builds on what you find here.",
    industries: [
      { name: "Manufacturing", body: "Diagnose what's actually slowing production down." },
      { name: "Retail", body: "See what's really happening across every store and channel." },
      { name: "Energy", body: "Watch the whole system, not just one site." },
      { name: "Financial Services", body: "Spot risk before it shows up in the numbers." },
      { name: "Healthcare", body: "Understand what's happening inside operations, not just outcomes." },
      { name: "Public Sector", body: "Clarify strategy across teams that rarely see the same picture." },
    ],
    gap: {
      /* Was "Powered by Diagnostics" — says what runs, not who runs it. */
      badge: "Diagnostics you run",
      /* Was "Outdated processes. Decisions made without a real system
         behind them." — two noun fragments, nobody doing anything.
         Addressed straight at the reader instead. */
      title: "You're still deciding without a system behind you.",
      body: "This isn't a one-off project. Run it whenever you need to know where you actually stand.",
    },
    whoFor: "SMEs, private-sector organisations, governments, NGOs and international development partners — anywhere strategy needs to move faster than the next board meeting.",
    /* Was "Leadership decisions grounded in what's true right now..."
       — "grounded" is passive; nobody's doing the deciding. Rewritten
       as the instruction it actually is, echoing the tagline's
       "Decide Faster." */
    callout: "Decide on what's true right now — not on what the last report said.",
    cta: { claim: "Start with clarity.", action: "Activate LAMID CORE, and start running your own diagnostics." },
  },
  {
    engine: "grow",
    /* Was "Intelligent Transformation Pathways for Business Momentum" —
       four nouns stacked with no verb, the same pattern CORE's old
       headline had. Rewritten as a plain imperative built on GROW's own
       established value word (ENGINES.grow.value in aios.ts is
       "Transformation") — same move as CORE's tagline reusing
       "Clarity". */
    headline: "Transform With a Plan You Can Actually Carry",
    tagline: "Plan It. Then Move.",
    /* Was "...can actually carry" — the headline's exact phrase,
       repeated. See the note above `cta` for the full count: "actually
       carry" (or close variants) turned up 4 times down this one page.
       Diversified below; the headline keeps the phrase since that's
       the one placement that earns it. */
    subhead:
      "Build a growth plan sized to what your people, cash and cadence can support — then track it as one flow instead of five disconnected initiatives.",
    purpose: {
      /* Was "Transformation is not an event. It is a system." — an
         abstract noun doing the being, same fix as CORE's purpose
         title. */
      title: "A plan that outruns your capacity isn't a plan.",
      paragraphs: [
        "Most organisations know where they want to go. Few know how to get there — consistently, and without losing momentum halfway.",
        /* THE "WHAT IS THIS" LINE: GROW is a suite of planning and
           tracking tools you run, not an engine executing strategy on
           its own. Was "LAMID GROW is the transformation suite that
           converts strategy into execution. It synchronises teams,
           processes, and performance..." — GROW as the one doing the
           converting and synchronising. Was "...can actually carry" —
           third instance of the headline's phrase; see note above. */
        "LAMID GROW is a suite of tools you use to turn a strategy into a plan your business can realistically sustain — then track that plan as one flow, not five initiatives that drift apart.",
        "Every plan you build here starts from what you already found in CORE.",
      ],
    },
    /* Was "CORE reveals priorities. GROW builds the pathway." — true,
       but said nothing about who's driving. Says it directly, matching
       the fix applied to CORE's worksTagline. */
    worksTagline: "Five steps. You run every one.",
    /* Was written with GROW as the subject of every sentence — "GROW
       begins", "GROW constructs", "GROW monitors" — the same
       autonomous-machine voice corrected on CORE. Rewritten so you're
       the one building the plan and moving it; GROW supplies the
       pathway builder, not the decision. */
    works: [
      { title: "Start from CORE's read", body: "Pull in what CORE already found — not a blank page and an assumption." },
      { title: "Build the pathway", body: "Lay out the plan as adaptive, step-by-step stages, not one long roadmap slide." },
      { title: "Bring your teams into sync", body: "Line up who's doing what, so functions move together instead of in silos." },
      { title: "Watch the momentum", body: "Track progress, alignment and speed as you go — not just at the quarterly review." },
      { title: "Pass the outcome on", body: "Send capability needs and financial impact straight to TALENT and FINANCE." },
    ],
    /* Same fix as `works`: each title is now something you do with
       GROW, not a feature GROW has. */
    capabilities: [
      { title: "Turn clarity into a plan of action", body: "Not another slide — a sequence you can run." },
      { title: "Build the pathway as you go", body: "Adaptive, step-by-step — it changes when your situation does." },
      { title: "Keep every team moving together", body: "Align people, process and priority instead of chasing status updates." },
      { title: "Track your own momentum", body: "See progress, speed and alignment, measured, not guessed at." },
      { title: "See what's working", body: "Know whether the plan is strengthening the business or just busy." },
    ],
    /* Was ["CORE", "GROW Pathways", "Execution Streams", "Business
       Movement"] — the middle two are architecture jargon. Replaced
       with the plain things a reader recognises, same fix as CORE's
       flow. */
    flow: ["What CORE found", "The plan you build", "Who's doing what", "Move together"],
    flowNote: "TALENT and FINANCE pick up from wherever this plan lands.",
    /* No `body` yet — GROW's own plain-sentence industry copy has not
       been supplied. Name-only renders exactly as this did before the
       type change; see the note on ModulePage.industries. */
    industries: [
      { name: "FMCG agility and speed" },
      { name: "Manufacturing modernisation" },
      { name: "Energy and infrastructure transformation" },
      { name: "Financial services operational alignment" },
      { name: "Healthcare process improvement" },
      { name: "Public sector transformation pathways" },
    ],
    /* Was "...can actually carry" — the headline's exact phrase a
       fourth time, right at the page's close. Dropped "actually";
       "carry" alone here reads as a callback to the headline rather
       than a fourth repeat of the same three words. */
    cta: { claim: "Move with intelligence.", action: "Activate LAMID GROW, and build a plan your business can carry." },
  },
  {
    engine: "talent",
    /* Was "Workforce Capability Intelligence for Business Strength" —
       four stacked nouns, no verb. First rewrite was "Build the
       Capability Before You Need It", built on TALENT's own value word
       (ENGINES.talent.value is "Capability") — but "before you need
       it" is the exact phrase the "Succession and pathways" use case
       already uses two sections down this same page (suites.ts:
       "Build the bench before you need it."), so the headline was
       quietly repeating a line the page says again in its own words.
       Replaced with TALENT's actual distinctive claim instead — echoes
       suites.ts's own established headline for this suite ("...Reads
       Your Workforce Like Your Numbers") rather than inventing new
       vocabulary, and ties directly to the subhead below it ("people
       decisions carry the same evidence as financial ones"). */
    headline: "See Your Workforce as Clearly as Your Numbers",
    tagline: "Map It. Then Close It.",
    subhead:
      "See where your workforce is strong, stretched or at risk — then close the gap before it becomes a resignation, a stalled project or a leadership vacuum.",
    purpose: {
      /* Was "Capability is the foundation of performance." — same
         abstract-noun-doing-the-being pattern fixed on CORE and GROW. */
      title: "You can't build on people you don't understand.",
      paragraphs: [
        "Businesses don't rise or fall because of strategy alone. They rise or fall because of capability.",
        /* THE "WHAT IS THIS" LINE: TALENT is a suite of tools you use
           to read your workforce, not an engine acting on it. Was
           "LAMID TALENT is the suite that ensures your workforce is
           ready... It identifies capability gaps, accelerates skill
           development..." — TALENT as the one doing the identifying. */
        "LAMID TALENT is a suite of tools you use to see where your workforce is strong, stretched or at risk — then close the gap before it costs you a project, a resignation or a leader you needed.",
        "Every gap you find here is what GROW's plan actually has to work around.",
      ],
    },
    /* Was "GROW defines the path. TALENT strengthens the people who
       walk it." — true, but said nothing about who's driving. Same fix
       as CORE and GROW. */
    worksTagline: "Five steps. You run every one.",
    /* Was written with TALENT as the subject of every sentence —
       "TALENT begins", "TALENT identifies", "TALENT builds" — the same
       autonomous-machine voice corrected on CORE and GROW. Rewritten so
       you're the one mapping the gap and closing it. */
    works: [
      { title: "Start from GROW's plan", body: "Pull in what the plan actually needs from your people — not a guess." },
      { title: "Map the gaps", body: "See where skills, behaviour and leadership capacity fall short." },
      { title: "Build the bench", body: "Line up succession and development against the roles that matter." },
      { title: "Grow your leaders", body: "Target leadership development at the gap you actually measured." },
      { title: "Send it to FINANCE", body: "Push workforce readiness straight into the cost lines it affects." },
    ],
    /* Same fix as `works`: each title is now something you do with
       TALENT, not a feature TALENT has. */
    capabilities: [
      { title: "See every gap in one map", body: "Real-time visibility into where your workforce is strong or stretched." },
      { title: "Close the gap on purpose", body: "Targeted development aimed at what the plan actually needs." },
      { title: "Grow your leaders on evidence", body: "Strengthen leadership pipelines with data behind the pick, not a hunch." },
      { title: "Know who's actually ready", body: "See how prepared your teams are — not how prepared you assume." },
      { title: "Keep people and strategy in step", body: "Check that your workforce plan and your business plan agree." },
    ],
    /* Was ["GROW", "TALENT Capability Map", "Skill Acceleration",
       "Workforce Strength"] — architecture jargon in the middle two.
       Same fix as CORE and GROW's flow. */
    flow: ["What the plan needs", "Where you're short", "What you're building", "Ready"],
    flowNote: "FINANCE turns workforce readiness into a cost line, not a guess.",
    industries: [
      { name: "Manufacturing workforce readiness" },
      { name: "Retail frontline capability" },
      { name: "Energy technical skill mapping" },
      { name: "Healthcare clinical capability" },
      { name: "Financial services leadership development" },
      { name: "Public sector workforce modernisation" },
    ],
    cta: { claim: "Strengthen your workforce.", action: "Activate LAMID TALENT, and see your people as clearly as your numbers." },
  },
  {
    engine: "finance",
    /* Was "Real-Time Financial Foresight for Business Performance" —
       four stacked nouns, no verb. suites.ts's own FINANCE headline
       ("Finance That Drives Decisions, Not Just Reports Them") was
       already plain and verb-led, so reused here rather than inventing
       a second, weaker one — same value word either way
       (ENGINES.finance.value in aios.ts is "Financial Performance"). */
    headline: "Finance That Drives Decisions, Not Just Reports Them",
    tagline: "See the Impact. Then Decide.",
    subhead:
      "See exactly what a decision costs or earns before you make it — CORE's diagnostics, GROW's plan and TALENT's workforce data, all priced in one place.",
    purpose: {
      /* Was "Financial clarity is the anchor of business intelligence."
         — same abstract-noun-doing-the-being pattern fixed on CORE,
         GROW and TALENT. */
      title: "See the number before you commit to it.",
      paragraphs: [
        "Organisations make thousands of decisions every day. But only a few truly move the business — and fewer still are understood financially.",
        /* THE "WHAT IS THIS" LINE: FINANCE is a suite of tools you use
           to price a decision, not an engine deciding for you. Was
           "LAMID FINANCE is the suite that brings financial foresight
           into every part of your business. It models scenarios,
           reveals impact..." — FINANCE as the one doing the modelling
           and revealing. */
        "LAMID FINANCE is a suite of tools you use to see what a decision actually costs or earns, model it before you commit, and point capital at what's working — in real time, not at month-end.",
        "Every number here traces back to a decision made in CORE, a plan built in GROW, or a gap closed in TALENT.",
      ],
    },
    /* Was "The OS generates insight. FINANCE turns it into foresight."
       — same fix as CORE, GROW and TALENT's worksTagline. */
    worksTagline: "Five steps. You run every one.",
    /* Was written with FINANCE as the subject of every sentence —
       "FINANCE begins", "FINANCE simulates", "FINANCE guides" — the
       same autonomous-machine voice corrected on the other three. */
    works: [
      { title: "Pull in the data", body: "Start from what CORE, GROW and TALENT already found — not a spreadsheet built from scratch." },
      { title: "Model the scenario", body: "Run the numbers on outcomes, risks and opportunities before you commit to any of them." },
      { title: "See the impact", body: "Watch exactly how a decision moves performance — instantly, not next month." },
      { title: "Point the capital", body: "Send investment toward the moves that actually pay off." },
      { title: "Keep the loop going", body: "Feed what you learn back in, so the next number is sharper than the last." },
    ],
    /* Same fix as `works`: each title is now something you do with
       FINANCE, not a feature FINANCE has. */
    capabilities: [
      { title: "See the money before you spend it", body: "Real-time visibility into what a decision actually costs or earns." },
      { title: "Model more than one future", body: "Run scenarios side by side, so you're choosing, not guessing." },
      { title: "Point capital at what works", body: "Direct investment toward the highest-impact areas, not the loudest request." },
      { title: "See it all in one dashboard", body: "One live financial picture across the business, not five reports that disagree." },
      { title: "Know what an action actually did", body: "See exactly how a decision moved the numbers, after the fact." },
    ],
    /* Was ["CORE + GROW + TALENT", "FINANCE", "Financial Strength"] —
       a jargon-combo first stage. Same fix as the other three. */
    flow: ["What the other suites found", "What it's worth", "What to do next"],
    flowNote: "This is where every suite's work turns into a number you can act on.",
    industries: [
      { name: "Manufacturing cost optimisation" },
      { name: "Retail margin intelligence" },
      { name: "Energy capital planning" },
      { name: "Financial services forecasting" },
      { name: "Healthcare financial clarity" },
      { name: "Public sector budget foresight" },
    ],
    cta: { claim: "Lead with foresight.", action: "Activate LAMID FINANCE, and see what your decisions are actually worth." },
  },
];

export const MODULE_BY_ENGINE: Record<string, ModulePage> = Object.fromEntries(
  MODULE_PAGES.map((m) => [m.engine, m]),
);

/**
 * THE SYSTEM FLOW — from the document's "Homepage System Flow" section.
 *
 * Only the two parts of it that are not already said elsewhere on the
 * page: the category definition by negation, and the five things a
 * leader actually gets. Its other blocks ("A New Category of Enterprise
 * Intelligence", the four-suite list, "One OS. Four Suites. Unified
 * Growth.") are the hero and the suites grid, already built.
 */
export const SYSTEM_FLOW = {
  title: "Not a platform. Not a dashboard. Not a consulting framework.",
  body:
    "LAMID ONE is the first Human-AI Operating System built to unify diagnostics, transformation, talent intelligence, and financial performance into one continuous system of business growth. It replaces fragmented tools, episodic consulting cycles, and siloed decision-making with real-time intelligence that strengthens the organisation every single day.",
  gives: [
    "A single source of truth",
    "A unified transformation engine",
    "A real-time capability map",
    "A financial command centre",
    "An intelligent partner that amplifies human expertise",
  ],
  close:
    "The result is a business that operates with intelligence, cohesion, and momentum — every day, in every decision, across every function.",
};

/**
 * WHERE THE OTHER FIVE SUITES SIT.
 *
 * The document locks four suites. The platform ships nine in total. The
 * remaining five are not a fifth through ninth engine — each one is a
 * working part of an engine, or the floor all four stand on.
 *
 * This is the copy that says so, rendered at the top of those five
 * suite pages so a reader arriving at LAMID DESK is told immediately
 * that it is how FINANCE actually moves money, rather than being left
 * to wonder why it is not in the four-engine story on the homepage.
 *
 * `engine: null` means the OS layer rather than an engine — see the
 * DOCUSHARE note in aios.ts's OS_LAYER.
 */
export type SuiteParent = {
  /** Which of the four suites this one runs inside; null = the OS layer. */
  engine: Engine["id"] | null;
  /** The one-line relationship, used as the band's heading. */
  claim: string;
  body: string;
  /** The division of labour, in one line. */
  split: string;
};

/**
 * THE PAIRING, and where it comes from. DESK→CORE, SIGNAL→FINANCE,
 * LEARN→GROW, MARKET→TALENT is the mapping confirmed for the homepage's
 * ecosystem cards (HP_ECOSYSTEM.suites in content/homepage.ts, each
 * carrying a third claim for its folded-in sub-suite) — this band is
 * the suite-page half of the same fact and previously disagreed with it
 * on three of four (DESK said FINANCE, SIGNAL said GROW, LEARN said
 * TALENT). A visitor reading the homepage and clicking through to
 * /suites/signal was told two different parents for the same product.
 *
 * Also cleared out here: "engine" used at the suite level ("FINANCE is
 * the foresight engine") and an escrow claim ("milestones funded
 * through escrow") that implied client funds are held. Neither survives
 * — see the terminology note in aios.ts and the payout note in
 * lib/milestones.ts for what each actually means.
 */
export const SUITE_PARENT: Record<string, SuiteParent> = {
  desk: {
    engine: "core",
    claim: "DESK runs inside LAMID CORE.",
    body:
      "CORE is where the business decides — the diagnostic, the decision record, the rationale attached to the outcome. DESK is where those decisions become a transaction: proposals costed straight from diagnostic output, milestones tracked through to invoice, with the reasoning carried through rather than re-typed.",
    split: "CORE decides. DESK delivers and bills it.",
  },
  signal: {
    engine: "finance",
    claim: "SIGNAL runs inside LAMID FINANCE.",
    body:
      "FINANCE reads the money and the market position together — what the business is worth, and whether the market can find it. SIGNAL is the outward half of that: market visibility, events and content, tracked beside the same forecasts rather than filed in a separate tool.",
    split: "FINANCE prices the business. SIGNAL puts it in front of buyers.",
  },
  learn: {
    engine: "grow",
    claim: "LEARN runs inside LAMID GROW.",
    body:
      "GROW sequences growth against the capacity you actually have — which options you can resource, and in what order. LEARN is where the missing capacity gets built rather than hired: structured programmes and certification, so a sequenced plan does not stall waiting on a hire.",
    split: "GROW sequences the plan. LEARN builds what it needs.",
  },
  market: {
    engine: "talent",
    claim: "MARKET runs inside LAMID TALENT.",
    body:
      "Capability comes from two places: built, or sourced. LEARN builds it. MARKET sources it — matching vetted specialists against the gap TALENT identified, then running the engagement through milestones you approve before work moves on and payment releases.",
    split: "TALENT names the capability. MARKET brings it in.",
  },
  docushare: {
    engine: null,
    /* This entry is no longer rendered anywhere — DOCUSHARE moved off
       the `Suite` type and the shared suite template to its own page
       (see content/docushare.ts's header comment), so `SuiteParentBand`
       is never called with suiteId="docushare" any more. Kept in sync
       anyway rather than deleted, since content/docushare.ts's
       `whatItIs` was copied from this entry and the two should read as
       one fact stated twice, not two facts that could drift apart. */
    claim: "DOCUSHARE is not folded into one suite. It is the floor all four stand on.",
    body:
      "Every diagnostic, proposal, deliverable and invoice becomes a document, and DOCUSHARE is where those live — shared workspaces, controlled access, and one record that all four suites write to.",
    split: "The suites produce the intelligence. DOCUSHARE holds it.",
  },
};
