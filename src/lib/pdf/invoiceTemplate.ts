import PDFDocument from "pdfkit";
import type { Invoice } from "../invoices";

/**
 * Real PDF rendering — was listed as "on the roadmap" (`content/platform.ts`
 * → `Invoicing`, `verified: false`) because nothing generated the document
 * a client could actually download; the invoice only ever existed as a
 * database record and JSON.
 *
 * PDFKit streams pages rather than returning a buffer directly, so this
 * wraps it in a promise that resolves once the stream ends.
 */
export function renderInvoicePdf(invoice: Invoice): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const money = (n: number) => `${invoice.currency} ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    /* ── Header ── */
    doc.fontSize(20).font("Helvetica-Bold").text("INVOICE", { continued: true });
    doc.font("Helvetica").fontSize(11).text(`   ${invoice.number}`, { align: "left" });
    doc.moveDown(0.3);
    doc.fontSize(10).fillColor("#555").text(`Status: ${invoice.status.toUpperCase()}`);
    doc.fillColor("#000");
    doc.moveDown(1);

    /* ── Parties ── */
    const partyTop = doc.y;
    doc.fontSize(9).fillColor("#777").text("FROM", 50, partyTop);
    doc.fontSize(11).fillColor("#000").font("Helvetica-Bold").text(invoice.issuer.name, 50, partyTop + 14);
    doc.font("Helvetica").fontSize(10);
    if (invoice.issuer.address) doc.text(invoice.issuer.address, 50);
    if (invoice.issuer.email) doc.text(invoice.issuer.email, 50);
    if (invoice.issuer.taxId) doc.text(`Tax ID: ${invoice.issuer.taxId}`, 50);

    doc.fontSize(9).fillColor("#777").text("BILL TO", 320, partyTop);
    doc.fontSize(11).fillColor("#000").font("Helvetica-Bold").text(invoice.client.name, 320, partyTop + 14);
    doc.font("Helvetica").fontSize(10);
    if (invoice.client.address) doc.text(invoice.client.address, 320);
    if (invoice.client.email) doc.text(invoice.client.email, 320);
    if (invoice.client.taxId) doc.text(`Tax ID: ${invoice.client.taxId}`, 320);

    doc.moveDown(2);
    doc.fontSize(10).fillColor("#000");
    doc.text(`Issue date: ${invoice.issueDate}`, 50, doc.y, { continued: true });
    doc.text(`     Due date: ${invoice.dueDate}`);
    doc.moveDown(1);

    /* ── Line items ── */
    const tableTop = doc.y;
    const cols = { desc: 50, qty: 300, unit: 350, price: 410, total: 480 };
    doc.font("Helvetica-Bold").fontSize(9).fillColor("#777");
    doc.text("DESCRIPTION", cols.desc, tableTop);
    doc.text("QTY", cols.qty, tableTop);
    doc.text("UNIT", cols.unit, tableTop);
    doc.text("RATE", cols.price, tableTop);
    doc.text("AMOUNT", cols.total, tableTop);
    doc.moveTo(50, tableTop + 14).lineTo(545, tableTop + 14).strokeColor("#ddd").stroke();

    let y = tableTop + 20;
    doc.font("Helvetica").fontSize(10).fillColor("#000");
    for (const line of invoice.lines) {
      const amount = line.quantity * line.unitPrice;
      doc.text(line.description, cols.desc, y, { width: 240 });
      doc.text(String(line.quantity), cols.qty, y);
      doc.text(line.unit, cols.unit, y);
      doc.text(line.unitPrice.toLocaleString(), cols.price, y);
      doc.text(amount.toLocaleString(), cols.total, y);
      y += 20;
    }
    doc.moveTo(50, y + 4).lineTo(545, y + 4).strokeColor("#ddd").stroke();
    y += 16;

    /* ── Totals ── */
    const totalsRow = (label: string, value: string, bold = false) => {
      doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(10);
      doc.text(label, 380, y, { width: 100 });
      doc.text(value, cols.total, y);
      y += 16;
    };
    totalsRow("Subtotal", money(invoice.totals.subtotal));
    if (invoice.totals.discount > 0) totalsRow("Discount", `-${money(invoice.totals.discount)}`);
    if (invoice.totals.tax > 0) totalsRow("Tax", money(invoice.totals.tax));
    totalsRow("Total", money(invoice.totals.total), true);
    if (invoice.totals.paid > 0) {
      totalsRow("Paid", money(invoice.totals.paid));
      totalsRow("Balance due", money(invoice.totals.balance), true);
    }

    /* ── Notes / terms ── */
    if (invoice.notes || invoice.terms) {
      doc.moveDown(2);
      if (invoice.notes) {
        doc.font("Helvetica-Bold").fontSize(9).fillColor("#777").text("NOTES", 50);
        doc.font("Helvetica").fontSize(10).fillColor("#000").text(invoice.notes, 50, doc.y, { width: 495 });
        doc.moveDown(0.5);
      }
      if (invoice.terms) {
        doc.font("Helvetica-Bold").fontSize(9).fillColor("#777").text("TERMS", 50);
        doc.font("Helvetica").fontSize(10).fillColor("#000").text(invoice.terms, 50, doc.y, { width: 495 });
      }
    }

    /* ── Provenance footer — the reason this invoicing system exists at
       all rather than being a generic template: the amount on the page
       traces back to specific approved milestones, not a re-keyed figure. */
    if (invoice.milestoneIds?.length) {
      doc.moveDown(1.5);
      doc.fontSize(8).fillColor("#999").text(
        `Raised from ${invoice.milestoneIds.length} approved milestone${invoice.milestoneIds.length === 1 ? "" : "s"} on LAMID ONE — figures traceable to the escrow record, not re-entered.`,
        50, doc.y, { width: 495 },
      );
    }

    doc.end();
  });
}
