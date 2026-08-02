import { handler, ok, fail, rateLimited } from "@/lib/http";
import { limit } from "@/lib/ratelimit";
import { resolveIdentity } from "@/lib/entitlements";
import { findUserById } from "@/lib/users";
import { createTicket } from "@/lib/tickets";
import { requirePersistenceInProd } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * "Request deletion" on /dashboard/settings — previously a button with
 * no handler behind it. This does not delete anything automatically:
 * an unauthenticated or one-click irreversible delete on a shared
 * account (orgs, awarded projects, escrow in flight) is a real way to
 * destroy other people's data by accident, not a shortcut worth
 * taking. What it does instead is create a real, persisted,
 * reviewable record — the same support-ticket queue every other
 * request already goes through — so "deletion on request, with the
 * operator audit trail retained" (trust centre) is actually true
 * rather than aspirational.
 */
export const POST = handler(async (req) => {
  requirePersistenceInProd();
  const identity = await resolveIdentity(req);
  if (!identity.userId) return fail(401, "unauthorised", "Sign in to request deletion.");

  const rl = await limit("form", identity.userId);
  if (!rl.ok) return rateLimited(rl.retryAfter);

  const user = await findUserById(identity.userId);
  if (!user) return fail(404, "not_found", "No profile on record for this account.");

  const ticket = await createTicket(
    identity.userId,
    "Account deletion request",
    `Account deletion requested via Settings by ${user.email} (user id ${user.id}) at ${new Date().toISOString()}. Verify identity and any open escrow/organisation obligations before deleting.`,
  );

  return ok({ requested: true, ticketId: ticket.id });
});
