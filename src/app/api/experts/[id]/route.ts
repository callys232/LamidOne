import { handler, ok, fail, rateLimited } from "@/lib/http";
import { limit, clientId } from "@/lib/ratelimit";
import { resolveIdentity } from "@/lib/entitlements";
import { getExpertProfile } from "@/lib/marketplace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** A single expert's public profile — used by the invite-to-a-brief flow
 *  to show who a client is about to invite before they commit. */
export const GET = handler(async (req) => {
  const identity = await resolveIdentity(req);
  const rl = await limit("read", identity.userId ?? clientId(req));
  if (!rl.ok) return rateLimited(rl.retryAfter);

  const id = new URL(req.url).pathname.split("/").at(-1) ?? "";
  const expert = await getExpertProfile(id);
  if (!expert) return fail(404, "not_found", "No such expert.");

  return ok({ expert });
});
