import { handler, ok, fail, badRequest } from "@/lib/http";
import { mockEnabled } from "@/lib/mockUsers";
import { findUserByEmail, setTierForTesting, publicUser } from "@/lib/users";
import type { TierId } from "@/content/tiers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TIERS: TierId[] = ["free", "starter", "growth", "enterprise", "concierge"];

/**
 * Dev-only: sets a real account's tier without a real payment, so a
 * signed-up test account can be used to see what each tier's plan
 * actually looks like. Same 404-not-403 pattern as /api/dev/users —
 * a disabled dev endpoint should not confirm it exists.
 */
export const POST = handler(async (req) => {
  if (!mockEnabled()) return fail(404, "not_found", "Not found.");

  const body = await req.json().catch(() => null) as { email?: string; tier?: string } | null;
  if (!body?.email || !body?.tier) return badRequest("`email` and `tier` are required.");
  if (!TIERS.includes(body.tier as TierId)) return badRequest(`\`tier\` must be one of: ${TIERS.join(", ")}.`);

  const user = await findUserByEmail(body.email);
  if (!user) return fail(404, "not_found", "No account with that email.");

  const updated = await setTierForTesting(user.id, body.tier as TierId);
  return ok({ user: updated ? publicUser(updated) : null });
});
