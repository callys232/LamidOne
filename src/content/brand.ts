/**
 * Brand constants and shared proof figures.
 *
 * SINGLE SOURCE OF TRUTH for every number that appears on more than one
 * page. HubSpot publishes its customer count as 299,000+ / 278,000+ /
 * 268,000+ on three different pages (teardown §7.13) because their stats
 * are hardcoded per template. Everything countable lives here and is
 * imported — so it can never drift.
 *
 * ⚠️  PLACEHOLDER POLICY
 * Every entry below carries `verified`. Anything `verified: false` is a
 * structural placeholder and MUST NOT ship to a public page until a real
 * figure replaces it. `<StatRow />` refuses to render unverified stats
 * when `strict` is set. An empty stat row beats an invented one — and in
 * business-performance advisory, invented performance metrics are a legal
 * exposure, not just a credibility one.
 */

import { AGENT_COUNT } from "./agents";

export const BRAND = {
  name: "LAMID ONE",
  wordmark: "LAMID ONE",
  /**
   * Goes into <title> on every page via layout.tsx, so it is the single
   * highest-reach string on the site — browser tab, search result title,
   * every social share.
   *
   * Was "The evolution of consulting." That predated FINANCE and the
   * four-engine structure entirely, and named only the thing being
   * replaced rather than the thing being offered. The brand document
   * never wrote a direct replacement, so this is its signature line —
   * the same one that closes the homepage hero, which keeps the tab
   * title and the first thing on the page saying the same thing.
   */
  tagline: "One OS. Four Suites. Unified Growth.",
  domain: "lamidone.com",
  accent: "#C12129",
  /** LAMID Consulting mark, carried over from ProdLamid's public folder. */
  logo: "/lamid-logo.png",
  logoAlt: "LAMID Consulting",
} as const;

/**
 * LAMID Consulting was founded in 1988 — sourced from the corporate
 * brochure (see about/page.tsx). Computed rather than hardcoded so
 * "X years" cannot go stale the way a typed-in figure does; this is the
 * one place that fact lives, so /about and the homepage cannot drift
 * against each other the way this file's own header warns against.
 */
export const FOUNDED_YEAR = 1988;
export const yearsOfOperation = () => new Date().getFullYear() - FOUNDED_YEAR;

export type Countable = {
  /** The numeral. Keep notation mixed across a row — `30+`, `~14`, `9`
   *  reads as measured; uniform formatting reads as manufactured. */
  value: string;
  /** What it measures. */
  label: string;
  /** Time bound or comparison base. Non-optional by design: "3x more"
   *  is a boast, "3x more within 12 months" is a measurement. */
  basis?: string;
  verified: boolean;
};

/** Facts we can count today without waiting for outcome data. */
export const REACH: Countable[] = [
  { value: `${yearsOfOperation()}+`, label: "years of advisory work behind the platform", verified: true },
  { value: "30+", label: "industries covered by the expert network", verified: false },
  { value: "5",   label: "plans, from free to concierge",             verified: true  },
  { value: String(AGENT_COUNT), label: "AI agents running across the platform", verified: true },
  { value: "4",   label: "suites, running on one shared record", verified: true  },
];

/** Outcome claims. All unverified until a real engagement is measured. */
export const OUTCOMES: Countable[] = [
  { value: "—", label: "faster time to a decision", basis: "vs. baseline before LAMID ONE", verified: false },
  { value: "—", label: "reduction in time to source an expert", basis: "within the first 90 days", verified: false },
  { value: "—", label: "of diagnostics completed without a consultant call", verified: false },
];

export const CONTACT = {
  salesEmail: "sales@lamidone.com",
  supportEmail: "support@lamidone.com",
  accessibilityEmail: "accessibility@lamidone.com",
  securityEmail: "security@lamidone.com",
  phone: "",
} as const;

/**
 * The CTA pair. One ask, repeated — hero, mid-page, close.
 * The secondary carries a price so nobody bounces assuming
 * "this is probably enterprise-priced" (teardown §1).
 */
export type CtaLink = { label: string; href: string; external?: boolean };

export const CTA: {
  primary: CtaLink;
  secondary: CtaLink;
  header: {
    marketing: { label: string; href: string; variant: "primary" | "secondary" }[];
    pricing: { label: string; href: string; variant: "primary" | "secondary" }[];
    neutral: { label: string; href: string; variant: "primary" | "secondary" }[];
    suite: { label: string; href: string; variant: "primary" | "secondary" }[];
  };
} = {
  primary: { label: "Book a diagnostic", href: "/demo" },
  secondary: { label: "Start free", href: "/signup" },
  /** Header variant per funnel stage (teardown §7.7 correction 2). */
  header: {
    marketing: [
      { label: "Book a diagnostic", href: "/demo", variant: "primary" as const },
      { label: "Start free", href: "/signup", variant: "secondary" as const },
    ],
    /* Same two destinations as `marketing` (/demo, /signup) — only the
       primary label changes. A reader already on a suite page has
       picked a suite; "Book A Diagnostic" reads as a step backward
       toward the generic pitch they've already moved past, where "Get
       a demo" names the actual next step without implying they need
       to go choose one first. Scoped to the eight suite pages only
       (`/suites/[id]/page.tsx`) — DOCUSHARE isn't a suite (see
       content/docushare.ts) and keeps the default `marketing` set. */
    suite: [
      { label: "Get a demo", href: "/demo", variant: "primary" as const },
      { label: "Start free", href: "/signup", variant: "secondary" as const },
    ],
    pricing: [{ label: "Get started", href: "/signup", variant: "primary" as const }],
    /* Non-commercial pages collapse both paths into one low-commitment
       door, so no page has a dead header or one fighting its content. */
    neutral: [{ label: "Start free or book a diagnostic", href: "/signup", variant: "primary" as const }],
  },
};
