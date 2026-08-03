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
 * The shared password lives here, not next to the hashing logic that
 * uses it (lib/users.ts) — that file imports lib/store.ts, which pulls
 * in the `mongodb` driver, so it can never be imported from a client
 * component. This file is pure data and safe for the demo-login page
 * (app/demo-dev) to import directly.
 */
export const DEMO_PASSWORD = "TierDemo2026";

export type DemoAccount = {
  /** Fixed, deterministic — NOT a Mongo-generated id. This is what
   *  lets the demo accounts resolve identity (lib/users.ts's
   *  HARDCODED_DEMO_USERS) with no database round trip at all, so
   *  signing in and browsing the dashboard shell works even with no
   *  MONGODB_URI configured, or a broken one. Data that genuinely
   *  lives in Mongo (points balance, projects, milestones) still
   *  shows as honestly empty in that case — nothing about that is
   *  faked, only the account's own identity is hardcoded. */
  id: string;
  email: string; name: string; role: DashboardRole; tier: TierId; organisation?: string;
};

export const DEMO_ACCOUNTS: DemoAccount[] = [
  { id: "demo_free", email: "free-tier@lamidone.com", name: "Demo — Free", role: "client", tier: "free" },
  { id: "demo_starter", email: "starter-tier@lamidone.com", name: "Demo — Starter", role: "client", tier: "starter" },
  { id: "demo_growth", email: "growth-tier@lamidone.com", name: "Demo — Growth", role: "client", tier: "growth" },
  { id: "demo_enterprise", email: "enterprise-tier@lamidone.com", name: "Demo — Enterprise", role: "enterprise", tier: "enterprise", organisation: "Meridian Trust" },
  { id: "demo_concierge", email: "concierge-tier@lamidone.com", name: "Demo — Concierge", role: "enterprise", tier: "concierge", organisation: "Meridian Trust" },
  { id: "demo_expert", email: "demo-expert@lamidone.app", name: "Demo — Expert", role: "expert", tier: "free" },
  { id: "demo_operator", email: "admin@lamidone.com", name: "Demo — Operator", role: "operator", tier: "enterprise", organisation: "Meridian Trust" },
];
