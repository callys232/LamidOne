import { MongoClient, type Db, type Collection, type Document as MongoDocument } from "mongodb";
import { env, ConfigError } from "./env";

/**
 * PERSISTENCE.
 *
 * One connection, lazily opened, cached across hot reloads and
 * serverless invocations. Without the global cache, every invocation
 * opens a new pool and Atlas drops you on connection limits under any
 * real load — the single most common Mongo failure in Next.js.
 *
 * `getDb()` returns null when MONGODB_URI is unset, and every caller
 * falls back to its in-memory map. That keeps local development and CI
 * working with no database, while production persists — rather than
 * failing to boot, which is what a hard requirement here would cause.
 */

export class DatabaseError extends Error {
  constructor(msg: string) { super(msg); this.name = "DatabaseError"; }
}

type Cache = { client: MongoClient | null; promise: Promise<MongoClient> | null };

const globalCache = globalThis as unknown as { __lamidMongo?: Cache };
const cache: Cache = globalCache.__lamidMongo ?? { client: null, promise: null };
globalCache.__lamidMongo = cache;

export async function getDb(): Promise<Db | null> {
  if (!env.mongoUri) return null;

  if (!cache.promise) {
    cache.promise = MongoClient.connect(env.mongoUri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    }).then((c) => {
      cache.client = c;
      return c;
    }).catch((e) => {
      /* Reset so a later request retries instead of being stuck with a
         permanently rejected promise. */
      cache.promise = null;
      throw e;
    });
  }

  try {
    const client = await cache.promise;
    return client.db();
  } catch (e) {
    if (env.isProd) {
      /* In production, MONGODB_URI being SET is a promise that Mongo
         is genuinely reachable — silently returning null here (as
         development does, for convenience with no database) would
         send every caller down its in-memory fallback path, exactly
         recreating the bug requirePersistenceInProd() exists to
         prevent, just one layer deeper: a truthy URI whose connection
         is actually broken (bad credentials, IP not whitelisted,
         wrong host). Throwing turns that into a clear 503 with the
         real cause, instead of confusing, per-function-inconsistent
         fallback behaviour that looks like a logic bug. */
      throw new DatabaseError(`MongoDB connection failed: ${(e as Error).message}`);
    }
    console.error("[store] mongo unavailable, using in-memory:", (e as Error).message);
    return null;
  }
}

/** `Document` here is Mongo's own shape type, not the DOM `Document`
 *  global — importing it explicitly avoids the lib.dom collision that
 *  makes every collection type fail to satisfy the constraint. */
export async function collection<T extends MongoDocument>(
  name: string,
): Promise<Collection<T> | null> {
  const db = await getDb();
  return db ? db.collection<T>(name) : null;
}

/** Created once per process. Cheap and idempotent. */
let indexed = false;

