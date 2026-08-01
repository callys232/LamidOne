import { handler, ok, fail, tooLarge, rateLimited, bodyTooLarge, badRequest } from "@/lib/http";
import { limit } from "@/lib/ratelimit";
import { resolveIdentity } from "@/lib/entitlements";
import { registerForEvent, EventError } from "@/lib/events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = handler(async (req) => {
  if (bodyTooLarge(req, 256)) return tooLarge();

  const eventId = new URL(req.url).pathname.split("/").at(-2) ?? "";

  const identity = await resolveIdentity(req);
  if (!identity.userId) return fail(401, "unauthorised", "Sign in to register for an event.");

  const rl = await limit("form", identity.userId);
  if (!rl.ok) return rateLimited(rl.retryAfter);

  try {
    const event = await registerForEvent(eventId, identity.userId);
    return ok({ event });
  } catch (e) {
    if (e instanceof EventError) return badRequest(e.message);
    throw e;
  }
});
