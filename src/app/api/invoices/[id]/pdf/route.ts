import { handler, fail, rateLimited } from "@/lib/http";
import { limit } from "@/lib/ratelimit";
import { resolveIdentity } from "@/lib/entitlements";
import { getInvoice } from "@/lib/invoices";
import { renderInvoicePdf } from "@/lib/pdf/invoiceTemplate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const idFrom = (req: Request) => new URL(req.url).pathname.split("/").at(-2) ?? "";

/** The actual downloadable document — same issuer-only scoping as
 *  GET /api/invoices/[id], since a rendered PDF is the same financial
 *  record in a different format, not a lesser-guarded one. */
export const GET = handler(async (req) => {
  const identity = await resolveIdentity(req);
  if (!identity.userId) return fail(401, "unauthorised", "Sign in to download this invoice.");

  const rl = await limit("read", identity.userId);
  if (!rl.ok) return rateLimited(rl.retryAfter);

  const invoice = await getInvoice(idFrom(req));
  if (!invoice) return fail(404, "not_found", "No such invoice.");
  if (invoice.issuerId !== identity.userId) return fail(404, "not_found", "No such invoice.");

  const pdf = await renderInvoicePdf(invoice);
  return new Response(new Uint8Array(pdf), {
    status: 200,
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `inline; filename="${invoice.number}.pdf"`,
      "content-length": String(pdf.length),
    },
  });
});
