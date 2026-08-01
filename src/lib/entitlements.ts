import { TIERS, TIERS_BY_ID, RUNTIME_TIER_MAP, type TierId } from "@/content/tiers";
import { AGENTS } from "@/content/agents";

/**
 * SERVER-SIDE ENTITLEMENTS.
 *
 * The marketing matrix in `content/tiers.ts` and the runtime gate must
 * never disagree — a plan that promises an engine the server refuses is
 * a support ticket, and a server that allows what the plan excludes is
 * lost revenue. Both read the same source here.
 *
 * ProdLamid already has `lib/services/tierService.ts` with the real
 * user lookup against Mongo. This module deliberately does NOT
 * reimplement that: `resolveTier` is the seam. Point it at the existing
 * service in deployment and there is one authority, not two.
 */

export type Identity = {
  userId: string | null;
  tier: TierId;
  /** Organisation the seat belongs to, when there is one. */
  orgId: string | null;
  /** Operator role. Not a purchasable tier — never appears in pricing. */
  isAdmin: boolean;
  /**
   * The account's dashboard role, chosen at signup and stored on the
   * user record — client / expert / enterprise / concierge / operator.
   * When present this is AUTHORITATIVE: `content/dashboard.ts#roleFor`
   * is a fallback for identities that never went through real signup
   * (the dev mocks), not a way to re-derive the role of a real account.
   * Getting this wrong would show an expert their client dashboard.
   */
  role?: import("@/content/dashboard").DashboardRole;
  name?: string;
  email?: string;
  organisation?: string;
};

export const ANONYMOUS: Identity = { userId: null, tier: "free", orgId: null, isAdmin: false };

const RANK: Record<TierId, number> = { free: 0, starter: 1, growth: 2, enterprise: 3, concierge: 4 };

export const tierAtLeast = (tier: TierId, minimum: TierId) => RANK[tier] >= RANK[minimum];

/** Can this identity invoke this agent? */
export function canRunAgent(identity: Identity, agentId: string): { allowed: boolean; reason?: string; minTier?: TierId } {
  const agent = AGENTS.find((a) => a.id === agentId);
  if (!agent) return { allowed: false, reason: "Unknown agent." };

  if (agent.surface === "admin") {
    return identity.isAdmin
      ? { allowed: true }
      : { allowed: false, reason: "Operator agents are not available on customer plans." };
  }

  const min = agent.minTier as TierId;
  if (!tierAtLeast(identity.tier, min)) {
    return {
      allowed: false,
      minTier: min,
      reason: `${agent.name} is available from ${TIERS_BY_ID[min].name}.`,
    };
  }
  return { allowed: true };
}

/** Monthly points allowance for a tier, used when a cycle resets. */
export const monthlyAllowance = (tier: TierId) => TIERS_BY_ID[tier].pointsMonthly;
export const signupGrant = (tier: TierId) => TIERS_BY_ID[tier].pointsGrant;

/**
 * Resolve the caller's identity.
 *
 * Verifies the bearer JWT (see lib/auth.ts — no fallback secret, fails
 * closed) and looks the subject's tier up server-side in `lookupTier`
 * below, mirroring ProdLamid's `getUserTier`. A request with no token
 * and no dev mock resolves to ANONYMOUS rather than erroring, so every
 * route is safe by default.
 */
export async function resolveIdentity(req: Request): Promise<Identity> {
  /* Development fixtures first. `mockIdentity` returns null in
     production unless explicitly allowed, so this can only ever add an
     identity locally — it can never replace a real one. */
  const { mockIdentity } = await import("./mockUsers");
  const mock = mockIdentity(req);
  if (mock) return mock;

  const { verifyAccessToken, tokenFrom, AuthError } = await import("./auth");
  const token = tokenFrom(req);
  if (!token) return ANONYMOUS;

  try {
    const claims = verifyAccessToken(token);

    /* The token carries identity, never entitlement or role. Both are
       looked up server-side from the subject on every request, so a
       user cannot grant themselves Enterprise — or become "expert" —
       by editing a claim, even with a validly signed token. */
    const { findUserById } = await import("./users");
    const user = await findUserById(claims.sub);

    if (user) {
      return {
        userId: user.id,
        tier: user.subscriptionStatus === "active" ? user.tier : "free",
        orgId: user.orgId,
        isAdmin: claims.role === "admin",
        role: user.role,
        name: user.name,
        email: user.email,
        organisation: user.organisation,
      };
    }

    /* Valid token, no matching user record — a token minted by
       ProdLamid for an account this app has not seen. Fall back to the
       org/tier lookup so cross-app sessions still resolve to something
       sane rather than ANONYMOUS. */
    const tier = await lookupTier(claims.sub, claims.orgId);
    return { userId: claims.sub, tier, orgId: claims.orgId ?? null, isAdmin: claims.role === "admin" };
  } catch (e) {
    if (e instanceof AuthError) {
      /* Anonymous, not an error. A bad or expired token is the same as
         no token: the caller gets the public surface and a 401 from any
         route that needs more. */
      return ANONYMOUS;
    }
    throw e;
  }
}

/**
 * Tier for a subject.
 *
 * Mirrors ProdLamid's `tierService.getUserTier`: an organisation's tier
 * wins over the individual's, and an inactive subscription falls back
 * to free. Reads the same collections, so the two apps cannot disagree
 * about what someone has paid for.
 */
async function lookupTier(userId: string, orgId?: string): Promise<TierId> {
  const { collection } = await import("./store");

  const toTierId = (v: unknown): TierId | null => {
    const s = String(v ?? "");
    if (s in RANK) return s as TierId;
    /* ProdLamid's runtime keys map onto this ladder. */
    if (s === "premium") return "growth";
    if (s === "enterprise_plus") return "concierge";
    if (s === "enterprise") return "enterprise";
    return null;
  };

  try {
    if (orgId) {
      const orgs = await collection<{ _id: unknown; tier?: string }>("organizations");
      const org = await orgs?.findOne({ _id: orgId as never });
      const t = toTierId(org?.tier);
      if (t) return t;
      if (org) return "enterprise";
    }

    const users = await collection<{ _id: unknown; tier?: string; subscriptionStatus?: string }>("users");
    const user = await users?.findOne({ _id: userId as never });
    if (!user) return "free";
    if (user.subscriptionStatus && user.subscriptionStatus !== "active") return "free";

    return toTierId(user.tier) ?? "free";
  } catch (e) {
    /* Fail to the LOWEST tier on a lookup error. Failing open would
       hand out paid features during a database blip. */
    console.error("[entitlements] tier lookup failed, defaulting to free:", (e as Error).message);
    return "free";
  }
}

/** Exposed to the client so the UI can gate without a round trip per control. */
export function entitlementSummary(identity: Identity) {
  const tier = TIERS_BY_ID[identity.tier];
  return {
    tier: identity.tier,
    tierName: tier.name,
    runtimeKey: RUNTIME_TIER_MAP[identity.tier],
    seatsIncluded: tier.seatsIncluded,
    pointsMonthly: tier.pointsMonthly,
    agents: AGENTS.filter((a) => a.surface === "platform").map((a) => ({
      id: a.id,
      name: a.name,
      role: a.role,
      points: a.points,
      allowed: canRunAgent(identity, a.id).allowed,
      minTier: a.minTier,
    })),
    upgradePath: TIERS.filter((t) => RANK[t.id] > RANK[identity.tier]).map((t) => t.id),
  };
}
