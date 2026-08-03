import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { collection, persistenceEnabled, ensureIndexes } from "./store";
import type { TierId } from "@/content/tiers";
import type { DashboardRole } from "@/content/dashboard";
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from "@/content/demoAccounts";

/**
 * USER ACCOUNTS.
 *
 * This is the piece flagged as missing at the end of the last build
 * pass: auth *verification* existed (lib/auth.ts) but nothing *issued*
 * a real account or a real token. Building the onboarding-agent-driven
 * signup flow meant building the thing it signs up FOR.
 *
 * Field names (`tier`, `subscriptionStatus`) match what
 * `entitlements.ts#lookupTier` already reads from ProdLamid's `users`
 * collection, so an account created here is immediately recognised by
 * the tier lookup with no further wiring — one user record, read the
 * same way by both apps.
 *
 * Passwords are hashed with scrypt (Node's built-in, no dependency)
 * rather than stored or logged in any form. Never compared with `===`
 * — see `verifyPassword`.
 */

export type User = {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: DashboardRole;
  tier: TierId;
  subscriptionStatus: "active" | "none";
  /** Set only when the tier came from a real recurring Paystack
   *  subscription (see lib/subscriptionPlans.ts) rather than the
   *  dev-only tier-testing shortcut or a one-time charge. Needed to
   *  cancel the subscription later — Paystack requires the code, not
   *  just the customer's identity. */
  subscriptionCode?: string;
  billingInterval?: "monthly" | "annually";
  orgId: string | null;
  organisation?: string;
  createdAt: number;
};

export class SignupError extends Error {
  constructor(msg: string) { super(msg); this.name = "SignupError"; }
}

const id = () => `usr_${Date.now().toString(36)}_${randomBytes(4).toString("hex")}`;
const users = new Map<string, User>(); // in-memory fallback, keyed by id
const byEmail = new Map<string, string>(); // email -> id, in-memory fallback

function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64);
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(hashHex, "hex");
  const actual = scryptSync(password, salt, 64);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function validateEmail(email: string): string {
  const clean = email.trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s.]+\.[^@\s]+$/.test(clean)) throw new SignupError("Enter a valid email address.");
  return clean;
}

export function validatePassword(password: string): void {
  if (password.length < 8) throw new SignupError("Password must be at least 8 characters.");
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    throw new SignupError("Password needs at least one letter and one number.");
  }
}

/**
 * The 6 demo accounts (content/demoAccounts.ts) resolve HERE, before
 * any database is touched — their `id`/`email` are fixed constants,
 * not Mongo-generated, specifically so signing in as one and browsing
 * the dashboard shell works with no MONGODB_URI configured at all, or
 * a broken one. Built once per process (the salt in `hashPassword` is
 * random per call, so this must not be recomputed per lookup or two
 * demo requests in the same process would hash to different values
 * and neither would verify against the other).
 *
 * Data that genuinely lives in Mongo — points balance, projects,
 * milestones — is untouched by this: those still read (and honestly
 * show empty) from whatever persistence is actually configured. Only
 * the account's own identity is hardcoded.
 */
const DEMO_ORG_ID = "org_demo_meridian_trust";
let demoUsersCache: Map<string, User> | null = null;
function hardcodedDemoUsers(): Map<string, User> {
  if (demoUsersCache) return demoUsersCache;
  const passwordHash = hashPassword(DEMO_PASSWORD);
  const map = new Map<string, User>();
  for (const a of DEMO_ACCOUNTS) {
    const isOrgRole = a.role === "enterprise" || a.role === "concierge" || a.role === "operator";
    map.set(a.id, {
      id: a.id, email: a.email, name: a.name, passwordHash,
      role: a.role, tier: a.tier, subscriptionStatus: a.tier === "free" ? "none" : "active",
      orgId: isOrgRole ? DEMO_ORG_ID : null,
      ...(a.organisation ? { organisation: a.organisation } : {}),
      createdAt: 0,
    });
  }
  demoUsersCache = map;
  return map;
}

