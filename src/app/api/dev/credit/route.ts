import { handler, ok, fail, badRequest } from "@/lib/http";
import { creditAsync } from "@/lib/points";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Credit a dev/test account with points, for local testing of the
 * points-gated flows (posting, bidding, agent runs) without waiting on
 * a real Paystack top-up. Same shared-secret gate as the other
 * /api/dev/* routes — not a customer-facing endpoint.
 */
export const POST = handler(async (req) => {
  const secret = req.headers.get("x-lamid-cron-secret");
  if (!secret || secret !== process.env.LAMID_CRON_SECRET) {
    return fail(401, "unauthorised", "Cron secret required.");
  }

  const body = await req.json().catch(() => null) as { userId?: string; points?: number } | null;
  if (!body?.userId || !Number.isFinite(body.points)) return badRequest("Body must include `userId` and numeric `points`.");

  const balance = await creditAsync(body.userId, body.points!, "purchased", "dev credit for testing");
  return ok({ balance });
});
