import { randomUUID } from "node:crypto";
import { handler, ok, fail, badRequest, tooLarge, rateLimited, bodyTooLarge } from "@/lib/http";
import { limit } from "@/lib/ratelimit";
import { resolveIdentity } from "@/lib/entitlements";
import { initializeTransaction, PaystackError, paystackConfigured } from "@/lib/paystack";
import { createOrder } from "@/lib/checkout";
import { requirePersistenceInProd } from "@/lib/store";
import { env } from "@/lib/env";
import { POINT_PACKAGES } from "@/content/agents";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* Not derivable/guessable, unlike the previous Date.now()+Math.random()
   scheme — these are checkout references, not just internal object
   ids, so they get the same treatment as any other unguessable token. */
const ref = () => `pts_${randomUUID()}`;

/**
 * Starts a real Paystack Checkout for a points package. The price
 * charged is always `POINT_PACKAGES`' own price — never a client-
 * supplied amount — so a tampered request cannot buy points for less
 * than the published rate.
 */
export const POST = handler(async (req) => {
  requirePersistenceInProd();
  if (bodyTooLarge(req, 1024)) return tooLarge();

  const identity = await resolveIdentity(req);
  if (!identity.userId || !identity.email) return fail(401, "unauthorised", "Sign in to buy points.");

  const rl = await limit("form", identity.userId);
  if (!rl.ok) return rateLimited(rl.retryAfter);

  const body = await req.json().catch(() => null) as { points?: number } | null;
  const pkg = POINT_PACKAGES.find((p) => p.points === body?.points);
  if (!pkg) return badRequest(`\`points\` must match a real package: ${POINT_PACKAGES.map((p) => p.points).join(", ")}.`);

  if (!paystackConfigured()) return fail(503, "not_configured", "Payments are not configured yet.");

  const reference = ref();
  await createOrder({ reference, userId: identity.userId, kind: "points", points: pkg.points, usd: pkg.usd });

  try {
    const tx = await initializeTransaction({
      email: identity.email,
      amountMajorUnit: pkg.usd,
      reference,
      callbackUrl: `${env.siteUrl}/api/checkout/callback`,
      metadata: { userId: identity.userId, kind: "points" },
    });
    return ok({ authorizationUrl: tx.authorization_url });
  } catch (e) {
    if (e instanceof PaystackError) return fail(502, "payment_failed", e.message);
    throw e;
  }
});
