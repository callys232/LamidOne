import { requirePersistenceInProd } from "@/lib/store";
import { handler, ok, fail, rateLimited, badRequest } from "@/lib/http";
import { limit } from "@/lib/ratelimit";
import { resolveIdentity } from "@/lib/entitlements";
import { listInvitations, revokeInvitation } from "@/lib/organisation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = handler(async (req) => {
  const identity = await resolveIdentity(req);
  if (!identity.userId) return fail(401, "unauthorised", "Sign in to view invitations.");
  if (!identity.orgId) return fail(400, "no_org", "This account is not part of an organisation.");

  const rl = await limit("read", identity.userId);
  if (!rl.ok) return rateLimited(rl.retryAfter);

  return ok({ invitations: await listInvitations(identity.orgId) });
});

/** Revoke. `{ id }` in the body. */
export const DELETE = handler(async (req) => {
  requirePersistenceInProd();
  const identity = await resolveIdentity(req);
  if (!identity.userId) return fail(401, "unauthorised", "Sign in to manage invitations.");
  if (!identity.orgId) return fail(400, "no_org", "This account is not part of an organisation.");

  const body = await req.json().catch(() => null) as { id?: string } | null;
  if (!body?.id) return badRequest("`id` is required.");

  await revokeInvitation(identity.orgId, body.id);
  return ok({ revoked: true });
});
