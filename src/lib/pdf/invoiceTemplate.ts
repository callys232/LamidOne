import PDFDocument from "pdfkit";
import type { Invoice, InvoiceStatus } from "../invoices";

/**
 * Real PDF rendering — was listed as "on the roadmap" (`content/platform.ts`
 * → `Invoicing`, `verified: false`) because nothing generated the document
 * a client could actually download; the invoice only ever existed as a
 * database record and JSON.
 *
 * Styled to the same brand this site actually uses (the accent red, not
 * a generic PDFKit-tutorial grayscale layout) — right-aligned numeric
 * columns, a coloured status pill, and a totals block that's visually
 * distinct from the line items rather than just more rows in the same
 * table. PDFKit streams pages rather than returning a buffer directly,
 * so this wraps it in a promise that resolves once the stream ends.
 */

const BRAND = "#C12129";
const INK = "#16161A";
const MUTED = "#5C5C66";
const FAINT = "#8A8A94";
const LINE = "#E5E4E2";
const GOOD = "#15803D";
const WARN = "#B45309";

const STATUS_STYLE: Record<InvoiceStatus, { bg: string; fg: string }> = {
  draft: { bg: "#F0F0F1", fg: MUTED },
  sent: { bg: "#FEF3E2", fg: WARN },
  paid: { bg: "#E8F5EC", fg: GOOD },
  void: { bg: "#F0F0F1", fg: FAINT },
};

