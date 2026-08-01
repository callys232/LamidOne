import { handler, ok, fail } from "@/lib/http";
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
export const POST = handler(async (req) => {
  const secret = req.headers.get("x-lamid-cron-secret");
  if (!secret || secret !== process.env.LAMID_CRON_SECRET) {
    return fail(401, "unauthorised", "Cron secret required.");
  }

  const result = await processAutoReleases();
  return ok({ ...result, at: new Date().toISOString() });
});