export async function ensureIndexes(): Promise<void> {
  if (indexed) return;
  const db = await getDb();
  if (!db) return;
  indexed = true;

  await Promise.all([
    db.collection("balances").createIndex({ userId: 1 }, { unique: true }),
    db.collection("holds").createIndex({ id: 1 }, { unique: true }),
    /* Holds self-expire, so a crashed run cannot strand a balance even
       if the sweep never runs. */
    db.collection("holds").createIndex({ createdAt: 1 }, { expireAfterSeconds: 900 }),
    db.collection("ledger").createIndex({ userId: 1, at: -1 }),
    db.collection("bundles").createIndex({ id: 1 }, { unique: true }),
    db.collection("bundles").createIndex({ userId: 1, updatedAt: -1 }),

    /* Every collection below was being queried with zero indexes —
       a full collection scan on every request. `users.email` is the
       one that matters beyond performance: without it, createUser()'s
       check-then-insert (find by email, then insertOne) is a real
       race — two concurrent signups with the same email could both
       pass the "does not exist" check. The unique index makes the
       second insert fail atomically instead. */
    db.collection("users").createIndex({ id: 1 }, { unique: true }),
    db.collection("users").createIndex({ email: 1 }, { unique: true }),
    db.collection("users").createIndex({ subscriptionCode: 1 }, { sparse: true }),

    db.collection("projects").createIndex({ id: 1 }, { unique: true }),
    db.collection("projects").createIndex({ clientId: 1, createdAt: -1 }),
    db.collection("projects").createIndex({ status: 1, createdAt: -1 }),

    db.collection("bids").createIndex({ id: 1 }, { unique: true }),
    db.collection("bids").createIndex({ projectId: 1, boosted: -1, createdAt: 1 }),
    db.collection("bids").createIndex({ expertId: 1, createdAt: -1 }),

    db.collection("completedProjects").createIndex({ clientId: 1, completedAt: -1 }),
    db.collection("completedProjects").createIndex({ expertId: 1, completedAt: -1 }),
    /* `id` here is the project's own id, reused unchanged on the
       completed record — this is the DB-level backstop against
       completeProject() ever inserting the same project twice, in
       case the application-level "awarded" guard is ever bypassed. */
    db.collection("completedProjects").createIndex({ id: 1 }, { unique: true }),

    db.collection("experts").createIndex({ id: 1 }, { unique: true }),
    db.collection("experts").createIndex({ disciplines: 1, engagementsCompleted: -1 }),

    db.collection("milestones").createIndex({ id: 1 }, { unique: true }),
    db.collection("milestones").createIndex({ projectId: 1 }),
    db.collection("milestones").createIndex({ status: 1, autoReleaseAt: 1 }),

    db.collection("orgMembers").createIndex({ id: 1 }, { unique: true }),
    db.collection("orgMembers").createIndex({ orgId: 1, joinedAt: 1 }),
    db.collection("teams").createIndex({ id: 1 }, { unique: true }),
    db.collection("teams").createIndex({ orgId: 1, createdAt: -1 }),
    db.collection("invitations").createIndex({ id: 1 }, { unique: true }),
    db.collection("invitations").createIndex({ orgId: 1, status: 1, createdAt: -1 }),

    db.collection("notifications").createIndex({ id: 1 }, { unique: true }),
    db.collection("notifications").createIndex({ userId: 1, at: -1 }),
    db.collection("notificationPrefs").createIndex({ userId: 1 }, { unique: true }),

    db.collection("events").createIndex({ id: 1 }, { unique: true }),
    db.collection("events").createIndex({ category: 1, startAt: 1 }),
    db.collection("events").createIndex({ hostId: 1, startAt: -1 }),

    db.collection("supportTickets").createIndex({ id: 1 }, { unique: true }),
    db.collection("supportTickets").createIndex({ userId: 1, createdAt: -1 }),

    db.collection("payoutAccounts").createIndex({ userId: 1 }, { unique: true }),
    db.collection("withdrawals").createIndex({ id: 1 }, { unique: true }),
    db.collection("withdrawals").createIndex({ userId: 1, createdAt: -1 }),

    db.collection("verifications").createIndex({ userId: 1 }, { unique: true }),
    db.collection("integrations").createIndex({ userId: 1 }, { unique: true }),
    db.collection("checkoutOrders").createIndex({ reference: 1 }, { unique: true }),
    db.collection("checkoutOrders").createIndex({ userId: 1, createdAt: -1 }),
    db.collection("paystackPlans").createIndex({ key: 1 }, { unique: true }),

    db.collection("auditLog").createIndex({ orgId: 1, at: -1 }),
    db.collection("auditLog").createIndex({ actorId: 1, at: -1 }),

    db.collection("waitlist").createIndex({ email: 1 }, { unique: true }),
    db.collection("contactInquiries").createIndex({ status: 1, createdAt: -1 }),

    db.collection("invoices").createIndex({ id: 1 }, { unique: true }),
    db.collection("invoices").createIndex({ issuerId: 1, createdAt: -1 }),
    db.collection("invoices").createIndex({ orgId: 1, status: 1, createdAt: -1 }),
    /* An invoice number must be unique per issuer — an auditor treats a
       duplicate as a control failure, not a cosmetic bug. */
    db.collection("invoices").createIndex({ issuerId: 1, number: 1 }, { unique: true }),
    db.collection("invoiceCounters").createIndex({ key: 1 }, { unique: true }),
    db.collection("passwordResets").createIndex({ tokenHash: 1 }, { unique: true }),
    db.collection("passwordResets").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
  ]).catch((e) => console.error("[store] index creation failed:", (e as Error).message));
}

export const persistenceEnabled = () => Boolean(env.mongoUri);

/**
 * Money and escrow routes must not silently run on the in-memory
 * fallback in production — a serverless deploy has many instances,
 * each with its OWN Map, so the atomicity every reservation/payout
 * guard here is built around (`findOneAndUpdate`) simply does not
 * exist without Mongo: two instances can both approve a reservation
 * or both mark the same order paid. In development this is a
 * deliberate convenience (`persistenceEnabled()` false, everything
 * still works); in production it must instead fail the one request
 * with a clear 503, not corrupt a balance silently. Call at the top
 * of any route handler that touches balances, holds, orders,
 * milestones or marketplace payouts — `handler()` in lib/http.ts turns
 * the thrown ConfigError into that 503 automatically.
 */
export function requirePersistenceInProd(): void {
  if (env.isProd && !persistenceEnabled()) throw new ConfigError("MONGODB_URI");
}
