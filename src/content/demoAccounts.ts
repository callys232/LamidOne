import type { TierId } from "./tiers";
import type { DashboardRole } from "./dashboard";

/**
 * DEMO LOGINS — one real, JWT-backed account per tier, plus the two
 * roles a tier alone doesn't cover (expert and operator), so every
 * pricing tier and dashboard shape can be walked end-to-end with a
 * genuine sign-in rather than the dev-only `x-lamid-mock` header.
 *
 * Seeded via POST /api/dev/seed-demo (shared-secret gated, same
 * pattern as /api/cron/auto-release) — an upsert, so it is safe to run
 * again once JWT_SECRET and Mongo are configured in production, which
 * is the point: seed once locally to develop against, then run the
 * same call against production after deploy rather than hand-creating
 * accounts through the signup form.
 *
 * The shared password lives next to the hashing logic that uses it —
 * see DEMO_PASSWORD in lib/users.ts — not here.
 */
export type DemoAccount = {
  email: string; name: string; role: DashboardRole; tier: TierId; organisation?: string;
};

export const DEMO_ACCOUNTS: DemoAccount[] = [
  { email: "demo-free@lamidone.app", name: "Demo — Free", role: "client", tier: "free" },
  { email: "demo-starter@lamidone.app", name: "Demo — Starter", role: "client", tier: "starter" },
  { email: "demo-growth@lamidone.app", name: "Demo — Growth", role: "client", tier: "growth" },
  { email: "demo-enterprise@lamidone.app", name: "Demo — Enterprise", role: "enterprise", tier: "enterprise", organisation: "Demo Enterprise Co" },
  { email: "demo-concierge@lamidone.app", name: "Demo — Concierge", role: "concierge", tier: "concierge", organisation: "Demo Concierge Co" },
  { email: "demo-expert@lamidone.app", name: "Demo — Expert", role: "expert", tier: "free" },
  { email: "demo-operator@lamidone.app", name: "Demo — Operator", role: "operator", tier: "enterprise" },
];
