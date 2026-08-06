import { handler, ok, fail, badRequest, rateLimited, clean } from "@/lib/http";
import { limit } from "@/lib/ratelimit";
import { resolveIdentity } from "@/lib/entitlements";
import { ensureExpertProfile, updateExpertProfile } from "@/lib/marketplace";
import { requirePersistenceInProd } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The signed-in expert's OWN marketplace profile — headline and
 * disciplines. Nothing edited this before: `ensureExpertProfile()` ran
 * once at signup and left every expert stuck on "New on LAMID MARKET —
 * profile not yet completed" with `disciplines: []` forever, which is
 * also why Compass/Scout had nothing real to score against in testing.
 */
export const GET = handler(async (req) => {
  const identity = await resolveIdentity(req);
  if (!identity.userId) return fail(401, "unauthorised", "Sign in to view your expert profile.");

  const rl = await limit("read", identity.userId);
  if (!rl.ok) return rateLimited(rl.retryAfter);

  const expert = await ensureExpertProfile(identity.userId, identity.name ?? "Expert");
  return ok({ expert });
});

export const PATCH = handler(async (req) => {
  requirePersistenceInProd();
  const identity = await resolveIdentity(req);
  if (!identity.userId) return fail(401, "unauthorised", "Sign in to update your expert profile.");

  const rl = await limit("form", identity.userId);
  if (!rl.ok) return rateLimited(rl.retryAfter);

  const body = await req.json().catch(() => null) as {
    headline?: string; disciplines?: unknown; industries?: unknown;
  } | null;
  if (!body) return badRequest("Body must be JSON.");

  const patch: { headline?: string; disciplines?: string[]; industries?: string[] } = {};

  if (typeof body.headline === "string") {
    const headline = clean(body.headline, 160);
    if (headline.length < 8) return badRequest("Headline needs at least 8 characters.");
    patch.headline = headline;
  }
  if (Array.isArray(body.disciplines)) {
    patch.disciplines = body.disciplines.map((d) => clean(String(d), 60)).filter(Boolean).slice(0, 20);
  }
  if (Array.isArray(body.industries)) {
    patch.industries = body.industries.map((i) => clean(String(i), 60)).filter(Boolean).slice(0, 20);
  }
  if (Object.keys(patch).length === 0) return badRequest("Nothing to update.");

  await ensureExpertProfile(identity.userId, identity.name ?? "Expert");
  const expert = await updateExpertProfile(identity.userId, patch);
  if (!expert) return fail(404, "not_found", "No expert profile on record for this account.");
  return ok({ expert });
});
