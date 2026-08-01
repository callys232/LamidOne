import type { RoleRequirement } from "./careerPath";

/**
 * What each target role actually asks for.
 *
 * `needed` is the level the role expects (1–5); `weight` is how much the role
 * cares (1–5). Weight is what makes a near-miss on something central cost more
 * than a total miss on something peripheral.
 *
 * Kept deliberately small and honest. A catalogue of two hundred roles nobody
 * curated would be worse than a dozen that reflect real openings.
 */
export const ROLE_CATALOGUE: Record<string, RoleRequirement[]> = {
  "Management Consultant": [
    { skill: "Structured problem solving", needed: 5, weight: 5 },
    { skill: "Financial modelling",        needed: 4, weight: 4 },
    { skill: "Stakeholder communication",  needed: 4, weight: 5 },
    { skill: "Data analysis",              needed: 4, weight: 4 },
    { skill: "Industry research",          needed: 3, weight: 3 },
    { skill: "Facilitation",               needed: 3, weight: 3 },
  ],
  "Project Manager": [
    { skill: "Planning and scheduling",   needed: 5, weight: 5 },
    { skill: "Risk management",           needed: 4, weight: 4 },
    { skill: "Stakeholder communication", needed: 4, weight: 5 },
    { skill: "Budget management",         needed: 4, weight: 4 },
    { skill: "Agile delivery",            needed: 3, weight: 3 },
    { skill: "Vendor management",         needed: 3, weight: 2 },
  ],
  "Data Analyst": [
    { skill: "SQL",                needed: 5, weight: 5 },
    { skill: "Data visualisation", needed: 4, weight: 4 },
    { skill: "Statistics",         needed: 4, weight: 4 },
    { skill: "Python or R",        needed: 3, weight: 3 },
    { skill: "Business acumen",    needed: 3, weight: 4 },
    { skill: "Data modelling",     needed: 3, weight: 3 },
  ],
  "Finance Business Partner": [
    { skill: "Financial modelling",       needed: 5, weight: 5 },
    { skill: "Management reporting",      needed: 4, weight: 4 },
    { skill: "Budgeting and forecasting", needed: 4, weight: 5 },
    { skill: "Stakeholder communication", needed: 4, weight: 4 },
    { skill: "Cost analysis",             needed: 3, weight: 3 },
    { skill: "Commercial judgement",      needed: 3, weight: 4 },
  ],
  "People / HR Lead": [
    { skill: "Capability frameworks",     needed: 4, weight: 5 },
    { skill: "Employment law",            needed: 3, weight: 4 },
    { skill: "Workforce planning",        needed: 4, weight: 4 },
    { skill: "Coaching",                  needed: 4, weight: 4 },
    { skill: "Stakeholder communication", needed: 4, weight: 4 },
    { skill: "People analytics",          needed: 3, weight: 3 },
  ],
  "Product Manager": [
    { skill: "Discovery and user research", needed: 4, weight: 5 },
    { skill: "Roadmapping",                 needed: 4, weight: 4 },
    { skill: "Data analysis",               needed: 3, weight: 4 },
    { skill: "Stakeholder communication",   needed: 4, weight: 5 },
    { skill: "Commercial judgement",        needed: 3, weight: 4 },
    { skill: "Delivery collaboration",      needed: 3, weight: 3 },
  ],
  "Operations Manager": [
    { skill: "Process design",            needed: 4, weight: 5 },
    { skill: "Performance measurement",   needed: 4, weight: 4 },
    { skill: "Capacity planning",         needed: 3, weight: 4 },
    { skill: "Continuous improvement",    needed: 4, weight: 4 },
    { skill: "Stakeholder communication", needed: 3, weight: 3 },
    { skill: "Cost analysis",             needed: 3, weight: 3 },
  ],
  "Team Lead / Manager": [
    { skill: "Coaching",                  needed: 4, weight: 5 },
    { skill: "Performance management",    needed: 4, weight: 5 },
    { skill: "Planning and scheduling",   needed: 3, weight: 3 },
    { skill: "Stakeholder communication", needed: 4, weight: 4 },
    { skill: "Hiring and onboarding",     needed: 3, weight: 3 },
    { skill: "Conflict resolution",       needed: 3, weight: 4 },
  ],
};

export const TARGET_ROLES = Object.keys(ROLE_CATALOGUE);

export function requirementsFor(role: string): RoleRequirement[] {
  return ROLE_CATALOGUE[role] ?? [];
}
