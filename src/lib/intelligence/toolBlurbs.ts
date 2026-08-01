import { MODULE_REGISTRY } from "./moduleRegistry";

/**
 * One-line business definition for a tool, keyed by its route.
 *
 * Slug-coded routes (/r01-…, /q46-…) resolve straight to the registry purpose,
 * so a tool is described everywhere by the same sentence it carries on its own
 * page. Named routes — the hand-built consoles and dashboards outside the
 * registry — get their line from the map below.
 */
const HAND_BLURBS: Record<string, string> = {
  /* CORE named tools */
  "/core-diagnostic":          "Diagnoses where your strategy stands — what's aligned, what's stalling, and what needs to move first.",
  "/core-strategic-alignment": "Measures how aligned your leadership and teams are on the strategy — and where execution is quietly diverging from it.",
  "/core-blueprint":           "Turns your strategy into an operating blueprint — the structures, owners, and sequences that take it from statement to system.",
  "/core-transformation":      "Plans and steers your transformation — scope, sequence, and the milestones that tell you it's actually happening.",
  "/core-operating-rhythm":    "Designs your operating rhythm — the review, decision, and delivery cycles your strategy needs to stay alive.",
  "/core-workflow":            "Maps your core workflows — how work should move through the organization, and where it currently doesn't.",
  "/core-change-management":   "Manages the human side of change — readiness, resistance, and adoption, so improvements stick instead of snapping back.",
  "/core-executive-console":   "Your executive console — the strategic signals, risks, and decisions that need leadership attention, in one view.",
  "/core-dashboard":           "Your live CORE dashboard — strategy health, execution progress, and alignment at a glance.",

  /* GROW named tools */
  "/grow-opportunity-signals": "Surfaces your growth opportunities as they emerge — market openings, customer shifts, and demand signals ranked by readiness.",
  "/grow-market-intelligence": "Reads your markets continuously — competitors, trends, and timing — so your moves are grounded in current intelligence, not last year's report.",
  "/grow-digital-maturity":    "Measures how well your business uses digital technology, data, and processes to drive value — where you stand across strategy, customer experience, operations, culture, and data, and the next step to improve.",
  "/grow-pathways":            "Charts your growth pathways — the realistic routes from where you are to where you're aiming, with the trade-offs of each.",
  "/grow-modernisation":       "Plans your digital modernisation — which systems and processes to upgrade first, based on value rather than vendor pressure.",
  "/grow-planner":             "Builds your growth plan — targets, initiatives, and owners connected, so ambition converts into a schedule.",
  "/grow-advisory-console":    "Localized advisory for every market you operate in — guidance matched to your sector, scale, and situation.",
  "/grow-executive-report":    "The executive growth report — engagement, funnel health, and digital performance in the numbers a board reads.",
  "/grow-dashboard":           "Your live GROW dashboard — customer engagement and digital performance, refreshing as the data lands.",
  "/cadence-intelligence":     "Maps your operational rhythm with data-driven timing — when actions occur and how information flows, matched to market signals and customer behaviour rather than rigid schedules.",
  "/operations-intelligence":  "Turns your operational data into decisions — throughput, bottlenecks, and capacity, read as one system.",

  /* Platform */
  "/concierge":                "Your dedicated concierge desk — a named team that runs the platform with you and for you.",
};

export function toolBlurb(href: string): string | undefined {
  const m = /^\/([a-z])(\d{2,3})-/.exec(href);
  if (m) {
    const code = `${m[1].toUpperCase()}${m[2]}`;
    const fromRegistry = MODULE_REGISTRY[code]?.purpose;
    if (fromRegistry) return fromRegistry;
  }
  return HAND_BLURBS[href];
}
