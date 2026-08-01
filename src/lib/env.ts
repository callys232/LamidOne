/**
 * Typed environment access.
 *
 * Reads are lazy and never throw at import time — a missing key must
 * fail the one request that needs it, not the whole build. `required()`
 * is called inside handlers so a misconfigured deploy surfaces as a
 * clear 503 on one route rather than a blank page everywhere.
 */

export const env = {
  get openrouterKey() { return process.env.OPENROUTER_API_KEY ?? ""; },
  get openaiKey() { return process.env.OPENAI_API_KEY ?? ""; },
  get model() { return process.env.LAMID_MODEL ?? "openai/gpt-4o-mini"; },
  get mongoUri() { return process.env.MONGODB_URI ?? ""; },
  get redisUrl() { return process.env.UPSTASH_REDIS_REST_URL ?? ""; },
  get redisToken() { return process.env.UPSTASH_REDIS_REST_TOKEN ?? ""; },
  get jwtSecret() { return process.env.JWT_SECRET ?? ""; },
  get isProd() { return process.env.NODE_ENV === "production"; },
  /** Canonical origin, used by robots.ts and sitemap.ts. Falls back to
   *  localhost so `next dev` and `next build` never fail for lacking it —
   *  only the deployed site needs the real value set. */
  get siteUrl() { return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, ""); },
} as const;

export class ConfigError extends Error {
  constructor(key: string) {
    super(`Missing required environment variable: ${key}`);
    this.name = "ConfigError";
  }
}

export function required(value: string, key: string): string {
  if (!value) throw new ConfigError(key);
  return value;
}