export async function findUserById(id: string): Promise<User | null> {
  const demo = hardcodedDemoUsers().get(id);
  if (demo) return demo;

  if (persistenceEnabled()) {
    const col = await collection<User>("users");
    return (await col?.findOne({ id })) ?? null;
  }
  return users.get(id) ?? null;
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const clean = email.trim().toLowerCase();
  for (const demo of hardcodedDemoUsers().values()) {
    if (demo.email === clean) return demo;
  }

  if (persistenceEnabled()) {
    const col = await collection<User>("users");
    return (await col?.findOne({ email: clean })) ?? null;
  }
  const uid = byEmail.get(clean);
  return uid ? users.get(uid) ?? null : null;
}

export async function createUser(input: {
  email: string; password: string; name: string; role: DashboardRole; organisation?: string;
}): Promise<User> {
  const email = validateEmail(input.email);
  validatePassword(input.password);
  const name = input.name.trim().slice(0, 120);
  if (name.length < 2) throw new SignupError("Enter your name.");

  if (await findUserByEmail(email)) {
    throw new SignupError("An account with this email already exists.");
  }

  const isOrgRole = input.role === "enterprise" || input.role === "concierge";
  const user: User = {
    id: id(),
    email,
    name,
    passwordHash: hashPassword(input.password),
    role: input.role,
    tier: "free",
    subscriptionStatus: "none",
    orgId: isOrgRole ? `org_${randomBytes(6).toString("hex")}` : null,
    ...(input.organisation ? { organisation: input.organisation.trim().slice(0, 160) } : {}),
    createdAt: Date.now(),
  };

  if (persistenceEnabled()) {
    await ensureIndexes();
    const col = await collection<User>("users");
    if (col) { await col.insertOne(user); return user; }
  }
  users.set(user.id, user);
  byEmail.set(email, user.id);
  return user;
}

/** Updates a subset of a user's own-editable fields. Handles both the
 *  Mongo and in-memory paths — a caller touching `store.ts` directly
 *  for this would silently no-op in development, since the in-memory
 *  maps here are private to this module. */
export async function updateUser(id: string, patch: Partial<Pick<User, "name" | "organisation">>): Promise<User | null> {
  if (persistenceEnabled()) {
    const col = await collection<User>("users");
    if (col) {
      const after = await col.findOneAndUpdate({ id }, { $set: patch }, { returnDocument: "after" });
      return after ?? null;
    }
  }
  const user = users.get(id);
  if (!user) return null;
  Object.assign(user, patch);
  return user;
}

/**
 * Activates a tier after a REAL, verified payment — called only from
 * the checkout callback once Paystack's own `verifyTransaction`
 * confirms the charge succeeded. This is the production path;
 * `setTierForTesting` below is the dev-only shortcut that skips
 * payment entirely and must never be reachable outside mockEnabled().
 */
export async function activateTier(id: string, tier: TierId): Promise<User | null> {
  const patch = { tier, subscriptionStatus: "active" as const };
  if (persistenceEnabled()) {
    const col = await collection<User>("users");
    if (col) {
      const after = await col.findOneAndUpdate({ id }, { $set: patch }, { returnDocument: "after" });
      return after ?? null;
    }
  }
  const user = users.get(id);
  if (!user) return null;
  Object.assign(user, patch);
  return user;
}

/**
 * Attaches the Paystack subscription code once it exists — it isn't
 * known yet at the moment `activateTier` runs (the browser callback
 * or the `charge.success` webhook only has the one-time transaction
 * reference), only once Paystack's own `subscription.create` webhook
 * arrives a beat later. Looked up by email, the one identifier every
 * Paystack webhook payload reliably carries.
 */
export async function attachSubscriptionCode(
  email: string, code: string, interval: "monthly" | "annually",
): Promise<User | null> {
  const patch = { subscriptionCode: code, billingInterval: interval };
  const clean = email.trim().toLowerCase();
  if (persistenceEnabled()) {
    const col = await collection<User>("users");
    if (col) {
      const after = await col.findOneAndUpdate({ email: clean }, { $set: patch }, { returnDocument: "after" });
      return after ?? null;
    }
  }
  const uid = byEmail.get(clean);
  const user = uid ? users.get(uid) : undefined;
  if (!user) return null;
  Object.assign(user, patch);
  return user;
}

/** Fires when Paystack reports a subscription is no longer active —
 *  either the customer cancelled (via /api/billing/cancel) or a
 *  renewal charge failed enough times that Paystack gave up. Downgrade
 *  is immediate and unconditional: there is no partial-period grace
 *  tracked here, which is the same "simple over silently-wrong"
 *  tradeoff the rest of the checkout flow makes. */
