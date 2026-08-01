import { handler, ok, fail, rateLimited } from "@/lib/http";
import { limit } from "@/lib/ratelimit";
import { resolveIdentity } from "@/lib/entitlements";
import { listBidsByExpert, getProject } from "@/lib/marketplace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** An expert's own bids, with the project title attached so the list
 *  is readable without a second lookup per row. */
export const GET = handler(async (req) => {
  const identity = await resolveIdentity(req);
  if (!identity.userId) return fail(401, "unauthorised", "Sign in to view your bids.");

  const rl = await limit("read", identity.userId);
  if (!rl.ok) return rateLimited(rl.retryAfter);

  const bids = await listBidsByExpert(identity.userId);
  const withProjects = await Promise.all(
    bids.map(async (b) => ({ bid: b, project: await getProject(b.projectId) })),
  );

  return ok({ bids: withProjects });
});
