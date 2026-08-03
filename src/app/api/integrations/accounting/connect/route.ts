import { randomBytes, createHmac, timingSafeEqual } from "node:crypto";
import { handler, ok, fail, badRequest } from "@/lib/http";
import { resolveIdentity } from "@/lib/entitlements";
import { authorizeUrl, accountingConfigured, type AccountingProvider } from "@/lib/accounting";
import { env, required } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Starts the accounting OAuth flow.
 *
 * The `state` parameter is signed rather than stored. Storing it needs
 * a round trip and a cleanup job; an HMAC over `userId:provider:nonce`
 * is stateless, cannot be forged without JWT_SECRET, and lets the
 * callback recover which user began the flow without trusting anything
 * the provider echoes back. Without this, an attacker can hand a victim
 * a crafted callback URL and bind their own ledger to the victim's
 * account.
 */
export function signState(userId: string, provider: string): string {
  const nonce = randomBytes(8).toString("hex");
  const payload = `${userId}:${provider}:${nonce}`;
  const sig = createHmac("sha256", required(env.jwtSecret, "JWT_SECRET")).update(payload).digest("hex").slice(0, 32);
  return `${payload}:${sig}`;
}

export function verifyState(state: string): { userId: string; provider: string } | null {
  const parts = String(state ?? "").split(":");
  if (parts.length !== 4) return null;
  const [userId, provider, nonce, sig] = parts;
  const expected = createHmac("sha256", required(env.jwtSecret, "JWT_SECRET"))
    .update(`${userId}:${provider}:${nonce}`).digest("hex").slice(0, 32);

  const a = Buffer.from(sig, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return { userId, provider };
}

export const GET = handler(async (req) => {
  const identity = await resolveIdentity(req);
  if (!identity.userId) return fail(401, "unauthorised", "Sign in to connect an accounting system.");

  const provider = new URL(req.url).searchParams.get("provider") as AccountingProvider | null;
  if (provider !== "xero" && provider !== "quickbooks") {
    return badRequest("`provider` must be `xero` or `quickbooks`.");
  }
  if (!accountingConfigured(provider)) {
    return fail(503, "not_configured",
      `${provider} is not configured on this deployment. Set ${provider === "xero" ? "XERO" : "QUICKBOOKS"}_CLIENT_ID and _CLIENT_SECRET.`);
  }

  const url = authorizeUrl(provider, env.siteUrl, signState(identity.userId, provider));
  if (!url) return fail(503, "not_configured", "Could not build the authorisation URL.");

  /* Returned as JSON rather than a 302 so the caller is a normal
     fetch() and the client decides when to navigate — a redirect here
     would break the XHR that requested it. */
  return ok({ authorizeUrl: url });
});
