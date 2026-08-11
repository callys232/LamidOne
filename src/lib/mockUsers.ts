import type { Identity } from "./entitlements";
import type { TierId } from "@/content/tiers";
import { TIERS_BY_ID } from "@/content/tiers";
import { credit, getBalance } from "./points";

/**
 * MOCK IDENTITIES.
 *
 * The backend needs someone to be, and real auth is a separate system.
 * These fixtures let every route be exercised end to end — tier gating,
 * points reservation, settlement, insufficient-balance paths — without
 * standing up Mongo or a login flow.
 *
 * Deliberately:
 *  · Refused in production. `mockIdentity()` returns null when
 *    NODE_ENV is production unless LAMID_ALLOW_MOCK_AUTH is explicitly
 *    set, so a fixture can never become a live account by accident.
 *    A mock auth path that survives to prod is an authentication bypass.
 *  · One fixture per tier plus an operator, so the gates that matter
 *    (starter-only, growth-only, admin-only, empty-balance) all have a
 *    subject that exercises them.
 *  · Seeded lazily on first use, so importing this file has no effect.
 */

export type MockUser = Identity & {
  key: string;
  label: string;
  email: string;
  organisation: string;
  /** Starting balance. `poor` deliberately cannot afford a diagnostic. */
  seed: { allowance: number; purchased: number };
  note: string;
};

export const MOCK_USERS: MockUser[] = [
  {
    key: "free",
  role: "client" as const,
    label: "Ada — free plan",
    email: "ada@northwind.example",
    organisation: "Northwind Group",
    userId: "mock_free",
    tier: "free",
    orgId: null,
    isAdmin: false,
    seed: { allowance: 40, purchased: 0 },
    note: "The exact free grant: one diagnostic and nothing more. Run Catalyst once, then every further call is a 402 — the clearest test of the upgrade path.",
  },
  {
    key: "starter",
  role: "client" as const,
    label: "Ben — Starter",
    email: "ben@haldenco.example",
    organisation: "Halden & Co",
    userId: "mock_starter",
    tier: "starter",
    orgId: null,
    isAdmin: false,
    seed: { allowance: 500, purchased: 300 },
    note: "Can reach Scribe and Cadence. Blocked from Arbiter and Vantage — exercises tier gating.",
  },
  {
    key: "growth",
  role: "enterprise" as const,
    label: "Chidi — Growth",
    email: "chidi@meridian.example",
    organisation: "Meridian Trust",
    userId: "mock_growth",
    tier: "growth",
    orgId: "org_meridian",
    isAdmin: false,
    seed: { allowance: 2000, purchased: 1000 },
    note: "Every platform agent unlocked. The normal happy path.",
  },
  {
    key: "enterprise",
  role: "enterprise" as const,
    label: "Dara — Enterprise",
    email: "dara@okonkwo.example",
    organisation: "Okonkwo Partners",
    userId: "mock_enterprise",
    tier: "enterprise",
    orgId: "org_okonkwo",
    isAdmin: false,
    seed: { allowance: 10000, purchased: 5000 },
    note: "Shared org pool. Use for seat and residency behaviour.",
  },
  {
    key: "poor",
  role: "client" as const,
    label: "Eze — Growth, empty balance",
    email: "eze@fircroft.example",
    organisation: "Fircroft",
    userId: "mock_poor",
    tier: "growth",
    orgId: null,
    isAdmin: false,
    seed: { allowance: 0, purchased: 5 },
    note: "Entitled to everything, can afford nothing. Isolates the balance check from the tier check.",
  },
  {
    key: "expert",
  role: "expert" as const,
    label: "Femi — Expert (freelance)",
    email: "femi@forhire.example",
    organisation: "Independent",
    userId: "mock_expert",
    tier: "starter",
    orgId: null,
    isAdmin: false,
    seed: { allowance: 500, purchased: 0 },
    note: "The marketplace/delivery side: bids, gets awarded, delivers milestones, raises invoices against them. Was missing from this fixture set even though the role has existed in DashboardRole all along — added so the marketplace → milestone → invoice chain has a subject to exercise it.",
  },
  {
    key: "concierge",
  role: "concierge" as const,
    label: "Grace — Concierge",
    email: "grace@vantagepoint.example",
    organisation: "Vantage Point Holdings",
    userId: "mock_concierge",
    tier: "concierge",
    orgId: "org_vantage",
    isAdmin: false,
    seed: { allowance: 50000, purchased: 0 },
    note: "The white-glove tier above Enterprise. Also previously missing from this fixture set.",
  },
  {
    key: "admin",
  role: "operator" as const,
    label: "Operator",
    email: "ops@lamidone.example",
    organisation: "LAMID ONE",
    userId: "mock_admin",
    tier: "enterprise",
    orgId: null,
    isAdmin: true,
    seed: { allowance: 100000, purchased: 0 },
    note: "Reaches Beacon and Herald. Admin is a role, never a purchasable tier.",
  },
];

const seeded = new Set<string>();

/** Credits the fixture's starting balance once per process. */
function ensureSeeded(user: MockUser) {
  if (seeded.has(user.userId!)) return;
  seeded.add(user.userId!);
  if (user.seed.allowance) credit(user.userId!, user.seed.allowance, "allowance", "mock_seed_allowance");
  if (user.seed.purchased) credit(user.userId!, user.seed.purchased, "purchased", "mock_seed_purchased");
}

export function mockEnabled(): boolean {
  if (process.env.NODE_ENV !== "production") return true;
  return process.env.LAMID_ALLOW_MOCK_AUTH === "true";
}

/**
 * Resolve a mock identity from `x-lamid-mock: <key>`.
 * Returns null when mocks are disabled or the key is unknown — callers
 * then fall through to real resolution, so this can only ever add an
 * identity in development, never replace one.
 */
export function mockIdentity(req: Request): Identity | null {
  if (!mockEnabled()) return null;

  const key = req.headers.get("x-lamid-mock");
  if (!key) return null;

  const user = MOCK_USERS.find((u) => u.key === key);
  if (!user) return null;

  ensureSeeded(user);
  return {
    userId: user.userId, tier: user.tier, orgId: user.orgId, isAdmin: user.isAdmin,
    role: user.role, name: user.label, email: user.email, organisation: user.organisation,
  };
}

/** Directory for the dev console, with live balances. */
export function mockDirectory() {
  return MOCK_USERS.map((u) => {
    ensureSeeded(u);
    const b = getBalance(u.userId!);
    return {
      key: u.key,
      label: u.label,
      email: u.email,
      organisation: u.organisation,
      tier: u.tier,
      tierName: TIERS_BY_ID[u.tier as TierId].name,
      isAdmin: u.isAdmin,
      note: u.note,
      balance: { allowance: b.allowance, purchased: b.purchased, held: b.held },
      header: { "x-lamid-mock": u.key },
    };
  });
}
