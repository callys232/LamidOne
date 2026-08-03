import { handler, ok, fail } from "@/lib/http";
import { cronAuthorised } from "@/lib/cronAuth";
import { processAutoReleases } from "@/lib/milestones";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Scheduled entry point for the escrow silence-fallback release.
 *
 * `processAutoReleases()` also runs opportunistically on every read of
 * `/api/engagements`, so the system self-corrects even with nothing
 * external configured — but that only fires when someone is looking at
 * their dashboard. A milestone whose deadline passes while nobody logs
 * in needs THIS to actually be scheduled (Vercel Cron, an external
 * ping) to release on time rather than whenever the next visit happens.
 *
 * Guarded by a shared secret rather than a user session — this is
 * infrastructure calling in, not a person.
 */
const run = handler(async (req: Request) => {
  if (!cronAuthorised(req)) return fail(401, "unauthorised", "Cron secret required.");

  const result = await processAutoReleases();
  return ok({ ...result, at: new Date().toISOString() });
});

/* Vercel Cron invokes scheduled paths with a GET; everything else
   (manual curl, external scheduler) posts. Same work either way. */
export const GET = run;
export const POST = run;