export async function deactivateSubscription(subscriptionCode: string): Promise<User | null> {
  const patch = { tier: "free" as TierId, subscriptionStatus: "none" as const };
  if (persistenceEnabled()) {
    const col = await collection<User>("users");
    if (col) {
      const after = await col.findOneAndUpdate({ subscriptionCode }, { $set: patch }, { returnDocument: "after" });
      return after ?? null;
    }
  }
  const user = [...users.values()].find((u) => u.subscriptionCode === subscriptionCode);
  if (!user) return null;
  Object.assign(user, patch);
  return user;
}

/**
 * Sets tier/subscriptionStatus directly, bypassing any real payment.
 * Deliberately NOT exposed through updateUser() (the self-service
 * profile-edit path) — this exists only for the dev-only tier-testing
 * route, which is itself gated behind mockEnabled() so it can never
 * run against a real production deployment. A real upgrade must go
 * through an actual payment webhook; this is a shortcut for testing
 * what each tier's account looks like, not a billing mechanism.
 */
export async function setTierForTesting(id: string, tier: TierId): Promise<User | null> {
  const patch = { tier, subscriptionStatus: tier === "free" ? "none" as const : "active" as const };
  if (persistenceEnabled()) {
    const col = await collection<User>("users");
    if (col) {
      const after = await col.findOneAndUpdate({ id }, { $set: patch }, { returnDocument: "after" });
      return after ?? null;
    }
  }
  const user = users.get(id);
  if (!user) return null;
  Object.assign(user, patch);
  return user;
}

/** Sets a new password directly — used by the password-reset flow
 *  once a reset token has already been verified. Never called with an
 *  unvalidated password; `validatePassword` is the caller's job, same
 *  as at signup. */
export async function setPassword(id: string, newPassword: string): Promise<User | null> {
  const patch = { passwordHash: hashPassword(newPassword) };
  if (persistenceEnabled()) {
    const col = await collection<User>("users");
    if (col) {
      const after = await col.findOneAndUpdate({ id }, { $set: patch }, { returnDocument: "after" });
      return after ?? null;
    }
  }
  const user = users.get(id);
  if (!user) return null;
  Object.assign(user, patch);
  return user;
}

export async function authenticate(email: string, password: string): Promise<User> {
  const user = await findUserByEmail(email);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    /* Deliberately identical error for "no such user" and "wrong
       password" — a distinct message for each is how account
       enumeration attacks work. */
    throw new SignupError("Incorrect email or password.");
  }
  return user;
}

/** Never serialise the hash. */
export function publicUser(user: User) {
  const { passwordHash: _omit, ...safe } = user;
  return safe;
}

/**
 * Upserts a fixed demo account rather than `createUser`, which throws
 * on a duplicate email — seeding needs to be safe to run again (e.g.
 * once more against production after a redeploy) without first
 * checking what already exists.
 *
 * Unlike a real signup, this sets tier/subscriptionStatus directly:
 * these accounts exist to demonstrate what each tier actually unlocks
 * without a real payment behind it.
 */
export async function seedDemoUser(input: {
  email: string; name: string; role: DashboardRole; tier: TierId; organisation?: string;
}): Promise<User> {
  const email = validateEmail(input.email);
  const existing = await findUserByEmail(email);
  const isOrgRole = input.role === "enterprise" || input.role === "concierge";

  const user: User = {
    id: existing?.id ?? id(),
    email,
    name: input.name,
    passwordHash: existing?.passwordHash ?? hashPassword(DEMO_PASSWORD),
    role: input.role,
    tier: input.tier,
    subscriptionStatus: input.tier === "free" ? "none" : "active",
    orgId: existing?.orgId ?? (isOrgRole ? `org_${randomBytes(6).toString("hex")}` : null),
    ...(input.organisation ? { organisation: input.organisation } : {}),
    createdAt: existing?.createdAt ?? Date.now(),
  };

  if (persistenceEnabled()) {
    await ensureIndexes();
    const col = await collection<User>("users");
    if (col) {
      await col.updateOne({ email }, { $set: user }, { upsert: true });
      return user;
    }
  }
  users.set(user.id, user);
  byEmail.set(email, user.id);
  return user;
}
