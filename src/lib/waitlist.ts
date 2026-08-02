import { collection, persistenceEnabled, ensureIndexes } from "./store";

/**
 * BIZSPHERE WAITLIST — BizSphere itself has no live URL yet ("coming
 * soon"), so the modal collects an email instead of linking out.
 * Same in-memory/Mongo fallback shape as events.ts and the rest of
 * this store: works with no database configured, persists once one is.
 */

export type WaitlistEntry = {
  id: string;
  email: string;
  source: string;
  createdAt: number;
};

const entries = new Map<string, WaitlistEntry>(); // keyed by lowercased email
const id = () => `wl_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

export class WaitlistError extends Error {
  constructor(msg: string) { super(msg); this.name = "WaitlistError"; }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function joinWaitlist(rawEmail: string, source: string): Promise<{ entry: WaitlistEntry; alreadyJoined: boolean }> {
  const email = rawEmail.trim().toLowerCase().slice(0, 320);
  if (!EMAIL_RE.test(email)) throw new WaitlistError("Enter a valid email address.");

  if (persistenceEnabled()) {
    await ensureIndexes();
    const col = await collection<WaitlistEntry>("waitlist");
    if (col) {
      const existing = await col.findOne({ email });
      if (existing) return { entry: existing, alreadyJoined: true };
      const entry: WaitlistEntry = { id: id(), email, source, createdAt: Date.now() };
      await col.insertOne(entry);
      return { entry, alreadyJoined: false };
    }
  }

  const existing = entries.get(email);
  if (existing) return { entry: existing, alreadyJoined: true };
  const entry: WaitlistEntry = { id: id(), email, source, createdAt: Date.now() };
  entries.set(email, entry);
  return { entry, alreadyJoined: false };
}
