/** Invoice arithmetic + state machine. Run: npx tsx src/lib/budget/verifyInvoices.ts */
import { computeTotals, createInvoice, transitionInvoice, InvoiceError } from "../invoices";
import type { InvoiceLine } from "../invoices";

let pass = 0, fail = 0;
const near = (a: number, b: number, t = 0.01) => Math.abs(a - b) <= t;
const check = (n: string, c: boolean, d = "") => { c ? (pass++, console.log(`  PASS  ${n}`)) : (fail++, console.log(`  FAIL  ${n} ${d}`)); };
const L = (o: Partial<InvoiceLine> = {}): InvoiceLine => ({
  id: "l", description: "d", quantity: 1, unit: "u", unitPrice: 100, taxPct: 0, ...o,
});

console.log("\n── totals ──");
{
  const t = computeTotals([L({ quantity: 10, unitPrice: 100, taxPct: 20 })], 0, 0);
  check("subtotal 1000", near(t.subtotal, 1000));
  check("tax 20% = 200", near(t.tax, 200));
  check("total 1200", near(t.total, 1200));
  check("balance = total when unpaid", near(t.balance, 1200));
}
{
  // Discount must reduce the TAXABLE base, not be taken after tax.
  const t = computeTotals([L({ quantity: 10, unitPrice: 100, taxPct: 20 })], 100, 0);
  check("discount reduces taxable to 900", near(t.taxable, 900));
  check("tax charged on 900 not 1000 = 180", near(t.tax, 180), `got ${t.tax}`);
  check("total 1080", near(t.total, 1080));
  check("naive after-tax discount (1100) NOT produced", !near(t.total, 1100));
}
{
  // Mixed rating is why tax is per-line, not per-invoice.
  const t = computeTotals([L({ unitPrice: 1000, taxPct: 20 }), L({ unitPrice: 1000, taxPct: 0 })], 0, 0);
  check("mixed rating taxes only the rated line", near(t.tax, 200), `got ${t.tax}`);
  check("mixed total 2200", near(t.total, 2200));
}
{
  const t = computeTotals([L({ unitPrice: 500 })], 0, 200);
  check("partial payment leaves balance 300", near(t.balance, 300));
  const over = computeTotals([L({ unitPrice: 500 })], 0, 9999);
  check("overpayment clamps, never negative balance", over.balance === 0 && over.paid === 500);
  const big = computeTotals([L({ unitPrice: 100 })], 9999, 0);
  check("discount clamps at subtotal", big.discount === 100 && big.total === 0);
}
{
  const t = computeTotals([], 0, 0);
  check("empty lines total zero, no NaN", t.total === 0 && !Number.isNaN(t.tax));
}

console.log("\n── creation ──");
(async () => {
  const inv = await createInvoice("u1", null, {
    client: { name: "Meridian Trust" }, currency: "usd",
    lines: [{ description: "Advisory", quantity: 5, unitPrice: 1000, taxPct: 10 }],
  });
  check("number is sequential and formatted", /^INV-\d{4}-0{3}\d$/.test(inv.number), inv.number);
  check("starts as draft", inv.status === "draft");
  check("currency upper-cased", inv.currency === "USD");
  check("totals computed on create", near(inv.totals.total, 5500));
  check("due date defaults 30 days out", new Date(inv.dueDate) > new Date(inv.issueDate));

  const inv2 = await createInvoice("u1", null, {
    client: { name: "X" }, lines: [{ description: "a", unitPrice: 1 }],
  });
  check("numbers increment per issuer", inv2.number !== inv.number, `${inv.number} vs ${inv2.number}`);

  const other = await createInvoice("u2", null, {
    client: { name: "Y" }, lines: [{ description: "a", unitPrice: 1 }],
  });
  check("separate issuers get separate sequences", other.number.endsWith("0001"), other.number);

  let threw = false;
  try { await createInvoice("u1", null, { client: { name: "N" }, lines: [] }); } catch (e) { threw = e instanceof InvoiceError; }
  check("rejects an invoice with no lines", threw);

  threw = false;
  try { await createInvoice("u1", null, { client: {}, lines: [{ description: "a", unitPrice: 1 }] }); } catch (e) { threw = e instanceof InvoiceError; }
  check("rejects a nameless client", threw);

  console.log("\n── state machine ──");
  const s = await createInvoice("u1", null, { client: { name: "C" }, lines: [{ description: "a", quantity: 1, unitPrice: 1000 }] });
  const sent = await transitionInvoice(s.id, "u1", "sent");
  check("draft -> sent", sent.status === "sent" && Boolean(sent.sentAt));

  const paid = await transitionInvoice(s.id, "u1", "paid", { paymentReference: "ps_123" });
  check("sent -> paid", paid.status === "paid");
  check("paid defaults to full total", near(paid.paid, 1000));
  check("balance clears", near(paid.totals.balance, 0));
  check("payment reference recorded", paid.paymentReference === "ps_123");

  threw = false;
  try { await transitionInvoice(s.id, "u1", "void"); } catch (e) { threw = e instanceof InvoiceError; }
  check("paid is TERMINAL — cannot be voided", threw);

  const d2 = await createInvoice("u1", null, { client: { name: "C" }, lines: [{ description: "a", unitPrice: 10 }] });
  threw = false;
  try { await transitionInvoice(d2.id, "u1", "paid"); } catch (e) { threw = e instanceof InvoiceError; }
  check("draft cannot skip straight to paid", threw);

  threw = false;
  try { await transitionInvoice(d2.id, "someone-else", "sent"); } catch (e) { threw = e instanceof InvoiceError; }
  check("only the issuer can transition", threw);

  const v = await transitionInvoice(d2.id, "u1", "void");
  check("draft -> void", v.status === "void" && Boolean(v.voidedAt));

  console.log(`\n${"=".repeat(46)}\n  ${pass} passed, ${fail} failed\n${"=".repeat(46)}\n`);
  if (fail > 0) process.exit(1);
})();
