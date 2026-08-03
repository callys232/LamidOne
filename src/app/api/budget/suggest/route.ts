import { handler, ok, badRequest, rateLimited, tooLarge, bodyTooLarge, clean } from "@/lib/http";
import { limit, clientId } from "@/lib/ratelimit";
import { resolveIdentity } from "@/lib/entitlements";
import { suggestDayRate, suggestProjectTotal } from "@/lib/budget/comparables";
import { publicAwardComparables } from "@/lib/budget/contractsFinder";
import { lookupWebRates, webRatesConfigured } from "@/lib/budget/webRates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Live rate suggestions as a budget line is typed.
 *
 * Two tiers, kept strictly separate in the response so the caller can
 * never conflate them:
 *
 *  · `platform` — real observed amounts from this platform's own bids
 *    and completed engagements, with sample size and spread. Trustworthy
 *    in proportion to its `confidence` field, which is never optimistic.
 *
 *  · `web` — live external retrieval, every figure carrying its source
 *    URL and the snippet it came from, never averaged. Off unless
 *    TAVILY_API_KEY is configured, and clearly marked unverified.
 *
 * Never merged into one number. A blended "suggested rate" spanning a
 * thin internal sample and an unverified web page would be a fabricated
 * figure with a credible-looking provenance, which is the precise
 * failure this whole engine is built to avoid.
 */
export const POST = handler(async (req) => {
  if (bodyTooLarge(req, 4 * 1024)) return tooLarge();

  const identity = await resolveIdentity(req);
  /* Read-bucket: this fires as the user types, so it must not consume
     the much tighter form/agent budgets. */
  const rl = await limit("read", identity.userId ?? clientId(req));
  if (!rl.ok) return rateLimited(rl.retryAfter);

  const body = await req.json().catch(() => null) as
    | { query?: string; currency?: string; kind?: string; skills?: string[]; includeWeb?: boolean }
    | null;

  const query = clean(body?.query, 200);
  if (query.length < 3) return badRequest("`query` must be at least 3 characters.");

  const currency = (clean(body?.currency, 3) || "USD").toUpperCase();
  const kind = body?.kind === "project-total" ? "project-total" : "day-rate";
  const skills = Array.isArray(body?.skills)
    ? body!.skills.slice(0, 12).map((s) => clean(s, 60)).filter(Boolean)
    : [];

  const platform = kind === "project-total"
    ? await suggestProjectTotal(query, skills, currency)
    : await suggestDayRate(query, currency);

  /* The web tier costs a round trip to a third party, so it is opt-in
     per request rather than fired on every keystroke. */
  const web = body?.includeWeb ? await lookupWebRates(query) : null;

  /* Public awards are a LOCAL index lookup — the corpus is refreshed on
     a schedule precisely so this costs nothing here — so unlike the web
     tier it can run on every request. Kept as its own field rather than
     blended into `platform`: internal history and UK public procurement
     are different populations, and averaging them would produce a
     number describing neither. */
  const publicAwards = await publicAwardComparables(query);

  return ok({
    query,
    currency,
    kind,
    platform,
    web,
    webAvailable: webRatesConfigured(),
    publicAwards,
  });
});
