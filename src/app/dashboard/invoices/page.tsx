"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Printer, Download, Send, CheckCircle2, Ban } from "lucide-react";
import { authHeaders } from "@/lib/useApi";
import type { Invoice, InvoiceLine, InvoiceStatus } from "@/lib/invoices";

/**
 * INVOICES.
 *
 * Completes the DESK record: proposal (Scribe) → milestones and escrow
 * (Cadence) → invoice. Figures are computed server-side by
 * lib/invoices.ts so the browser never becomes a second source of truth
 * for money. Two ways to get a PDF, deliberately both kept:
 *  · Print / PDF — plain CSS, the browser's own print-to-PDF. Free,
 *    no dependency, and the better file for "I'm looking at this now."
 *  · Download — a real file from lib/pdf/invoiceTemplate.ts (PDFKit),
 *    generated server-side with no browser involved. This is what
 *    emailing or attaching an invoice needs, which print-to-PDF cannot
 *    do — it requires an open window and a person clicking through it.
 */

const STATUS_TONE: Record<InvoiceStatus, string> = {
  draft: "var(--ink-faint)", sent: "var(--warn)", paid: "var(--good)", void: "var(--bad)",
};

const blankLine = (): InvoiceLine => ({
  id: `il_${Math.random().toString(36).slice(2, 9)}`,
  description: "", quantity: 1, unit: "units", unitPrice: 0, taxPct: 0,
});

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selected, setSelected] = useState<Invoice | null>(null);
  const [creating, setCreating] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/invoices", { headers: authHeaders() });
      const b = await res.json();
      if (res.ok) setInvoices(b.invoices ?? []);
      else setError(b?.error ?? "Could not load invoices.");
    } catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function transition(inv: Invoice, status: InvoiceStatus) {
    setError(null);
    const res = await fetch(`/api/invoices/${inv.id}`, {
      method: "PATCH", headers: authHeaders(), body: JSON.stringify({ status }),
    });
    const b = await res.json();
    if (!res.ok) { setError(b?.error ?? "Could not update."); return; }
    setSelected(b.invoice);
    load();
  }

  /** Auto-pulls every approved, not-yet-invoiced milestone across every
   *  project the caller is the awarded expert on, and raises one
   *  invoice per project that has any. See lib/invoices.ts's
   *  `generateOutstandingInvoices` for the actual logic — this just
   *  calls it and refetches, same shape as `transition` above. */
  async function generateAll() {
    setGenerating(true); setError(null);
    try {
      const res = await fetch("/api/invoices/generate", {
        method: "POST", headers: authHeaders(), body: JSON.stringify({}),
      });
      const b = await res.json();
      if (!res.ok) throw new Error(b?.error ?? "Could not generate invoices.");
      const { invoices: created, skipped } = b as {
        invoices: Invoice[]; skipped: { projectId: string; reason: string }[];
      };
      if (created.length === 0) {
        setError(skipped.length > 0 ? "No outstanding milestones were ready to invoice." : "Nothing to invoice yet.");
      }
      await load();
    } catch (e) { setError((e as Error).message); }
    finally { setGenerating(false); }
  }

  if (selected) {
    return <InvoiceDetail invoice={selected} onBack={() => setSelected(null)}
                          onTransition={(s) => transition(selected, s)} error={error} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl">Invoices</h1>
          <p className="muted mt-1 text-sm">
            Raise, send and track invoices. Raising from approved milestones carries the milestone
            references through, so the amount invoiced stays traceable to work that was signed off.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={generateAll}
            disabled={generating}
            className="btn btn-ghost"
          >
            {generating ? "Generating…" : "Generate all outstanding invoices"}
          </button>
          <button type="button" onClick={() => setCreating(true)} className="btn btn-primary shrink-0">
            <Plus className="h-4 w-4" aria-hidden="true" /> New invoice
          </button>
        </div>
      </div>

      {error && <p className="text-sm" style={{ color: "var(--bad)" }}>{error}</p>}
      {creating && <CreateInvoice onDone={(inv) => { setCreating(false); if (inv) { load(); setSelected(inv); } }} />}

      {loading && <div className="card h-40 animate-pulse" style={{ background: "var(--line-soft)" }} />}

      {!loading && invoices.length === 0 && !creating && (
        <div className="card p-8 text-center">
          <p className="font-display text-lg">No invoices yet.</p>
          <p className="muted mx-auto mt-2 max-w-md text-sm">
            Raise one directly, or generate one from a project&apos;s approved milestones so the
            invoice and the milestone record cannot drift apart.
          </p>
        </div>
      )}

      {invoices.length > 0 && (
        <div className="card overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: "var(--line-soft)" }}>
                <th className="px-4 py-3 font-medium">Number</th>
                <th className="px-4 py-3 font-medium">Client</th>
                <th className="px-4 py-3 font-medium">Due</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Total</th>
                <th className="px-4 py-3 text-right font-medium">Balance</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((i) => (
                <tr key={i.id} onClick={() => setSelected(i)}
                    className="cursor-pointer border-b transition-colors hover:bg-[color:var(--brand-soft)]"
                    style={{ borderColor: "var(--line-soft)" }}>
                  <td className="px-4 py-2.5 font-medium">{i.number}</td>
                  <td className="px-4 py-2.5">{i.client.name}</td>
                  <td className="px-4 py-2.5 tabular-nums">{i.dueDate}</td>
                  <td className="px-4 py-2.5">
                    <span className="text-xs font-semibold uppercase" style={{ color: STATUS_TONE[i.status] }}>
                      {i.status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{i.currency} {i.totals.total.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{i.currency} {i.totals.balance.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function CreateInvoice({ onDone }: { onDone: (inv: Invoice | null) => void }) {
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [termDays, setTermDays] = useState(30);
  const [discount, setDiscount] = useState(0);
  const [lines, setLines] = useState<InvoiceLine[]>([blankLine()]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* Client-side preview only — the server recomputes on submit and its
     figures are the ones stored. Mirrors computeTotals() exactly,
     including discount reducing the taxable base before tax. */
  const preview = useMemo(() => {
    const sub = lines.reduce((s, l) => s + (Number(l.quantity) || 0) * (Number(l.unitPrice) || 0), 0);
    const disc = Math.min(Number(discount) || 0, sub);
    const ratio = sub > 0 ? (sub - disc) / sub : 0;
    const tax = lines.reduce(
      (s, l) => s + (Number(l.quantity) || 0) * (Number(l.unitPrice) || 0) * ratio * ((Number(l.taxPct) || 0) / 100), 0);
    return { tax, total: sub - disc + tax };
  }, [lines, discount]);

  async function submit() {
    setBusy(true); setError(null);
    try {
      const res = await fetch("/api/invoices", {
        method: "POST", headers: authHeaders(),
        body: JSON.stringify({
          client: { name: clientName, email: clientEmail || undefined },
          currency, paymentTermDays: termDays, discount, lines,
        }),
      });
      const b = await res.json();
      if (!res.ok) throw new Error(b?.error ?? "Could not raise the invoice.");
      onDone(b.invoice);
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }

  const upd = (id: string, p: Partial<InvoiceLine>) =>
    setLines((ls) => ls.map((l) => (l.id === id ? { ...l, ...p } : l)));

  return (
    <div className="card p-6">
      <h2 className="font-display text-lg">New invoice</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="block text-sm">
          <span className="muted mb-1.5 block text-xs font-medium">Client name</span>
          <input value={clientName} onChange={(e) => setClientName(e.target.value)}
                 aria-label="Client name" className="input" />
        </label>
        <label className="block text-sm">
          <span className="muted mb-1.5 block text-xs font-medium">Client email</span>
          <input type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)}
                 aria-label="Client email" className="input" />
        </label>
        <label className="block text-sm">
          <span className="muted mb-1.5 block text-xs font-medium">Currency</span>
          <input value={currency} maxLength={3} onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                 aria-label="Currency" className="input" />
        </label>
        <label className="block text-sm">
          <span className="muted mb-1.5 block text-xs font-medium">Payment terms (days)</span>
          <input type="number" min={0} value={termDays} onChange={(e) => setTermDays(Number(e.target.value))}
                 aria-label="Payment terms in days" className="input" />
        </label>
      </div>

      <div className="mt-5 space-y-2">
        {lines.map((l) => (
          <div key={l.id} className="grid gap-2 lg:grid-cols-12">
            <input value={l.description} onChange={(e) => upd(l.id, { description: e.target.value })}
                   placeholder="Description" aria-label="Line description" className="input lg:col-span-5" />
            <input type="number" value={l.quantity} onChange={(e) => upd(l.id, { quantity: Number(e.target.value) })}
                   placeholder="Qty" aria-label="Quantity" className="input lg:col-span-1" />
            <input value={l.unit} onChange={(e) => upd(l.id, { unit: e.target.value })}
                   placeholder="Unit" aria-label="Unit" className="input lg:col-span-2" />
            <input type="number" value={l.unitPrice} onChange={(e) => upd(l.id, { unitPrice: Number(e.target.value) })}
                   placeholder="Price" aria-label="Unit price" className="input lg:col-span-2" />
            <input type="number" value={l.taxPct} onChange={(e) => upd(l.id, { taxPct: Number(e.target.value) })}
                   placeholder="Tax %" aria-label="Tax percentage" className="input lg:col-span-1" />
            <button type="button" onClick={() => setLines((ls) => ls.filter((x) => x.id !== l.id))}
                    aria-label="Remove line" className="faint hover:text-brand lg:col-span-1">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-4">
        <button type="button" onClick={() => setLines((ls) => [...ls, blankLine()])}
                className="btn btn-ghost !px-3 !py-1.5 text-xs">
          <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Add line
        </button>
        <label className="flex items-center gap-2 text-xs">
          <span className="muted">Discount</span>
          <input type="number" min={0} value={discount} onChange={(e) => setDiscount(Number(e.target.value))}
                 aria-label="Discount amount" className="input w-28 !py-1" />
        </label>
        <span className="faint ml-auto text-sm tabular-nums">
          {currency} {preview.total.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          <span className="faint"> (tax {preview.tax.toLocaleString(undefined, { maximumFractionDigits: 2 })})</span>
        </span>
      </div>

      {error && <p className="mt-3 text-sm" style={{ color: "var(--bad)" }}>{error}</p>}

      <div className="mt-5 flex gap-3">
        <button type="button" onClick={submit} disabled={busy || !clientName.trim()}
                className="btn btn-primary disabled:opacity-50">
          {busy ? "Raising…" : "Raise invoice"}
        </button>
        <button type="button" onClick={() => onDone(null)} className="btn btn-ghost">Cancel</button>
      </div>
    </div>
  );
}

function InvoiceDetail({
  invoice, onBack, onTransition, error,
}: {
  invoice: Invoice; onBack: () => void;
  onTransition: (s: InvoiceStatus) => void; error: string | null;
}) {
  const m = (n: number) =>
    `${invoice.currency} ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3 print:hidden">
        <button type="button" onClick={onBack} className="btn btn-ghost !px-3 !py-1.5 text-xs">← All invoices</button>
        <span className="text-xs font-semibold uppercase" style={{ color: STATUS_TONE[invoice.status] }}>
          {invoice.status}
        </span>
        <div className="ml-auto flex flex-wrap gap-2">
          <button type="button" onClick={() => window.print()} className="btn btn-ghost !px-3 !py-1.5 text-xs">
            <Printer className="h-3.5 w-3.5" aria-hidden="true" /> Print / PDF
          </button>
          <a href={`/api/invoices/${invoice.id}/pdf`} target="_blank" rel="noopener noreferrer"
             className="btn btn-ghost !px-3 !py-1.5 text-xs">
            <Download className="h-3.5 w-3.5" aria-hidden="true" /> Download PDF
          </a>
          {invoice.status === "draft" && (
            <button type="button" onClick={() => onTransition("sent")} className="btn btn-primary !px-3 !py-1.5 text-xs">
              <Send className="h-3.5 w-3.5" aria-hidden="true" /> Mark sent
            </button>
          )}
          {invoice.status === "sent" && (
            <button type="button" onClick={() => onTransition("paid")} className="btn btn-primary !px-3 !py-1.5 text-xs">
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> Mark paid
            </button>
          )}
          {(invoice.status === "draft" || invoice.status === "sent") && (
            <button type="button" onClick={() => onTransition("void")} className="btn btn-ghost !px-3 !py-1.5 text-xs">
              <Ban className="h-3.5 w-3.5" aria-hidden="true" /> Void
            </button>
          )}
        </div>
      </div>

      {error && <p className="text-sm print:hidden" style={{ color: "var(--bad)" }}>{error}</p>}

      <div className="card p-8">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <h1 className="font-display text-3xl">Invoice</h1>
            <p className="muted mt-1 text-sm tabular-nums">{invoice.number}</p>
          </div>
          <dl className="text-right text-sm">
            <div className="flex justify-end gap-4"><dt className="faint">Issued</dt><dd className="tabular-nums">{invoice.issueDate}</dd></div>
            <div className="flex justify-end gap-4"><dt className="faint">Due</dt><dd className="tabular-nums">{invoice.dueDate}</dd></div>
          </dl>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <div>
            <p className="faint text-xs font-semibold uppercase tracking-wide">From</p>
            <p className="mt-1 font-medium">{invoice.issuer.name || "—"}</p>
            {invoice.issuer.email && <p className="muted text-sm">{invoice.issuer.email}</p>}
            {invoice.issuer.address && <p className="muted whitespace-pre-line text-sm">{invoice.issuer.address}</p>}
          </div>
          <div>
            <p className="faint text-xs font-semibold uppercase tracking-wide">Bill to</p>
            <p className="mt-1 font-medium">{invoice.client.name}</p>
            {invoice.client.email && <p className="muted text-sm">{invoice.client.email}</p>}
            {invoice.client.address && <p className="muted whitespace-pre-line text-sm">{invoice.client.address}</p>}
          </div>
        </div>

        <table className="mt-8 w-full text-left text-sm">
          <thead>
            <tr className="border-b" style={{ borderColor: "var(--line)" }}>
              <th className="py-2 font-medium">Description</th>
              <th className="py-2 text-right font-medium">Qty</th>
              <th className="py-2 text-right font-medium">Unit price</th>
              <th className="py-2 text-right font-medium">Tax</th>
              <th className="py-2 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.lines.map((l) => (
              <tr key={l.id} className="border-b" style={{ borderColor: "var(--line-soft)" }}>
                <td className="py-2.5">
                  {l.description}
                  {l.milestoneId && <span className="faint ml-2 text-[10px] uppercase">from milestone</span>}
                </td>
                <td className="py-2.5 text-right tabular-nums">{l.quantity} {l.unit}</td>
                <td className="py-2.5 text-right tabular-nums">{m(l.unitPrice)}</td>
                <td className="py-2.5 text-right tabular-nums">{l.taxPct}%</td>
                <td className="py-2.5 text-right tabular-nums">{m(l.quantity * l.unitPrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-6 flex justify-end">
          <dl className="w-full max-w-xs space-y-1.5 text-sm">
            <Row label="Subtotal" value={m(invoice.totals.subtotal)} />
            {invoice.totals.discount > 0 && <Row label="Discount" value={`− ${m(invoice.totals.discount)}`} />}
            <Row label="Tax" value={m(invoice.totals.tax)} />
            <div className="flex justify-between border-t pt-2 text-base font-semibold" style={{ borderColor: "var(--line)" }}>
              <dt>Total</dt><dd className="tabular-nums">{m(invoice.totals.total)}</dd>
            </div>
            {invoice.totals.paid > 0 && <Row label="Paid" value={`− ${m(invoice.totals.paid)}`} />}
            {invoice.totals.balance !== invoice.totals.total && (
              <div className="flex justify-between font-semibold">
                <dt>Balance due</dt><dd className="tabular-nums">{m(invoice.totals.balance)}</dd>
              </div>
            )}
          </dl>
        </div>

        {invoice.notes && (
          <div className="mt-8 border-t pt-4" style={{ borderColor: "var(--line-soft)" }}>
            <p className="faint text-xs font-semibold uppercase tracking-wide">Notes</p>
            <p className="muted mt-1 whitespace-pre-line text-sm">{invoice.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="muted">{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}
