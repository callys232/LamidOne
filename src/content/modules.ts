import type { Engine } from "./aios";

/**
 * MODULE LANDING PAGE COPY — CORE, GROW, TALENT, FINANCE.
 *
 * The brand document wrote a full landing page for each engine. This is
 * that copy, verbatim (punctuation restored, UK spelling to match the
 * codebase). It renders on /suites/core, /grow, /talent and /finance
 * beneath the existing suite hero.
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
  industries: string[];
  cta: { claim: string; action: string };
};

export const MODULE_PAGES: ModulePage[] = [
  {
    engine: "core",
    headline: "The Diagnostic Intelligence Engine of the Human-AI Operating System",
    subhead:
      "CORE reveals blind spots, performance drivers, and strategic priorities instantly — giving leaders clarity that strengthens every decision.",
    purpose: {
      title: "Clarity is the beginning of transformation.",
      paragraphs: [
        "Organisations don’t fail because they lack strategy. They fail because they lack clarity.",
        "LAMID CORE delivers real-time diagnostic intelligence that replaces guesswork, fragmented reporting, and episodic consulting with continuous insight. It shows leaders what matters, why it matters, and where to act — right now.",
        "CORE is the engine that powers every other part of the OS.",
      ],
    },
    worksTagline: "The OS ingests. CORE interprets. Clarity emerges.",
    works: [
      { title: "Signal Ingestion", body: "CORE receives business signals across operations, talent, finance, and transformation." },
      { title: "Pattern Interpretation", body: "The engine identifies performance drivers, systemic patterns, and emerging risks." },
      { title: "Blind Spot Detection", body: "CORE reveals what leaders cannot see — instantly." },
      { title: "Strategic Clarity Mapping", body: "Insights are organised into clear priorities and actionable intelligence." },
      { title: "OS Synchronisation", body: "CORE feeds clarity into GROW, TALENT, and FINANCE, powering the entire system." },
    ],
    capabilities: [
      { title: "Unified Diagnostic Engine", body: "One place where business clarity lives." },
      { title: "Blind Spot Detection", body: "Reveals hidden constraints and unseen opportunities." },
      { title: "Performance Driver Analysis", body: "Shows what is actually moving the business." },
      { title: "Strategic Priority Mapping", body: "Converts insight into direction." },
      { title: "Decision Intelligence", body: "Strengthens leadership judgement with real-time clarity." },
    ],
    flow: ["OS Core Layer", "Diagnostic Nodes", "Insight Streams", "Engine Outputs"],
    flowNote: "CORE is the intelligence layer that makes the entire OS smarter.",
    industries: [
      "Manufacturing performance diagnostics",
      "Retail operational clarity",
      "Energy system visibility",
      "Financial services risk intelligence",
      "Healthcare operational insight",
      "Public sector strategic clarity",
    ],
    cta: { claim: "Start with clarity.", action: "Activate LAMID CORE — your diagnostic intelligence engine begins here." },
  },
  {
    engine: "grow",
    headline: "Intelligent Transformation Pathways for Business Momentum",
    subhead:
      "GROW turns strategy into coordinated movement — accelerating transformation with precision, alignment, and measurable progress.",
    purpose: {
      title: "Transformation is not an event. It is a system.",
      paragraphs: [
        "Most organisations know where they want to go. Few know how to get there — consistently, intelligently, and without losing momentum.",
        "LAMID GROW is the transformation engine that converts strategy into execution. It synchronises teams, processes, and performance into one unified movement, eliminating fragmentation and accelerating business change.",
        "GROW is the engine that gives transformation a rhythm.",
      ],
    },
    worksTagline: "CORE reveals priorities. GROW builds the pathway.",
    works: [
      { title: "Receives Diagnostic Clarity from CORE", body: "GROW begins with insight — not assumptions." },
      { title: "Builds Intelligent Transformation Pathways", body: "The engine constructs adaptive, step-by-step transformation flows." },
      { title: "Synchronises Execution Across Functions", body: "Teams move together, not in silos." },
      { title: "Tracks Momentum and Progress", body: "GROW monitors movement, alignment, and velocity." },
      { title: "Feeds Outcomes into TALENT and FINANCE", body: "Capability needs and financial impact flow directly into the OS." },
    ],
    capabilities: [
      { title: "Strategy-to-Execution Engine", body: "Converts clarity into coordinated action." },
      { title: "Transformation Pathway Builder", body: "Creates intelligent, adaptive transformation flows." },
      { title: "Cross-Functional Synchronisation", body: "Aligns teams, processes, and priorities." },
      { title: "Momentum Tracking", body: "Measures progress, velocity, and alignment." },
      { title: "Performance Intelligence", body: "Shows how transformation is strengthening the business." },
    ],
    flow: ["CORE", "GROW Pathways", "Execution Streams", "Business Movement"],
    flowNote: "GROW is the movement engine of the OS.",
    industries: [
      "FMCG agility and speed",
      "Manufacturing modernisation",
      "Energy and infrastructure transformation",
      "Financial services operational alignment",
      "Healthcare process improvement",
      "Public sector transformation pathways",
    ],
    cta: { claim: "Move with intelligence.", action: "Activate LAMID GROW — your transformation engine begins here." },
  },
  {
    engine: "talent",
    headline: "Workforce Capability Intelligence for Business Strength",
    subhead:
      "TALENT maps capability gaps, accelerates skill development, and aligns human capital with transformation goals — strengthening the workforce at every level.",
    purpose: {
      title: "Capability is the foundation of performance.",
      paragraphs: [
        "Businesses don’t rise or fall because of strategy alone. They rise or fall because of capability.",
        "LAMID TALENT is the engine that ensures your workforce is ready for transformation. It identifies capability gaps, accelerates skill development, strengthens leadership pipelines, and aligns human capital with business priorities.",
        "TALENT is where people and transformation meet.",
      ],
    },
    worksTagline: "GROW defines the path. TALENT strengthens the people who walk it.",
    works: [
      { title: "Receives Transformation Needs from GROW", body: "TALENT begins with clarity about what the business must become." },
      { title: "Maps Capability Gaps", body: "The engine identifies where skills, behaviours, and leadership capacity must grow." },
      { title: "Accelerates Skill Development", body: "TALENT builds targeted capability acceleration flows." },
      { title: "Strengthens Leadership Pipelines", body: "The engine identifies, develops, and elevates leaders." },
      { title: "Feeds Capability Intelligence into FINANCE", body: "Workforce readiness becomes part of financial foresight." },
    ],
    capabilities: [
      { title: "Capability Mapping", body: "Real-time visibility into workforce strengths and gaps." },
      { title: "Skill Acceleration", body: "Targeted development aligned with transformation needs." },
      { title: "Leadership Development", body: "Strengthens leadership pipelines across your business." },
      { title: "Workforce Readiness Intelligence", body: "Shows how prepared teams are for transformation." },
      { title: "Talent-Transformation Alignment", body: "Ensures people and strategy move together." },
    ],
    flow: ["GROW", "TALENT Capability Map", "Skill Acceleration", "Workforce Strength"],
    flowNote: "TALENT is the capability engine of the OS.",
    industries: [
      "Manufacturing workforce readiness",
      "Retail frontline capability",
      "Energy technical skill mapping",
      "Healthcare clinical capability",
      "Financial services leadership development",
      "Public sector workforce modernisation",
    ],
    cta: { claim: "Strengthen your workforce.", action: "Activate LAMID TALENT — your capability engine begins here." },
  },
  {
    engine: "finance",
    headline: "Real-Time Financial Foresight for Business Performance",
    subhead:
      "FINANCE reveals the financial impact of every decision — connecting diagnostics, transformation, and capability directly to performance outcomes.",
    purpose: {
      title: "Financial clarity is the anchor of business intelligence.",
      paragraphs: [
        "Organisations make thousands of decisions every day. But only a few truly move the business — and fewer still are understood financially.",
        "LAMID FINANCE is the engine that brings financial foresight into every part of your business. It models scenarios, reveals impact, optimises capital allocation, and strengthens performance — all in real time.",
        "FINANCE is where intelligence becomes value.",
      ],
    },
    worksTagline: "The OS generates insight. FINANCE turns it into foresight.",
    works: [
      { title: "Receives Data from CORE, GROW and TALENT", body: "FINANCE begins with unified intelligence — not isolated spreadsheets." },
      { title: "Models Financial Scenarios", body: "The engine simulates outcomes, risks, and opportunities." },
      { title: "Reveals Financial Impact", body: "Leaders see how decisions affect performance instantly." },
      { title: "Optimises Capital Allocation", body: "FINANCE guides investment toward the highest-value moves." },
      { title: "Strengthens Business Performance", body: "Financial clarity becomes a continuous growth loop." },
    ],
    capabilities: [
      { title: "Financial Foresight", body: "Real-time visibility into the financial implications of decisions." },
      { title: "Scenario Modelling", body: "Simulates multiple futures to guide smarter choices." },
      { title: "Capital Allocation Intelligence", body: "Directs investment toward the highest-impact areas." },
      { title: "Performance Dashboards", body: "Unified financial clarity across your business." },
      { title: "Decision Impact Analysis", body: "Shows leaders exactly how actions affect outcomes." },
    ],
    flow: ["CORE + GROW + TALENT", "FINANCE", "Financial Strength"],
    flowNote: "FINANCE is the value engine of the OS.",
    industries: [
      "Manufacturing cost optimisation",
      "Retail margin intelligence",
      "Energy capital planning",
      "Financial services forecasting",
      "Healthcare financial clarity",
      "Public sector budget foresight",
    ],
    cta: { claim: "Lead with foresight.", action: "Activate LAMID FINANCE — your financial intelligence engine begins here." },
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
 * Intelligence", the four-engine list, "One OS. Four Engines. Unified
 * Growth.") are the hero and the engines grid, already built.
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
 * The document locks four engines. The platform ships nine suites. The
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
  /** Which engine this suite runs inside; null = the OS layer. */
  engine: Engine["id"] | null;
  /** The one-line relationship, used as the band's heading. */
  claim: string;
  body: string;
  /** The division of labour, in one line. */
  split: string;
};

