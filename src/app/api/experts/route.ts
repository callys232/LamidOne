import { handler, ok, rateLimited } from "@/lib/http";
import { limit, clientId } from "@/lib/ratelimit";
import { resolveIdentity } from "@/lib/entitlements";
import { listExperts } from "@/lib/marketplace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = handler(async (req) => {
  const identity = await resolveIdentity(req);
  const rl = await limit("read", identity.userId ?? clientId(req));
  if (!rl.ok) return rateLimited(rl.retryAfter);

  const discipline = new URL(req.url).searchParams.get("discipline") ?? undefined;
  return ok({ experts: await listExperts({ discipline }) });
});
