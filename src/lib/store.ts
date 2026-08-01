import { MongoClient, type Db, type Collection, type Document as MongoDocument } from "mongodb";
import { env } from "./env";

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
  ]).catch((e) => console.error("[store] index creation failed:", (e as Error).message));
}

export const persistenceEnabled = () => Boolean(env.mongoUri);
