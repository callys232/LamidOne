import { handler, ok, fail, rateLimited } from "@/lib/http";
import { limit } from "@/lib/ratelimit";
import { resolveIdentity } from "@/lib/entitlements";
import { buildDashboard } from "@/lib/dashboardData";
import type { DashboardRole } from "@/content/dashboard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_ROLES: DashboardRole[] = ["client", "expert", "enterprise", "concierge", "operator"];

/**
 * The whole dashboard, in one read.
 *
 * `?as=expert` lets an operator view another role's dashboard for
 * support — restricted to operators only, so a client cannot request
 * `?as=operator` and see the operator console's data shape.
 */
export const GET = handler(async (req) => {
  const identity = await resolveIdentity(req);
  if (!identity.userId) return fail(401, "unauthorised", "Sign in to view your dashboard.");

  const rl = await limit("read", identity.userId);
  if (!rl.ok) return rateLimited(rl.retryAfter);

  const asParam = new URL(req.url).searchParams.get("as") as DashboardRole | null;
  let roleOverride: DashboardRole | undefined;

  if (asParam) {
    if (!identity.isAdmin) {
      return fail(403, "forbidden", "Only operators can view another role's dashboard.");
    }
    if (!VALID_ROLES.includes(asParam)) {
      return fail(400, "bad_request", `"${asParam}" is not a dashboard role.`);
    }
    roleOverride = asParam;
  }

  return ok(await buildDashboard(identity, roleOverride));
});
