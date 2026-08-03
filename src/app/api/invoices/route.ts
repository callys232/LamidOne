import { handler, ok, fail, badRequest, rateLimited, tooLarge, bodyTooLarge } from "@/lib/http";
import { limit } from "@/lib/ratelimit";
import { resolveIdentity } from "@/lib/entitlements";
import { createInvoice, listInvoices, invoiceFromMilestones, InvoiceError, type InvoiceStatus } from "@/lib/invoices";
import { requirePersistenceInProd } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = handler(async (req) => {
  const identity = await resolveIdentity(req);
  if (!identity.userId) return fail(401, "unauthorised", "Sign in to view invoices.");

  const rl = await limit("read", identity.userId);
  if (!rl.ok) return rateLimited(rl.retryAfter);

  const url = new URL(req.url);
  const status = url.searchParams.get("status") as InvoiceStatus | null;

  return ok({
    invoices: await listInvoices({
      issuerId: identity.userId,
      status: status ?? undefined,
      take: Number(url.searchParams.get("take") ?? 50),
    }),
  });
});

/**
 * Raise an invoice — either free-form, or generated from approved
 * milestones when `projectId` and `milestoneIds` are supplied. The
 * milestone path is the one that matters: it carries the milestone ids
 * onto the invoice so the amount invoiced is traceable to the work the
 * client actually signed off.
 */
export const POST = handler(async (req) => {
  requirePersistenceInProd();
  if (bodyTooLarge(req, 64 * 1024)) return tooLarge();

  const identity = await resolveIdentity(req);
  if (!identity.userId) return fail(401, "unauthorised", "Sign in to raise an invoice.");

  const rl = await limit("form", identity.userId);
  if (!rl.ok) return rateLimited(rl.retryAfter);

  const body = await req.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return badRequest("Body must be JSON.");

  try {
    const invoice = body.projectId && Array.isArray(body.milestoneIds)
      ? await invoiceFromMilestones(
          identity.userId, identity.orgId,
          String(body.projectId), body.milestoneIds.map(String),
          body.client as never, body,
        )
      : await createInvoice(identity.userId, identity.orgId, body);

    return ok({ invoice }, { status: 201 });
  } catch (e) {
    if (e instanceof InvoiceError) return badRequest(e.message);
    throw e;
  }
});
