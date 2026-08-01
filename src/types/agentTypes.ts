export type AgentType =
  | "onboarding"
  | "learning"
  | "support"
  | "shopping"
  | "creative"
  | "productivity"
  | "project"
  | "analytics"
  | "communication"
  | "outreach";

export const LOCKED_AGENTS: AgentType[] = ["learning", "support", "shopping", "productivity"];
export const ADMIN_AGENTS:  AgentType[] = ["outreach"];
