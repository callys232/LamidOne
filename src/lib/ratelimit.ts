import { env } from "./env";

/**
 * Rate limiting — sliding window.
 *
 * Two backends behind one interface:
 *  · Upstash Redis when configured. Required in production, because an
 *    in-memory counter is per-instance and a serverless deploy has many
 *    instances — an attacker just gets N× the limit.
 *  · In-memory fallback for local development.
 *
 * `assertLimit` throws nothing; callers check `ok` and return 429 with
 * Retry-After. The AI routes are the expensive ones and are limited
 * hardest, because an unmetered model endpoint is a bill waiting to
 * happen — which is exactly the state ProdLamid's chat route is in.
 */

export type LimitResult = { ok: boolean; remaining: number; retryAfter: number };

export const LIMITS = {
  /** Model-backed. Expensive per call. */
  ai: { requests: 20, windowSec: 60 },
  /** Agent runs debit points, so they are also throttled per identity. */
  agent: { requests: 10, windowSec: 60 },
  /** Cheap reads. */
  read: { requests: 120, windowSec: 60 },
  /** Public form posts — spam surface. */
  form: { requests: 5, windowSec: 300 },
} as const;

export type LimitName = keyof typeof LIMITS;

/* ── In-memory backend (development only) ─────────────────── */
const buckets = new Map<string, number[]>();

function memoryLimit(key: string, requests: number, windowSec: number): LimitResult {
  const now = Date.now();
  const windowMs = windowSec * 1000;
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);

  if (hits.length >= requests) {
    const retryAfter = Math.ceil((windowMs - (now - hits[0])) / 1000);
    buckets.set(key, hits);
    return { ok: false, remaining: 0, retryAfter: Math.max(1, retryAfter) };
  }

  hits.push(now);
  buckets.set(key, hits);

  /* Opportunistic sweep so the map cannot grow without bound. */
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) {
      if (v.every((t) => now - t >= windowMs)) buckets.delete(k);
    }
  }

  return { ok: true, remaining: requests - hits.length, retryAfter: 0 };
}

/* ── Upstash backend (production) ─────────────────────────── */
async function redisLimit(key: string, requests: number, windowSec: number): Promise<LimitResult> {
  const url = `${env.redisUrl}/pipeline`;
  const windowKey = `rl:${key}:${Math.floor(Date.now() / (windowSec * 1000))}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.redisToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify([
      ["INCR", windowKey],
      ["EXPIRE", windowKey, String(windowSec)],
    ]),
    cache: "no-store",
  });

  if (!res.ok) {
    /* Fail OPEN on limiter outage. A limiter that takes the product
       down when Redis blips is worse than the abuse it prevents — but
       log it loudly so the outage is visible. */
    console.error("[ratelimit] upstash unavailable", res.status);
    return { ok: true, remaining: requests, retryAfter: 0 };
  }

  const body = (await res.json()) as { result: number }[];
  const count = Number(body?.[0]?.result ?? 0);

  return count > requests
    ? { ok: false, remaining: 0, retryAfter: windowSec }
    : { ok: true, remaining: Math.max(0, requests - count), retryAfter: 0 };
}

/**
 * @param name  which limit to apply
 * @param id    stable identity — user id when signed in, else client IP
 */
export async function limit(name: LimitName, id: string): Promise<LimitResult> {
  const { requests, windowSec } = LIMITS[name];
  const key = `${name}:${id}`;

  if (env.redisUrl && env.redisToken) return redisLimit(key, requests, windowSec);

  if (env.isProd) {
    console.warn("[ratelimit] running in-memory in production — set UPSTASH_REDIS_REST_URL");
  }
  return memoryLimit(key, requests, windowSec);
}

/** Best-effort client identity for anonymous traffic. */
export function clientId(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "anonymous";
}
