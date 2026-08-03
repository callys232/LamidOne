import { timingSafeEqual } from "node:crypto";

/**
 * Authorises a scheduled-job request.
 *
 * Two callers, two conventions, and both must work:
 *
 *  · VERCEL CRON invokes the path with a GET and an
 *    `Authorization: Bearer <CRON_SECRET>` header, using the CRON_SECRET
 *    environment variable Vercel injects. It cannot be configured to
 *    send a custom header or a POST body.
 *
 *  · ANYTHING ELSE - a manual curl, an external scheduler, a
 *    self-hosted deploy - uses `x-lamid-cron-secret`, which predates
 *    the Vercel wiring and is what the rest of the docs describe.
 *
 * Supporting only the second is why adding vercel.json on its own would
 * have silently done nothing: the schedule fires, the route rejects it,
 * and nothing in the product tells you the jobs never ran.
 *
 * Compared in constant time. These secrets gate escrow release, so a
 * timing oracle on them is worth closing even though it is a stretch.
 */
function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a, "utf8");
  const y = Buffer.from(b, "utf8");
  return x.length === y.length && timingSafeEqual(x, y);
}

export function cronAuthorised(req: Request): boolean {
  const vercel = process.env.CRON_SECRET;
  const own = process.env.LAMID_CRON_SECRET;

  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (vercel && bearer && safeEqual(bearer, vercel)) return true;

  const header = req.headers.get("x-lamid-cron-secret");
  if (own && header && safeEqual(header, own)) return true;

  /* Vercel also accepts CRON_SECRET on the custom header for anyone who
     prefers to keep a single secret across both paths. */
  if (vercel && header && safeEqual(header, vercel)) return true;

  return false;
}

/** True when neither secret is set, so /api/health can say the jobs are
 *  unreachable rather than leaving it to be discovered. */
export const cronConfigured = () =>
  Boolean(process.env.CRON_SECRET || process.env.LAMID_CRON_SECRET);
