import { handler, ok, fail, badRequest, rateLimited } from "@/lib/http";
import { limit } from "@/lib/ratelimit";
import { resolveIdentity } from "@/lib/entitlements";
import { listMilestones, createMilestone, submitMilestone, approveMilestone, disputeMilestone, MilestoneError } from "@/lib/milestones";
import { requirePersistenceInProd } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = handler(async (req) => {
  const identity = await resolveIdentity(req);
  if (!identity.userId) return fail(401, "unauthorised", "Sign in to view milestones.");

  const rl = await limit("read", identity.userId);
  if (!rl.ok) return rateLimited(rl.retryAfter);

  const projectId = new URL(req.url).searchParams.get("projectId");
  if (!projectId) return badRequest("`projectId` query parameter is required.");

  return ok({ milestones: await listMilestones(projectId) });
});

/** Client defines a milestone. Free — structuring delivery is not metered. */
export const POST = handler(async (req) => {
  requirePersistenceInProd();
  const identity = await resolveIdentity(req);
  if (!identity.userId) return fail(401, "unauthorised", "Sign in to create a milestone.");

  const rl = await limit("agent", identity.userId);
  if (!rl.ok) return rateLimited(rl.retryAfter);

  const body = await req.json().catch(() => null) as
    | { projectId?: string; title?: string; amount?: number; currency?: string; dueDate?: string }
    | null;
  if (!body?.projectId || !body?.title || body.amount === undefined) {
    return badRequest("`projectId`, `title` and `amount` are required.");
  }

  try {
    const milestone = await createMilestone(identity.userId, body.projectId, body as never);
    return ok({ milestone }, { status: 201 });
  } catch (e) {
    if (e instanceof MilestoneError) return badRequest(e.message);
    throw e;
  }
});

/** State transitions. `{ id, action: "submit" | "approve" | "dispute" }`. */
export const PATCH = handler(async (req) => {
  requirePersistenceInProd();
  const identity = await resolveIdentity(req);
  if (!identity.userId) return fail(401, "unauthorised", "Sign in.");

  const rl = await limit("agent", identity.userId);
  if (!rl.ok) return rateLimited(rl.retryAfter);

  const body = await req.json().catch(() => null) as { id?: string; action?: string; note?: string } | null;
  if (!body?.id || !body?.action) return badRequest("`id` and `action` are required.");

  try {
    const milestone =
      body.action === "submit" ? await submitMilestone(identity.userId, body.id, body.note)
      : body.action === "approve" ? await approveMilestone(identity.userId, body.id)
      : body.action === "dispute" ? await disputeMilestone(body.id, identity.userId)
      : null;

    if (!milestone) return badRequest(`Unknown action "${body.action}".`);

    /* Audit logging for every transition lives inside milestones.ts,
       next to the state change itself (submit/dispute/auto-release all
       already log there) — this used to ALSO log "approve" here,
       writing the same event to the audit trail twice. */

    return ok({ milestone });
  } catch (e) {
    if (e instanceof MilestoneError) return badRequest(e.message);
    throw e;
  }
});
