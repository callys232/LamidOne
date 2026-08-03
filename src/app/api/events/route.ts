import { requirePersistenceInProd } from "@/lib/store";
import { handler, ok, fail, badRequest, tooLarge, rateLimited, bodyTooLarge } from "@/lib/http";
import { limit, clientId } from "@/lib/ratelimit";
import { resolveIdentity } from "@/lib/entitlements";
import { createEvent, listEvents, EventError, EVENT_CATEGORIES } from "@/lib/events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Events are public marketing/community content — readable by anyone,
 *  the same way suite pages and free tools are. */
export const GET = handler(async (req) => {
  const rl = await limit("read", clientId(req));
  if (!rl.ok) return rateLimited(rl.retryAfter);

  const url = new URL(req.url);
  const category = url.searchParams.get("category");
  const upcomingOnly = url.searchParams.get("upcoming") !== "false";

  return ok({
    events: await listEvents({
      category: EVENT_CATEGORIES.includes(category as never) ? (category as never) : undefined,
      upcomingOnly,
    }),
    categories: EVENT_CATEGORIES,
  });
});

/** Host an event. Free — this is content, not a metered agent action. */
export const POST = handler(async (req) => {
  requirePersistenceInProd();
  if (bodyTooLarge(req, 8 * 1024)) return tooLarge();

  const identity = await resolveIdentity(req);
  if (!identity.userId) return fail(401, "unauthorised", "Sign in to host an event.");

  const rl = await limit("form", identity.userId);
  if (!rl.ok) return rateLimited(rl.retryAfter);

  const body = await req.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return badRequest("Body must be JSON.");

  try {
    const event = await createEvent(identity.userId, identity.orgId, body);
    return ok({ event }, { status: 201 });
  } catch (e) {
    if (e instanceof EventError) return badRequest(e.message);
    throw e;
  }
});
