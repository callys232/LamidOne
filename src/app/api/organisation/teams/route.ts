import { requirePersistenceInProd } from "@/lib/store";
import { handler, ok, fail, badRequest, rateLimited } from "@/lib/http";
import { limit } from "@/lib/ratelimit";
import { resolveIdentity } from "@/lib/entitlements";
import { listTeams, createTeam, OrgError } from "@/lib/organisation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = handler(async (req) => {
  const identity = await resolveIdentity(req);
  if (!identity.userId) return fail(401, "unauthorised", "Sign in to view teams.");
  if (!identity.orgId) return fail(400, "no_org", "This account is not part of an organisation.");

  const rl = await limit("read", identity.userId);
  if (!rl.ok) return rateLimited(rl.retryAfter);

  return ok({ teams: await listTeams(identity.orgId) });
});

export const POST = handler(async (req) => {
  requirePersistenceInProd();
  const identity = await resolveIdentity(req);
  if (!identity.userId) return fail(401, "unauthorised", "Sign in to create a team.");
  if (!identity.orgId) return fail(400, "no_org", "This account is not part of an organisation.");

  const rl = await limit("agent", identity.userId);
  if (!rl.ok) return rateLimited(rl.retryAfter);

  const body = await req.json().catch(() => null) as { name?: string; memberIds?: string[] } | null;
  if (!body?.name) return badRequest("`name` is required.");

  try {
    const team = await createTeam(identity.orgId, body.name, body.memberIds ?? []);
    return ok({ team }, { status: 201 });
  } catch (e) {
    if (e instanceof OrgError) return badRequest(e.message);
    throw e;
  }
});
