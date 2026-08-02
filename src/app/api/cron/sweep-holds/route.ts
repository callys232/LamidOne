import { handler, ok, fail } from "@/lib/http";
import { sweepExpiredHoldsAsync } from "@/lib/points";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Scheduled backstop for stranded point holds (see the comment on
 * `sweepExpiredHoldsAsync` in lib/points.ts). The sweep also runs
 * opportunistically on every reserve/balance read for the affected
 * user, which resolves the common case — but an account that reserves
 * once and never comes back within the TTL needs THIS actually
 * scheduled (Vercel Cron, an external ping) to reclaim it, same
 * reasoning as /api/cron/auto-release for milestones.
 *
 * Guarded by the same shared-secret pattern — infrastructure calling
 * in, not a person.
 */
export const POST = handler(async (req) => {
  const secret = req.headers.get("x-lamid-cron-secret");
  if (!secret || secret !== process.env.LAMID_CRON_SECRET) {
    return fail(401, "unauthorised", "Cron secret required.");
  }

  const swept = await sweepExpiredHoldsAsync();
  return ok({ swept, at: new Date().toISOString() });
});
