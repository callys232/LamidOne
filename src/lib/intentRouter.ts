/**
 * INTENT ROUTING for the site-wide assistant widget.
 *
 * Ported from ProdLamid's `components/Agent/intentRouter.ts`: a message
 * is scored against a small rules table (a whole-phrase match is worth
 * more than a single keyword), the highest-scoring agent above a
 * minimum score wins, and a tie keeps whichever agent is already
 * active — so the bot doesn't flip persona on a message that only
 * weakly resembles a different topic.
 *
 * Client-safe by design: no model calls, no secrets, no server-only
 * imports — this can run in the browser before a request is even
 * made, exactly like ProdLamid's version did.
 *
 * `onboarding` is deliberately not a routable target here — that
 * persona needs a signed-in dashboard role to be useful (see
 * lib/ai.ts) and has its own widget (dashboard/OnboardingWidget.tsx).
 */

export type RoutableAgent = "assistant" | "support" | "pricing" | "solutions" | "expert" | "learning";

export const AGENT_LABELS: Record<RoutableAgent, { name: string; blurb: string }> = {
  assistant: { name: "Aide", blurb: "General assistant" },
  support: { name: "Aide · Support", blurb: "Troubleshooting your account" },
  pricing: { name: "Aide · Pricing", blurb: "Plans, tiers and points" },
  solutions: { name: "Aide · Solutions", blurb: "Finding your starting point" },
  expert: { name: "Aide · Expert programme", blurb: "Joining the marketplace" },
  learning: { name: "Aide · Learning", blurb: "Courses and certification" },
};

export const ROUTABLE_AGENTS = Object.keys(AGENT_LABELS) as RoutableAgent[];

type Rule = { agent: Exclude<RoutableAgent, "assistant">; phrases: string[]; keywords: string[] };

const RULES: Rule[] = [
  {
    agent: "support",
    phrases: ["can't log in", "cannot log in", "can't sign in", "not working", "doesn't work", "reset my password", "having trouble"],
    keywords: ["broken", "error", "crash", "bug", "login", "password", "2fa", "issue", "problem", "stuck", "failed", "glitch"],
  },
  {
    agent: "pricing",
    phrases: ["how much does it cost", "what's included", "what is included", "how much is it"],
    keywords: ["price", "pricing", "cost", "plan", "tier", "billing", "subscription", "discount", "upgrade", "downgrade", "points"],
  },
  {
    agent: "solutions",
    phrases: ["which suite is right", "where do i start", "not sure where to start", "best fit for", "what should i use"],
    keywords: ["recommend", "suite", "suites"],
  },
  {
    agent: "expert",
    phrases: ["become an expert", "join as an expert", "join the marketplace", "list my practice"],
    keywords: ["freelancer", "consultant", "marketplace", "bid", "membership", "escrow"],
  },
  {
    agent: "learning",
    phrases: ["get certified", "how do i learn", "how do i get certified"],
    keywords: ["course", "courses", "certification", "certified", "training", "curriculum", "lms"],
  },
];

const MIN_SCORE = 2;
const PHRASE_SCORE = 2;
const KEYWORD_SCORE = 1;

/** Returns the agent that should handle this message. Falls back to
 *  `current` on a tie or when nothing clears the minimum score, so a
 *  single ambiguous message never causes a jarring persona flip. */
export function routeIntent(message: string, current: RoutableAgent): RoutableAgent {
  const text = message.toLowerCase();
  let best: RoutableAgent | null = null;
  let bestScore = 0;

  for (const rule of RULES) {
    let score = 0;
    for (const phrase of rule.phrases) {
      if (text.includes(phrase)) score += PHRASE_SCORE;
    }
    for (const kw of rule.keywords) {
      if (new RegExp(`\\b${kw}\\b`, "i").test(text)) score += KEYWORD_SCORE;
    }
    if (score > bestScore) {
      bestScore = score;
      best = rule.agent;
    }
  }

  if (best && bestScore >= MIN_SCORE && best !== current) return best;
  return current;
}
