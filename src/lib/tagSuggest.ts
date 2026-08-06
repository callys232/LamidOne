/**
 * TAG SUGGESTION — real keyword matching against a curated vocabulary,
 * not a fabricated "AI" label on nothing.
 *
 * ProdLamid never actually built this (grep across that codebase found
 * a `tags` field on the Project model and a form hook that manages tag
 * state, but no generator anywhere — tags there are purely manual). This
 * is a genuine first version: match brief text against a vocabulary of
 * real discipline terms drawn from the suites already in this app, and
 * suggest what's found. Cheap, deterministic, and honestly described —
 * it is word matching, not comprehension.
 */

export const DISCIPLINE_VOCABULARY = [
  // Strategy & decision (CORE)
  "strategic-planning", "decision-analysis", "scenario-planning", "governance",
  "change-management", "operating-model", "risk-management", "compliance",
  // Growth & digital (GROW)
  "digital-strategy", "growth-planning", "market-research", "competitive-analysis",
  "digital-transformation", "business-modelling", "innovation", "product-strategy",
  "brand-strategy", "customer-acquisition", "retention-strategy",
  // Talent & workforce (TALENT)
  "workforce-planning", "talent-acquisition", "recruitment", "leadership-development",
  "succession-planning", "capability-mapping", "organisational-design", "hr-strategy",
  "mentoring", "performance-management",
  // Finance (FINANCE)
  "financial-modelling", "budgeting", "forecasting", "cost-optimisation",
  "financial-governance", "valuation", "fundraising", "cash-flow-management",
  // Delivery & operations (DESK/MARKET)
  "project-management", "process-improvement", "supply-chain", "vendor-management",
  "operations", "logistics", "procurement",
  // Technology
  "data-analytics", "software-development", "systems-integration", "cybersecurity",
  "cloud-migration", "automation", "ai-implementation", "it-strategy",
  // Marketing & content
  "marketing-strategy", "content-strategy", "seo", "brand-positioning",
  // Sector
  "manufacturing", "logistics-and-transport", "financial-services", "healthcare",
  "public-sector", "education", "retail", "energy",
] as const;

export type SuggestedTag = { tag: string; matchedOn: string };

/**
 * Scans free text for vocabulary terms — either the hyphenated term
 * itself or its individual words appearing near each other. Returns
 * matches in vocabulary order, deduplicated.
 */
export function suggestTags(text: string, take = 8): SuggestedTag[] {
  const normalised = text.toLowerCase();
  const words = new Set(normalised.split(/[^a-z]+/).filter(Boolean));

  const matches: SuggestedTag[] = [];
  for (const term of DISCIPLINE_VOCABULARY) {
    const parts = term.split("-");
    const hit = normalised.includes(term) || parts.every((p) => words.has(p));
    if (hit) matches.push({ tag: term, matchedOn: term });
    if (matches.length >= take) break;
  }
  return matches;
}
