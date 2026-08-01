import { handler, ok, fail, badRequest, rateLimited } from "@/lib/http";
import { limit } from "@/lib/ratelimit";
import { resolveIdentity } from "@/lib/entitlements";
import { getVerification, submitVerification, VerificationError } from "@/lib/verification";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = handler(async (req) => {
  const identity = await resolveIdentity(req);
  if (!identity.userId) return fail(401, "unauthorised", "Sign in to view verification status.");

  const rl = await limit("read", identity.userId);
  if (!rl.ok) return rateLimited(rl.retryAfter);

  return ok({ verification: await getVerification(identity.userId) });
});

/**
 * Submit for review.
 *
 * Moves the record to `pending` only. Nothing in this route can set
 * `status: "verified"` — that transition belongs to an operator action,
 * so a self-serve submission can never grant its own credential.
 */
export const POST = handler(async (req) => {
  const identity = await resolveIdentity(req);
  if (!identity.userId) return fail(401, "unauthorised", "Sign in to submit verification.");

  const rl = await limit("form", identity.userId);
  if (!rl.ok) return rateLimited(rl.retryAfter);

  const body = await req.json().catch(() => null) as { documents?: { kind: string; ref: string }[] } | null;
  if (!body?.documents) return badRequest("`documents` is required.");

  try {
    const record = await submitVerification(identity.userId, body.documents);
    return ok({ verification: record });
  } catch (e) {
    if (e instanceof VerificationError) return badRequest(e.message);
    throw e;
  }
});
