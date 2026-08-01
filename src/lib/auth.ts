import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "./env";

/**
 * JWT VERIFICATION.
 *
 * Token format is deliberately compatible with ProdLamid's
 * `lib/jwt.ts` — HS256, `sub`/`email`/`role`/`orgId`/`orgRole`/`type`
 * — so a session issued by either app is accepted by both. Same secret,
 * same claims, no migration.
 *
 * ⚠️  ONE THING IS NOT CARRIED OVER, DELIBERATELY.
 * ProdLamid's jwt.ts contains:
 *
 *     const FALLBACK_SECRET = "lamid-one-temporary-development-secret-replace-me-2026";
 *     export function getJwtSecret() {
 *       const s = process.env.JWT_SECRET;
 *       if (s && s.length >= 32) return s;
 *       return FALLBACK_SECRET;      // <-- anyone with the repo can forge admin
 *     }
 *
 * That is a full authentication bypass: the secret is in source, so
 * anyone who can read the repository can mint a token for any user
 * including `role: "admin"`, and it activates silently whenever
 * JWT_SECRET is unset or short. Its own comment says so.
 *
 * This module has NO fallback. If the secret is missing or weak,
 * verification fails closed and every protected route returns 401. A
 * service that refuses to authenticate is recoverable in minutes; one
 * that accepts forged admin tokens may never be noticed.
 *
 * → Remove FALLBACK_SECRET from ProdLamid and set JWT_SECRET in both.
 */

export class AuthError extends Error {
  constructor(msg: string) { super(msg); this.name = "AuthError"; }
}

export type AccessClaims = {
  sub: string;
  email?: string;
  role?: string;
  orgId?: string;
  orgRole?: string;
  type: string;
  exp?: number;
  iat?: number;
};

const b64urlToBuf = (s: string) =>
  Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64");

function secret(): string {
  const s = env.jwtSecret;
  if (!s || s.length < 32) {
    throw new AuthError(
      "JWT_SECRET is unset or shorter than 32 characters. Authentication is disabled until it is configured.",
    );
  }
  return s;
}

/**
 * Verify an HS256 token.
 *
 * Implemented directly rather than via `jsonwebtoken` so the app keeps
 * no auth dependency and the checks are visible: signature compared in
 * constant time, algorithm pinned, expiry enforced, token type checked.
 */
export function verifyAccessToken(token: string): AccessClaims {
  const parts = token.split(".");
  if (parts.length !== 3) throw new AuthError("Malformed token.");

  const [headerB64, payloadB64, signatureB64] = parts;

  let header: { alg?: string; typ?: string };
  try {
    header = JSON.parse(b64urlToBuf(headerB64).toString("utf8"));
  } catch {
    throw new AuthError("Malformed token header.");
  }

  /* Algorithm is pinned. Accepting the token's own `alg` is how the
     `alg: "none"` and RS256→HS256 confusion attacks work. */
  if (header.alg !== "HS256") throw new AuthError("Unsupported token algorithm.");

  const expected = createHmac("sha256", secret())
    .update(`${headerB64}.${payloadB64}`)
    .digest();
  const actual = b64urlToBuf(signatureB64);

  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    throw new AuthError("Invalid token signature.");
  }

  let claims: AccessClaims;
  try {
    claims = JSON.parse(b64urlToBuf(payloadB64).toString("utf8"));
  } catch {
    throw new AuthError("Malformed token payload.");
  }

  if (claims.type !== "access") throw new AuthError("Not an access token.");
  if (!claims.sub) throw new AuthError("Token has no subject.");

  const now = Math.floor(Date.now() / 1000);
  /* 30s leeway for clock skew between the issuing app and this one. */
  if (typeof claims.exp === "number" && claims.exp + 30 < now) {
    throw new AuthError("Token has expired.");
  }

  return claims;
}

/** Reads the bearer token from the Authorization header or the cookie
 *  ProdLamid sets, so both call styles work. */
export function tokenFrom(req: Request): string | null {
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7).trim();

  const cookie = req.headers.get("cookie");
  if (!cookie) return null;

  for (const name of ["accessToken", "access_token", "token"]) {
    const m = new RegExp(`(?:^|;\\s*)${name}=([^;]+)`).exec(cookie);
    if (m) return decodeURIComponent(m[1]);
  }
  return null;
}

export const authConfigured = () => Boolean(env.jwtSecret && env.jwtSecret.length >= 32);

/* ── Issuance ─────────────────────────────────────────────── */

const b64url = (buf: Buffer) =>
  buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

/**
 * Issue an access token, in the same claim shape ProdLamid's
 * `signAccessToken` produces — `sub`/`email`/`role`/`orgId`/`orgRole`/
 * `type` — so a token minted here verifies against ProdLamid's own
 * `verifyAccessToken` unmodified, and vice versa, as long as
 * `JWT_SECRET` matches.
 *
 * ProdLamid signs a 15-minute access token backed by a separate
 * refresh-token rotation flow. That flow is not built in this app yet,
 * so signing a 15-minute token here with nothing to renew it would log
 * a user out mid-session for no reason they could act on. Until the
 * refresh endpoint exists, this issues a longer-lived token
 * (`LAMID_SESSION_DAYS`, default 7) — a deliberate, temporary trade
 * documented here rather than silently shipped.
 */
export function signAccessToken(claims: {
  sub: string; email: string; role?: string; orgId?: string; orgRole?: string;
}): string {
  const days = Number(process.env.LAMID_SESSION_DAYS ?? 7);
  const now = Math.floor(Date.now() / 1000);
  const payload: AccessClaims = {
    ...claims,
    type: "access",
    iat: now,
    exp: now + Math.max(1, days) * 24 * 60 * 60,
  };

  const header = { alg: "HS256", typ: "JWT" };
  const headerB64 = b64url(Buffer.from(JSON.stringify(header)));
  const payloadB64 = b64url(Buffer.from(JSON.stringify(payload)));
  const signature = createHmac("sha256", secret()).update(`${headerB64}.${payloadB64}`).digest();

  return `${headerB64}.${payloadB64}.${b64url(signature)}`;
}
