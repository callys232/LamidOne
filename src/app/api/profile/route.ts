import { handler, ok, fail, badRequest, rateLimited, clean } from "@/lib/http";
import { limit } from "@/lib/ratelimit";
import { resolveIdentity } from "@/lib/entitlements";
import { findUserById, updateUser, publicUser } from "@/lib/users";
import { profileCompletion } from "@/lib/profileCompletion";
import type { User } from "@/lib/users";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** The signed-in user's own profile, plus completion status — what
 *  the "complete your profile" banner and the settings editor both read. */
export const GET = handler(async (req) => {
  const identity = await resolveIdentity(req);
  if (!identity.userId) return fail(401, "unauthorised", "Sign in to view your profile.");

  const rl = await limit("read", identity.userId);
  if (!rl.ok) return rateLimited(rl.retryAfter);

  const user = await findUserById(identity.userId);
  if (!user) return fail(404, "not_found", "No profile on record for this account.");

  const role = identity.role ?? user.role;
  return ok({ user: publicUser(user), completion: await profileCompletion(user, role) });
});

/** Update name / organisation. Email and role are not editable here —
 *  changing the sign-in email is a separate, verification-gated flow
 *  this build does not implement yet, and role is fixed at signup. */
export const PATCH = handler(async (req) => {
  const identity = await resolveIdentity(req);
  if (!identity.userId) return fail(401, "unauthorised", "Sign in to update your profile.");

  const rl = await limit("form", identity.userId);
  if (!rl.ok) return rateLimited(rl.retryAfter);

  const body = await req.json().catch(() => null) as { name?: string; organisation?: string } | null;
  if (!body) return badRequest("Body must be JSON.");

  const patch: Partial<Pick<User, "name" | "organisation">> = {};
  if (typeof body.name === "string") {
    const name = clean(body.name, 120);
    if (name.length < 2) return badRequest("Name must be at least 2 characters.");
    patch.name = name;
  }
  if (typeof body.organisation === "string") {
    patch.organisation = clean(body.organisation, 160);
  }
  if (Object.keys(patch).length === 0) return badRequest("Nothing to update.");

  const user = await updateUser(identity.userId, patch);
  if (!user) return fail(404, "not_found", "No profile on record for this account.");
  return ok({ user: publicUser(user) });
});
