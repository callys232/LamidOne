import { requirePersistenceInProd } from "@/lib/store";
import { handler, ok, fail, badRequest, rateLimited } from "@/lib/http";
import { limit } from "@/lib/ratelimit";
import { resolveIdentity } from "@/lib/entitlements";
import { listTickets, createTicket, responseTargetFor, TicketError } from "@/lib/tickets";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = handler(async (req) => {
  const identity = await resolveIdentity(req);
  if (!identity.userId) return fail(401, "unauthorised", "Sign in to view tickets.");

  const rl = await limit("read", identity.userId);
  if (!rl.ok) return rateLimited(rl.retryAfter);

  return ok({
    tickets: await listTickets(identity.userId),
    responseTarget: responseTargetFor(identity.tier as never),
  });
});

/** Free — raising a ticket should never cost points. */
export const POST = handler(async (req) => {
  requirePersistenceInProd();
  const identity = await resolveIdentity(req);
  if (!identity.userId) return fail(401, "unauthorised", "Sign in to raise a ticket.");

  const rl = await limit("form", identity.userId);
  if (!rl.ok) return rateLimited(rl.retryAfter);

  const body = await req.json().catch(() => null) as { subject?: string; body?: string } | null;
  if (!body?.subject || !body?.body) return badRequest("`subject` and `body` are required.");

  try {
    const ticket = await createTicket(identity.userId, body.subject, body.body);
    return ok({ ticket }, { status: 201 });
  } catch (e) {
    if (e instanceof TicketError) return badRequest(e.message);
    throw e;
  }
});
