import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { collection, persistenceEnabled, ensureIndexes } from "./store";
import type { TierId } from "@/content/tiers";
import type { DashboardRole } from "@/content/dashboard";

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

export async function findUserById(id: string): Promise<User | null> {
  if (persistenceEnabled()) {
    const col = await collection<User>("users");
    return (await col?.findOne({ id })) ?? null;
  }
  return users.get(id) ?? null;
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const clean = email.trim().toLowerCase();
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

/** Shared password for every seeded demo account — see
 *  content/demoAccounts.ts for why these exist and how they're seeded. */
export const DEMO_PASSWORD = "LamidDemo123";

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
