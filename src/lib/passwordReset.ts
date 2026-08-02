import { randomBytes, createHash } from "node:crypto";
import { collection, persistenceEnabled, ensureIndexes } from "./store";

/**
 * PASSWORD RESET TOKENS.
 *
 * The raw token is emailed to the user and never stored anywhere —
 * only its SHA-256 hash is persisted, the same reasoning as never
 * storing a password itself: if the token store ever leaked, the
 * leaked rows would be useless without also knowing the raw tokens.
 * Single-use (consumed atomically) and short-lived (1 hour).
 */

type ResetTokenDoc = { tokenHash: string; userId: string; expiresAt: number; usedAt: number | null };

const TTL_MS = 60 * 60 * 1000;
const tokens = new Map<string, ResetTokenDoc>(); // in-memory fallback, keyed by tokenHash

const hash = (raw: string) => createHash("sha256").update(raw).digest("hex");

export async function createResetToken(userId: string): Promise<string> {
  const raw = randomBytes(32).toString("hex");
  const doc: ResetTokenDoc = { tokenHash: hash(raw), userId, expiresAt: Date.now() + TTL_MS, usedAt: null };

  if (persistenceEnabled()) {
    await ensureIndexes();
    const col = await collection<ResetTokenDoc>("passwordResets");
    /* `expiresAt` is stored as a real BSON Date here despite the type
       above saying `number` — a Mongo TTL index (store.ts) only ever
       fires on a Date field. The app's own expiry check in
       `consumeResetToken` doesn't depend on this; the TTL index is
       purely storage hygiene, same trick as holds.createdAt in
       lib/points.ts. */
    if (col) { await col.insertOne({ ...doc, expiresAt: new Date(doc.expiresAt) as never }); return raw; }
  }
  tokens.set(doc.tokenHash, doc);
  return raw;
}

/** Verifies and immediately consumes the token — a second attempt
 *  with the same raw token (link clicked twice, or a race) fails
 *  rather than resetting the password again. Returns the userId on
 *  success, null on anything else (unknown, expired, already used). */
export async function consumeResetToken(rawToken: string): Promise<string | null> {
  const tokenHash = hash(rawToken);
  const now = Date.now();

  if (persistenceEnabled()) {
    const col = await collection<ResetTokenDoc>("passwordResets");
    if (col) {
      /* `expiresAt` is a BSON Date in Mongo (see createResetToken) —
         must compare against a Date, not the raw number `now`, or the
         comparison silently never matches correctly. */
      const claimed = await col.findOneAndUpdate(
        { tokenHash, usedAt: null, expiresAt: { $gt: new Date(now) as never } },
        { $set: { usedAt: now } },
        { returnDocument: "after" },
      );
      return claimed?.userId ?? null;
    }
  }

  const doc = tokens.get(tokenHash);
  if (!doc || doc.usedAt !== null || doc.expiresAt <= now) return null;
  doc.usedAt = now;
  return doc.userId;
}
