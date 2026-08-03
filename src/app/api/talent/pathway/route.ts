import { handler, ok, fail, badRequest, rateLimited, tooLarge, bodyTooLarge } from "@/lib/http";
import { limit, clientId } from "@/lib/ratelimit";
import { resolveIdentity } from "@/lib/entitlements";
import { computeCareerPath, type CareerPathInput } from "@/lib/talent/careerPath";
import { TARGET_ROLES, requirementsFor } from "@/lib/talent/roleCatalogue";
import { fetchLearnerCompletions, learningConfigured, learnSearchUrl } from "@/lib/learning";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * TALENT PATHWAYS.
 *
 * `lib/talent/careerPath.ts` and its role catalogue have existed in
 * this codebase since the original port and were wired to NOTHING —
 * a complete, working recommender that no route and no page could
 * reach. This exposes it.
 *
 * It is deliberately not a diagnostic. A diagnostic scores where you
 * are; this compares held skills and completed learning against what
 * a named target role actually requires, and returns the ranked gap
 * plus what to do about it. That difference is why the TALENT suite
 * CTA points here rather than at an assessment.
 *
 * Requirements come from the catalogue by default so a user only has
 * to name a target role, but a caller may supply their own — an
 * organisation's real role definitions always beat a generic one.
 */

/** The catalogue, so the form can offer real target roles. */
export const GET = handler(async (req) => {
  const rl = await limit("read", clientId(req));
  if (!rl.ok) return rateLimited(rl.retryAfter);

  return ok({
    roles: TARGET_ROLES,
    requirements: Object.fromEntries(TARGET_ROLES.map((r) => [r, requirementsFor(r)])),
    /* So the form can tell the user whether learning will sync or has
       to be typed, BEFORE they start typing it. */
    learningSync: learningConfigured(),
  });
});

export const POST = handler(async (req) => {
  if (bodyTooLarge(req, 64 * 1024)) return tooLarge();

  const identity = await resolveIdentity(req);
  /* Same "fill it in free, sign in for the result" pattern as the
     budget builder and the public diagnostics — the work of entering
     skills is investment the visitor has already made by this point. */
  if (!identity.userId) return fail(401, "unauthorised", "Sign in to see your pathway.");

  const rl = await limit("read", identity.userId);
  if (!rl.ok) return rateLimited(rl.retryAfter);

  const body = await req.json().catch(() => null) as Partial<CareerPathInput> | null;
  if (!body?.targetRole) return badRequest("`targetRole` is required.");

  const requirements = Array.isArray(body.requirements) && body.requirements.length > 0
    ? body.requirements
    : requirementsFor(String(body.targetRole));

  if (requirements.length === 0) {
    return badRequest(
      `No requirements known for "${body.targetRole}". Choose a catalogue role, or supply your own \`requirements\`.`,
    );
  }

  /* Learning comes from LAMID LEARN when the LMS can supply it, and
     from what the user typed when it cannot. Never merged silently —
     `learningSource` tells the caller which one they are looking at. */
  const fromLms = await fetchLearnerCompletions(identity.email ?? "");
  const manual = Array.isArray(body.learning) ? body.learning.slice(0, 100) : [];
  const learning = fromLms.available && fromLms.records.length > 0 ? fromLms.records : manual;

  const result = computeCareerPath({
    currentRole:  String(body.currentRole ?? "").slice(0, 120),
    targetRole:   String(body.targetRole).slice(0, 120),
    skills:       Array.isArray(body.skills) ? body.skills.slice(0, 100) : [],
    learning,
    requirements,
  });

  return ok({
    result,
    targetRole: body.targetRole,
    learningSource: fromLms.available
      ? { from: "lms" as const, count: fromLms.records.length }
      : { from: "manual" as const, count: manual.length, reason: fromLms.reason },
    /* Deep links work with no LMS API at all — the one part of this
       integration that can ship today. */
    learnLinks: result.gaps.slice(0, 5).map((g) => ({ skill: g.skill, href: learnSearchUrl(g.skill) })),
  });
});
