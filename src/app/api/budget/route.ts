import { handler, ok, fail, badRequest, tooLarge, rateLimited, bodyTooLarge } from "@/lib/http";
import { limit } from "@/lib/ratelimit";
import { resolveIdentity } from "@/lib/entitlements";
import { runBudget, EngineInputError } from "@/lib/engines";
import type { LineItem, BudgetSettings } from "@/lib/budget/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The budget calculator — F02, the one flagship diagnostic that isn't
 * an assessment. Free on every tier (see the FEATURE_MATRIX row:
 * "Budget estimator... free tool"), so this deliberately does not go
 * through the metered /api/engines/{code} path. Compute is
 * `computeBudget` — pure arithmetic, no model involved, which is what
 * "the arithmetic is shown" actually rests on.
 */
export const POST = handler(async (req) => {
  if (bodyTooLarge(req, 256 * 1024)) return tooLarge();

  const identity = await resolveIdentity(req);
  if (!identity.userId) return fail(401, "unauthorised", "Sign in to run the budget calculator.");

  const rl = await limit("read", identity.userId);
  if (!rl.ok) return rateLimited(rl.retryAfter);

  const body = await req.json().catch(() => null) as
    | { lineItems?: LineItem[]; settings?: BudgetSettings }
    | null;
  if (!body?.lineItems || !body.settings) {
    return badRequest("Body must include `lineItems` and `settings`.");
  }

  try {
    const { computed, csv } = runBudget(body.lineItems, body.settings);
    return ok({ computed, csv });
  } catch (e) {
    if (e instanceof EngineInputError) return badRequest(e.message);
    console.error("[budget] failed:", e);
    return fail(500, "budget_failed", "The budget could not be computed.");
  }
});
