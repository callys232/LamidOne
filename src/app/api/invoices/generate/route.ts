import { handler, ok, fail, rateLimited, tooLarge, bodyTooLarge } from "@/lib/http";
import { limit } from "@/lib/ratelimit";
import { resolveIdentity } from "@/lib/entitlements";
import { generateOutstandingInvoices } from "@/lib/invoices";
import { requirePersistenceInProd } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Raise every outstanding invoice the caller is owed, in one call —
 * auto-pulls approved-but-uninvoiced milestones across every project
 * they're the awarded expert on. See lib/invoices.ts's
 * `generateOutstandingInvoices` for the actual logic; this route is
 * just identity resolution and rate limiting around it.
 *
 * `identity.userId` comes from `resolveIdentity(req)` only — never
 * from the request body. There is no field a caller can pass to
 * generate invoices "for" someone else.
 */
export const POST = handler(async (req) => {
  requirePersistenceInProd();
  if (bodyTooLarge(req, 4 * 1024)) return tooLarge();

  const identity = await resolveIdentity(req);
  if (!identity.userId) return fail(401, "unauthorised", "Sign in to generate invoices.");

  const rl = await limit("form", identity.userId);
  if (!rl.ok) return rateLimited(rl.retryAfter);

  const body = await req.json().catch(() => ({})) as Record<string, unknown>;
  const result = await generateOutstandingInvoices(identity.userId, identity.orgId, {
    taxPct: typeof body.taxPct === "number" ? body.taxPct : undefined,
    paymentTermDays: typeof body.paymentTermDays === "number" ? body.paymentTermDays : undefined,
  });

  return ok(result, { status: 201 });
});
