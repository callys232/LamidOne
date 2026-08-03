import { handler, ok, fail, badRequest, rateLimited } from "@/lib/http";
import { limit } from "@/lib/ratelimit";
import { resolveIdentity } from "@/lib/entitlements";
import { getInvoice, transitionInvoice, InvoiceError, type InvoiceStatus } from "@/lib/invoices";
import { requirePersistenceInProd } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const idFrom = (req: Request) => new URL(req.url).pathname.split("/").at(-1) ?? "";

export const GET = handler(async (req) => {
  const identity = await resolveIdentity(req);
  if (!identity.userId) return fail(401, "unauthorised", "Sign in to view this invoice.");

  const rl = await limit("read", identity.userId);
  if (!rl.ok) return rateLimited(rl.retryAfter);

  const invoice = await getInvoice(idFrom(req));
  if (!invoice) return fail(404, "not_found", "No such invoice.");
  /* Issuer-scoped: an invoice is a financial record about two named
     parties and is not readable by anyone who happens to know its id. */
  if (invoice.issuerId !== identity.userId) return fail(404, "not_found", "No such invoice.");

  return ok({ invoice });
});

/** Status transitions only — an issued invoice's figures are not editable. */
export const PATCH = handler(async (req) => {
  requirePersistenceInProd();
  const identity = await resolveIdentity(req);
  if (!identity.userId) return fail(401, "unauthorised", "Sign in to update this invoice.");

  const rl = await limit("form", identity.userId);
  if (!rl.ok) return rateLimited(rl.retryAfter);

  const body = await req.json().catch(() => null) as
    | { status?: InvoiceStatus; amountPaid?: number; paymentReference?: string } | null;
  if (!body?.status) return badRequest("`status` is required.");

  try {
    const invoice = await transitionInvoice(idFrom(req), identity.userId, body.status, {
      amountPaid: body.amountPaid,
      paymentReference: body.paymentReference,
    });
    return ok({ invoice });
  } catch (e) {
    if (e instanceof InvoiceError) return badRequest(e.message);
    throw e;
  }
});
