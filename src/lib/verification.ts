import { collection, persistenceEnabled, ensureIndexes } from "./store";

/**
 * EXPERT VERIFICATION.
 *
 * Backs the badge described on /suites/market and /for-experts:
 * "verification is awarded selectively — a badge everyone holds is not
 * a badge." Submission moves a profile to `pending`; only an operator
 * action (not modelled here — see admin) moves it to `verified`, so a
 * self-serve form can never grant its own credential.
 */

export type VerificationStatus = "unverified" | "pending" | "verified" | "rejected";

export type VerificationRecord = {
  userId: string;
  status: VerificationStatus;
  documents: { kind: string; ref: string }[];
  submittedAt?: number;
  reviewedAt?: number;
  note?: string;
};

const records = new Map<string, VerificationRecord>();

export class VerificationError extends Error {
  constructor(msg: string) { super(msg); this.name = "VerificationError"; }
}

export async function getVerification(userId: string): Promise<VerificationRecord> {
  if (persistenceEnabled()) {
    const col = await collection<VerificationRecord>("verifications");
    const doc = await col?.findOne({ userId });
    if (doc) return doc;
  }
  return records.get(userId) ?? { userId, status: "unverified", documents: [] };
}

export async function submitVerification(
  userId: string,
  documents: { kind: string; ref: string }[],
): Promise<VerificationRecord> {
  if (documents.length === 0) throw new VerificationError("At least one document is required.");

  const record: VerificationRecord = {
    userId,
    status: "pending",
    documents: documents.slice(0, 10).map((d) => ({ kind: String(d.kind).slice(0, 40), ref: String(d.ref).slice(0, 200) })),
    submittedAt: Date.now(),
  };

  if (persistenceEnabled()) {
    await ensureIndexes();
    const col = await collection<VerificationRecord>("verifications");
    if (col) { await col.updateOne({ userId }, { $set: record }, { upsert: true }); return record; }
  }
  records.set(userId, record);
  return record;
}
