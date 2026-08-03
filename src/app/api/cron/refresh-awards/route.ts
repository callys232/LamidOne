import { handler, ok, fail } from "@/lib/http";
import { refreshPublicAwards } from "@/lib/budget/contractsFinder";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/* The upstream takes ~21s per page, so a five-page refresh needs well
   over the default serverless budget. */
export const maxDuration = 300;

/**
 * Refreshes the cached Contracts Finder corpus.
 *
 * Scheduled rather than live for the two measured reasons documented in
 * lib/budget/contractsFinder.ts: the endpoint has no text search, and a
 * single page takes about twenty-one seconds. Neither is survivable
 * inside an interactive budget lookup, so the corpus is pulled here on
 * a timer and searched locally.
 *
 * Same shared-secret guard as the other cron routes — this is
 * infrastructure calling in, not a person.
 */
export const POST = handler(async (req) => {
  const secret = req.headers.get("x-lamid-cron-secret");
  if (!secret || secret !== process.env.LAMID_CRON_SECRET) {
    return fail(401, "unauthorised", "Cron secret required.");
  }

  const pages = Math.min(20, Math.max(1, Number(new URL(req.url).searchParams.get("pages")) || 5));
  const result = await refreshPublicAwards(pages);

  return ok({ ...result, pages, at: new Date().toISOString() });
});
