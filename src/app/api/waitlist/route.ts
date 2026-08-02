import { handler, ok, badRequest, rateLimited, bodyTooLarge, clean } from "@/lib/http";
import { limit, clientId } from "@/lib/ratelimit";
import { joinWaitlist, WaitlistError } from "@/lib/waitlist";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = handler(async (req) => {
  if (bodyTooLarge(req, 4 * 1024)) return badRequest("Request too large.");

  const rl = await limit("form", clientId(req));
  if (!rl.ok) return rateLimited(rl.retryAfter);

  const body = await req.json().catch(() => null) as { email?: string; source?: string } | null;
  if (!body?.email) return badRequest("`email` is required.");

  try {
    const { alreadyJoined } = await joinWaitlist(body.email, clean(body.source ?? "bizsphere-modal", 60));
    return ok({ joined: true, alreadyJoined });
  } catch (e) {
    if (e instanceof WaitlistError) return badRequest(e.message);
    throw e;
  }
});
