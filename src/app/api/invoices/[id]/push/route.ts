import { handler, ok, fail, badRequest } from "@/lib/http";
import { resolveIdentity } from "@/lib/entitlements";
import { getInvoice } from "@/lib/invoices";
import { pushInvoice, getConnection, AccountingError, type AccountingProvider } from "@/lib/accounting";
import { requirePersistenceInProd } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Pushes one invoice to a connected ledger.
 *
 * UNVERIFIED end to end — see lib/accounting.ts. The failure path is
 * therefore deliberately verbose: a caller needs the provider's own
 * error text to diagnose the first real attempt, not a sanitised
 * "something went wrong".
 */
export const POST = handler(async (req) => {
  requirePersistenceInProd();

  const identity = await resolveIdentity(req);
  if (!identity.userId) return fail(401, "unauthorised", "Sign in to push an invoice.");

  const provider = new URL(req.url).searchParams.get("provider") as AccountingProvider | null;
  if (provider !== "xero" && provider !== "quickbooks") {
    return badRequest("`provider` must be `xero` or `quickbooks`.");
  }

  const invoiceId = new URL(req.url).pathname.split("/").at(-2) ?? "";
  const invoice = await getInvoice(invoiceId);
  if (!invoice || invoice.issuerId !== identity.userId) {
    return fail(404, "not_found", "No such invoice.");
  }

  const conn = await getConnection(identity.userId, provider);
  if (!conn) return fail(409, "not_connected", `Connect ${provider} first.`);

  try {
    const result = await pushInvoice(identity.userId, provider, invoice);
    return ok({ pushed: true, provider, externalId: result.externalId ?? null });
  } catch (e) {
    if (e instanceof AccountingError) return fail(502, "push_failed", e.message);
    throw e;
  }
});
