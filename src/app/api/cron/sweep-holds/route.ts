import { handler, ok, fail } from "@/lib/http";
import { cronAuthorised } from "@/lib/cronAuth";
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
const run = handler(async (req: Request) => {
  if (!cronAuthorised(req)) return fail(401, "unauthorised", "Cron secret required.");

  const swept = await sweepExpiredHoldsAsync();
  return ok({ swept, at: new Date().toISOString() });
});

/* Vercel Cron invokes scheduled paths with a GET; everything else
   (manual curl, external scheduler) posts. Same work either way. */
export const GET = run;
export const POST = run;