export const SUITE_PARENT: Record<string, SuiteParent> = {
  desk: {
    engine: "finance",
    claim: "DESK runs inside LAMID FINANCE.",
    body:
      "FINANCE is the foresight engine — it connects decisions, talent moves and transformation pathways to financial outcomes. DESK is where those outcomes actually move: proposals costed from diagnostic output, milestones funded through escrow, invoices raised from approved work with the references carried through.",
    split: "FINANCE models the money. DESK collects it.",
  },
  signal: {
    engine: "grow",
    claim: "SIGNAL runs inside LAMID GROW.",
    body:
      "GROW is the transformation engine — customer clarity and digital performance. SIGNAL is the outward half of that work: market visibility, events, and the content that puts you in front of the people GROW has identified as worth reaching.",
    split: "GROW finds the opportunity. SIGNAL takes it to market.",
  },
  learn: {
    engine: "talent",
    claim: "LEARN runs inside LAMID TALENT.",
    body:
      "TALENT maps capability gaps and names the skills a transformation actually needs. LEARN is where those skills get built — structured programmes, live cohorts and certification, with completions flowing back into the capability map they came from.",
    split: "TALENT identifies the gap. LEARN closes it.",
  },
  market: {
    engine: "talent",
    claim: "MARKET runs inside LAMID TALENT.",
    body:
      "Capability comes from two places: built, or sourced. LEARN builds it. MARKET sources it — matching vetted specialists against the gap TALENT identified, then running the engagement through milestone escrow so the capability arrives with the work attached.",
    split: "TALENT names the capability. MARKET brings it in.",
  },
  docushare: {
    engine: null,
    claim: "DOCUSHARE is not an engine. It is the floor all four stand on.",
    body:
      "Every diagnostic, proposal, deliverable and invoice becomes a document, and DOCUSHARE is where those live — shared workspaces, controlled access, and one record that all four engines write to rather than four separate filing systems that disagree.",
    split: "The engines produce the intelligence. DOCUSHARE holds it.",
  },
};