export function renderInvoicePdf(invoice: Invoice): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const money = (n: number) => `${invoice.currency} ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const right = (text: string, x: number, y: number, width: number) => doc.text(text, x, y, { width, align: "right" });

    /* ── Brand bar + header ── */
    doc.rect(0, 0, doc.page.width, 6).fill(BRAND);
    doc.fillColor(INK);

    doc.fontSize(22).font("Helvetica-Bold").text("INVOICE", 50, 40);
    doc.fontSize(11).font("Helvetica").fillColor(MUTED).text(invoice.number, 50, 68);

    const status = STATUS_STYLE[invoice.status];
    const badgeLabel = invoice.status.toUpperCase();
    doc.font("Helvetica-Bold").fontSize(9);
    const badgeWidth = doc.widthOfString(badgeLabel) + 20;
    doc.roundedRect(545 - badgeWidth, 42, badgeWidth, 20, 10).fill(status.bg);
    doc.fontSize(9).font("Helvetica-Bold").fillColor(status.fg).text(badgeLabel, 545 - badgeWidth, 48, { width: badgeWidth, align: "center" });

    doc.moveTo(50, 100).lineTo(545, 100).strokeColor(LINE).lineWidth(1).stroke();

    /* ── Parties ── */
    const partyTop = 118;
    doc.fontSize(8).font("Helvetica-Bold").fillColor(FAINT).text("FROM", 50, partyTop, { characterSpacing: 0.5 });
    doc.fontSize(12).font("Helvetica-Bold").fillColor(INK).text(invoice.issuer.name, 50, partyTop + 14);
    doc.font("Helvetica").fontSize(9.5).fillColor(MUTED);
    if (invoice.issuer.address) doc.text(invoice.issuer.address, 50, doc.y + 2, { width: 240 });
    if (invoice.issuer.email) doc.text(invoice.issuer.email, 50, doc.y + 2);
    if (invoice.issuer.taxId) doc.text(`Tax ID: ${invoice.issuer.taxId}`, 50, doc.y + 2);

    doc.fontSize(8).font("Helvetica-Bold").fillColor(FAINT).text("BILL TO", 320, partyTop, { characterSpacing: 0.5 });
    doc.fontSize(12).font("Helvetica-Bold").fillColor(INK).text(invoice.client.name, 320, partyTop + 14);
    doc.font("Helvetica").fontSize(9.5).fillColor(MUTED);
    if (invoice.client.address) doc.text(invoice.client.address, 320, doc.y + 2, { width: 225 });
    if (invoice.client.email) doc.text(invoice.client.email, 320, doc.y + 2);
    if (invoice.client.taxId) doc.text(`Tax ID: ${invoice.client.taxId}`, 320, doc.y + 2);

    const datesTop = Math.max(doc.y, partyTop + 70) + 20;
    doc.fontSize(9.5).fillColor(MUTED).font("Helvetica");
    doc.text(`Issue date`, 50, datesTop);
    doc.fontSize(10).fillColor(INK).font("Helvetica-Bold").text(invoice.issueDate, 50, datesTop + 13);
    doc.fontSize(9.5).fillColor(MUTED).font("Helvetica").text(`Due date`, 180, datesTop);
    doc.fontSize(10).fillColor(INK).font("Helvetica-Bold").text(invoice.dueDate, 180, datesTop + 13);

    /* ── Line items ── */
    const cols = { desc: 50, qty: 300, unit: 345, price: 400, total: 465 };
    const colWidths = { qty: 40, unit: 50, price: 60, total: 80 };
    const tableTop = datesTop + 45;

    doc.rect(50, tableTop, 495, 22).fill("#FAFAFA");
    doc.font("Helvetica-Bold").fontSize(8).fillColor(FAINT);
    doc.text("DESCRIPTION", cols.desc + 4, tableTop + 7);
    right("QTY", cols.qty, tableTop + 7, colWidths.qty);
    doc.text("UNIT", cols.unit, tableTop + 7);
    right("RATE", cols.price, tableTop + 7, colWidths.price);
    right("AMOUNT", cols.total, tableTop + 7, colWidths.total);

    let y = tableTop + 22;
    doc.font("Helvetica").fontSize(10).fillColor(INK);
    invoice.lines.forEach((line, i) => {
      const amount = line.quantity * line.unitPrice;
      const rowHeight = 22;
      if (i % 2 === 1) doc.rect(50, y, 495, rowHeight).fill("#FCFCFC").fillColor(INK);
      doc.font("Helvetica").fontSize(10).fillColor(INK);
      doc.text(line.description, cols.desc + 4, y + 6, { width: 240 });
      right(String(line.quantity), cols.qty, y + 6, colWidths.qty);
      doc.text(line.unit, cols.unit, y + 6);
      right(line.unitPrice.toLocaleString(), cols.price, y + 6, colWidths.price);
      right(amount.toLocaleString(), cols.total, y + 6, colWidths.total);
      y += rowHeight;
    });
    doc.moveTo(50, y).lineTo(545, y).strokeColor(LINE).stroke();
    y += 16;

    /* ── Totals — visually distinct block, right-aligned against the
       same AMOUNT column the line items use, so the eye tracks straight
       down rather than re-scanning for a new alignment. ── */
    const totalsLabelX = 350;
    const totalsRow = (label: string, value: string, opts: { bold?: boolean; accent?: boolean } = {}) => {
      doc.font(opts.bold ? "Helvetica-Bold" : "Helvetica").fontSize(opts.bold ? 11 : 10);
      doc.fillColor(opts.accent ? BRAND : opts.bold ? INK : MUTED);
      doc.text(label, totalsLabelX, y, { width: 115 });
      right(value, cols.total, y, colWidths.total);
      y += opts.bold ? 22 : 18;
    };
    totalsRow("Subtotal", money(invoice.totals.subtotal));
    if (invoice.totals.discount > 0) totalsRow("Discount", `-${money(invoice.totals.discount)}`);
    if (invoice.totals.tax > 0) totalsRow("Tax", money(invoice.totals.tax));

    doc.moveTo(totalsLabelX, y).lineTo(545, y).strokeColor(LINE).stroke();
    y += 8;
    totalsRow("Total", money(invoice.totals.total), { bold: true, accent: true });

    if (invoice.totals.paid > 0) {
      totalsRow("Paid", money(invoice.totals.paid));
      totalsRow("Balance due", money(invoice.totals.balance), { bold: true });
    }

    /* ── Notes / terms ── */
    if (invoice.notes || invoice.terms) {
      y += 12;
      if (invoice.notes) {
        doc.font("Helvetica-Bold").fontSize(8).fillColor(FAINT).text("NOTES", 50, y, { characterSpacing: 0.5 });
        doc.font("Helvetica").fontSize(10).fillColor(MUTED).text(invoice.notes, 50, doc.y + 3, { width: 495 });
        y = doc.y + 12;
      }
      if (invoice.terms) {
        doc.font("Helvetica-Bold").fontSize(8).fillColor(FAINT).text("TERMS", 50, y, { characterSpacing: 0.5 });
        doc.font("Helvetica").fontSize(10).fillColor(MUTED).text(invoice.terms, 50, doc.y + 3, { width: 495 });
        y = doc.y;
      }
    }

    /* ── Provenance footer — the reason this invoicing system exists at
       all rather than being a generic template: the amount on the page
       traces back to specific approved milestones, not a re-keyed figure. */
    if (invoice.milestoneIds?.length) {
      const footerY = Math.max(y + 20, doc.page.height - 70);
      doc.moveTo(50, footerY - 10).lineTo(545, footerY - 10).strokeColor(LINE).stroke();
      doc.fontSize(8).font("Helvetica").fillColor(FAINT).text(
        `Raised from ${invoice.milestoneIds.length} approved milestone${invoice.milestoneIds.length === 1 ? "" : "s"} on LAMID ONE — figures traceable to the escrow record, not re-entered.`,
        50, footerY, { width: 495 },
      );
    }

    doc.end();
  });
}
