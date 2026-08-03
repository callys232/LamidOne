import { handler, ok, fail } from "@/lib/http";
import { cronAuthorised } from "@/lib/cronAuth";
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
const run = handler(async (req: Request) => {
  if (!cronAuthorised(req)) return fail(401, "unauthorised", "Cron secret required.");

  const pages = Math.min(20, Math.max(1, Number(new URL(req.url).searchParams.get("pages")) || 5));
  const result = await refreshPublicAwards(pages);

  return ok({ ...result, pages, at: new Date().toISOString() });
});

/* Vercel Cron invokes scheduled paths with a GET; everything else
   (manual curl, external scheduler) posts. Same work either way. */
export const GET = run;
export const POST = run;
