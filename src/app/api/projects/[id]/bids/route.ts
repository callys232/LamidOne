import { handler, ok, fail, badRequest, tooLarge, rateLimited, bodyTooLarge } from "@/lib/http";
import { limit } from "@/lib/ratelimit";
import { resolveIdentity } from "@/lib/entitlements";
import { withMeterCost, available, getBalanceAsync } from "@/lib/points";
import {
  placeBid, listBids, MarketplaceError, PLACE_BID_COST, BOOST_BID_COST,
} from "@/lib/marketplace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const projectIdFrom = (req: Request) => new URL(req.url).pathname.split("/").at(-2) ?? "";

/** Bids on a project. Boosted first — that is what the boost buys. */
export const GET = handler(async (req) => {
  const identity = await resolveIdentity(req);
  if (!identity.userId) return fail(401, "unauthorised", "Sign in to view bids.");

  const rl = await limit("read", identity.userId);
  if (!rl.ok) return rateLimited(rl.retryAfter);

  return ok({
    bids: await listBids(projectIdFrom(req)),
    costs: { bid: PLACE_BID_COST, boost: BOOST_BID_COST },
  });
});

/** Place a bid. 20 points, or 80 with a boost. */
export const POST = handler(async (req) => {
  if (bodyTooLarge(req, 32 * 1024)) return tooLarge();

  const identity = await resolveIdentity(req);
  if (!identity.userId) return fail(401, "unauthorised", "Sign in to bid.");

  const rl = await limit("agent", identity.userId);
  if (!rl.ok) return rateLimited(rl.retryAfter);

  const body = await req.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return badRequest("Body must be JSON.");

  const boosted = body.boosted === true;
  const cost = PLACE_BID_COST + (boosted ? BOOST_BID_COST : 0);

  const balance = await getBalanceAsync(identity.userId);
  if (available(balance) < cost) {
    return fail(402, "insufficient_points",
      `This bid costs ${cost} points${boosted ? " with the boost" : ""}.`,
      { kind: "topup", points: cost - available(balance) });
  }

  try {
    /* Charged the exact cost the gate checked, boost included. A
       rejected bid — duplicate, closed project, short pitch — releases
       the hold and costs nothing. */
    const { result, charged, balance: after } = await withMeterCost(
      identity, cost, boosted ? "bid_boosted" : "bid_placed",
      () => placeBid(identity.userId!, { ...body, projectId: projectIdFrom(req) }),
    );

    return ok({ bid: result, charged, boosted, balance: { available: available(after) } }, { status: 201 });
  } catch (e) {
    if (e instanceof MarketplaceError) return badRequest(e.message);
    if ((e as Error).message === "insufficient_points") {
      return fail(402, "insufficient_points", "Not enough LAMID Points.", { kind: "topup" });
    }
    console.error("[bids] failed, not charged:", e);
    return fail(500, "bid_failed", "The bid could not be placed. You have not been charged.");
  }
});
