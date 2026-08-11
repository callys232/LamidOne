import { collection, persistenceEnabled, ensureIndexes } from "./store";

/**
 * INVOICING.
 *
 * The third leg of the DESK promise — "a proposal, a contract and an
 * invoice as one record". Proposal (Scribe) and milestones/escrow
 * (Cadence) existed; this did not, so the suite page was advertising a
 * capability with nothing behind it.
 *
 * The point of building it HERE rather than bolting on an accounting
 * package is provenance: an invoice raised from approved milestones
 * carries the milestone ids it was raised against, so the line between
 * "work approved" and "money invoiced" is auditable in one system
 * instead of reconciled across three.
 *
 * Money handling follows the same rules as the budget engine — integer
 * minor units are NOT used (the rest of this codebase works in major
 * units with 2dp rounding), so every arithmetic step rounds explicitly
 * rather than letting float drift accumulate across lines.
 */

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
const safe = (n: unknown): number => {
  const v = typeof n === "number" ? n : Number(n);
  return Number.isFinite(v) && v >= 0 ? v : 0;
};

export type InvoiceStatus = "draft" | "sent" | "paid" | "void";

export interface InvoiceLine {
  id:          string;
  description: string;
  quantity:    number;
  unit:        string;
  unitPrice:   number;
  /** Per-line, because a single invoice routinely mixes rated and
   *  zero-rated items and a single invoice-level rate cannot express that. */
  taxPct:      number;
  /** Milestone this line was raised against, when raised from escrow. */
  milestoneId?: string;
}

export interface InvoiceParty {
  name:     string;
  email?:   string;
  address?: string;
  taxId?:   string;
}

export interface InvoiceTotals {
  subtotal:   number;
  discount:   number;
  taxable:    number;
  tax:        number;
  total:      number;
  /** Recorded against this invoice so far. */
  paid:       number;
  balance:    number;
}

export interface Invoice {
  id:        string;
  /** Human-facing sequential reference, unique per issuer. */
  number:    string;
  issuerId:  string;
  orgId:     string | null;
  issuer:    InvoiceParty;
  client:    InvoiceParty;
  currency:  string;
  issueDate: string;   // ISO date
  dueDate:   string;   // ISO date
  lines:     InvoiceLine[];
  /** Flat discount in currency units, applied before tax. */
  discount:  number;
  notes?:    string;
  terms?:    string;
  status:    InvoiceStatus;
  /** Provenance — what this invoice was raised from. */
  projectId?:    string;
  milestoneIds?: string[];
  totals:    InvoiceTotals;
  paid:      number;
  paymentReference?: string;
  createdAt: number;
  sentAt?:   number;
  paidAt?:   number;
  voidedAt?: number;
}

export class InvoiceError extends Error {
  constructor(msg: string) { super(msg); this.name = "InvoiceError"; }
}

const invoices = new Map<string, Invoice>();
const counters = new Map<string, number>();
const id = () => `inv_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

/** Pure — the single source of truth for every figure an invoice shows. */
export function computeTotals(lines: InvoiceLine[], discount: number, paid: number): InvoiceTotals {
  const subtotal = round2(lines.reduce((s, l) => s + safe(l.quantity) * safe(l.unitPrice), 0));
  const disc = Math.min(round2(safe(discount)), subtotal);

  /* The discount reduces the taxable base proportionally across lines,
     rather than being taken off the total after tax. Taking it off
     afterwards would overstate the tax due on money never charged. */
  const ratio = subtotal > 0 ? (subtotal - disc) / subtotal : 0;
  const tax = round2(
    lines.reduce((s, l) => s + safe(l.quantity) * safe(l.unitPrice) * ratio * (safe(l.taxPct) / 100), 0),
  );

  const taxable = round2(subtotal - disc);
  const total = round2(taxable + tax);
  const paidAmt = Math.min(round2(safe(paid)), total);

  return { subtotal, discount: disc, taxable, tax, total, paid: paidAmt, balance: round2(total - paidAmt) };
}

/**
 * Next sequential number for an issuer.
 *
 * Atomic where Mongo is configured: a `$inc` inside `findOneAndUpdate`
 * cannot hand the same number to two concurrent requests, which a
 * read-then-write would. Invoice numbers must be unique and gapless
 * enough to satisfy an auditor, so this is one of the few places a race
 * is genuinely unacceptable rather than merely untidy.
 */
async function nextNumber(issuerId: string, prefix = "INV"): Promise<string> {
  const year = new Date().getFullYear();
  const key = `${issuerId}:${year}`;

  if (persistenceEnabled()) {
    await ensureIndexes();
    const col = await collection<{ key: string; seq: number }>("invoiceCounters");
    if (col) {
      const doc = await col.findOneAndUpdate(
        { key },
        { $inc: { seq: 1 }, $setOnInsert: { key } },
        { upsert: true, returnDocument: "after" },
      );
      const seq = doc?.seq ?? 1;
      return `${prefix}-${year}-${String(seq).padStart(4, "0")}`;
    }
  }

  const seq = (counters.get(key) ?? 0) + 1;
  counters.set(key, seq);
  return `${prefix}-${year}-${String(seq).padStart(4, "0")}`;
}

function validateLines(raw: unknown): InvoiceLine[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new InvoiceError("An invoice needs at least one line.");
  }
  return raw.slice(0, 200).map((l, i) => {
    const r = l as Partial<InvoiceLine>;
    const description = String(r.description ?? "").trim().slice(0, 300);
    if (!description) throw new InvoiceError(`Line ${i + 1} needs a description.`);
    return {
      id: String(r.id ?? `il_${i}_${Math.random().toString(36).slice(2, 7)}`),
      description,
      quantity:  safe(r.quantity) || 1,
      unit:      String(r.unit ?? "units").slice(0, 30),
      unitPrice: safe(r.unitPrice),
      taxPct:    Math.min(100, safe(r.taxPct)),
      ...(r.milestoneId ? { milestoneId: String(r.milestoneId) } : {}),
    };
  });
}

const DAY = 24 * 60 * 60 * 1000;
const isoDate = (d: Date) => d.toISOString().slice(0, 10);

export async function createInvoice(
  issuerId: string,
  orgId: string | null,
  input: Record<string, unknown>,
): Promise<Invoice> {
  const lines = validateLines(input.lines);

  const client = (input.client ?? {}) as InvoiceParty;
  if (!String(client.name ?? "").trim()) throw new InvoiceError("The client needs a name.");

  const issueDate = String(input.issueDate ?? isoDate(new Date())).slice(0, 10);
  const paymentTermDays = Math.max(0, Math.floor(safe(input.paymentTermDays) || 30));
  const dueDate = String(
    input.dueDate ?? isoDate(new Date(new Date(issueDate).getTime() + paymentTermDays * DAY)),
  ).slice(0, 10);

  if (new Date(dueDate) < new Date(issueDate)) {
    throw new InvoiceError("The due date cannot be before the issue date.");
  }

  const discount = safe(input.discount);
  const invoice: Invoice = {
    id: id(),
    number: await nextNumber(issuerId, String(input.numberPrefix ?? "INV").slice(0, 8)),
    issuerId,
    orgId,
    issuer: {
      name: String((input.issuer as InvoiceParty)?.name ?? "").slice(0, 160),
      email: (input.issuer as InvoiceParty)?.email?.slice(0, 200),
      address: (input.issuer as InvoiceParty)?.address?.slice(0, 400),
      taxId: (input.issuer as InvoiceParty)?.taxId?.slice(0, 60),
    },
    client: {
      name: String(client.name).slice(0, 160),
      email: client.email?.slice(0, 200),
      address: client.address?.slice(0, 400),
      taxId: client.taxId?.slice(0, 60),
    },
    currency: String(input.currency ?? "USD").slice(0, 3).toUpperCase(),
    issueDate, dueDate, lines, discount,
    notes: input.notes ? String(input.notes).slice(0, 2000) : undefined,
    terms: input.terms ? String(input.terms).slice(0, 2000) : undefined,
    status: "draft",
    ...(input.projectId ? { projectId: String(input.projectId) } : {}),
    ...(Array.isArray(input.milestoneIds) ? { milestoneIds: input.milestoneIds.map(String) } : {}),
    totals: computeTotals(lines, discount, 0),
    paid: 0,
    createdAt: Date.now(),
  };

  if (persistenceEnabled()) {
    await ensureIndexes();
    const col = await collection<Invoice>("invoices");
    if (col) { await col.insertOne(invoice); return invoice; }
  }
  invoices.set(invoice.id, invoice);
  return invoice;
}

export async function getInvoice(invoiceId: string): Promise<Invoice | null> {
  if (persistenceEnabled()) {
    const col = await collection<Invoice>("invoices");
    if (col) return col.findOne({ id: invoiceId });
  }
  return invoices.get(invoiceId) ?? null;
}

export async function listInvoices(filter: {
  issuerId?: string; orgId?: string; status?: InvoiceStatus; take?: number;
} = {}): Promise<Invoice[]> {
  const take = Math.min(filter.take ?? 50, 200);

  if (persistenceEnabled()) {
    const col = await collection<Invoice>("invoices");
    if (col) {
      const q: Record<string, unknown> = {};
      if (filter.issuerId) q.issuerId = filter.issuerId;
      if (filter.orgId) q.orgId = filter.orgId;
      if (filter.status) q.status = filter.status;
      return col.find(q).sort({ createdAt: -1 }).limit(take).toArray();
    }
  }
  return [...invoices.values()]
    .filter((i) => (!filter.issuerId || i.issuerId === filter.issuerId)
      && (!filter.orgId || i.orgId === filter.orgId)
      && (!filter.status || i.status === filter.status))
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, take);
}

/** Legal transitions. An invoice is a financial record, so the state
 *  machine is explicit rather than "set whatever status you like". */
const ALLOWED: Record<InvoiceStatus, InvoiceStatus[]> = {
  draft: ["sent", "void"],
  sent:  ["paid", "void"],
  paid:  [],          // terminal — correct a mistake with a credit note, not an edit
  void:  [],
};

export async function transitionInvoice(
  invoiceId: string,
  issuerId: string,
  to: InvoiceStatus,
  opts: { amountPaid?: number; paymentReference?: string } = {},
): Promise<Invoice> {
  const inv = await getInvoice(invoiceId);
  if (!inv) throw new InvoiceError("No such invoice.");
  if (inv.issuerId !== issuerId) throw new InvoiceError("Only the issuer can change this invoice.");
  if (!ALLOWED[inv.status].includes(to)) {
    throw new InvoiceError(`An invoice that is ${inv.status} cannot be marked ${to}.`);
  }

  const now = Date.now();
  const paid = to === "paid"
    ? (opts.amountPaid !== undefined ? round2(safe(opts.amountPaid)) : inv.totals.total)
    : inv.paid;

  const patch: Partial<Invoice> = {
    status: to,
    paid,
    totals: computeTotals(inv.lines, inv.discount, paid),
    ...(to === "sent" ? { sentAt: now } : {}),
    ...(to === "paid" ? { paidAt: now, ...(opts.paymentReference ? { paymentReference: opts.paymentReference } : {}) } : {}),
    ...(to === "void" ? { voidedAt: now } : {}),
  };

  if (persistenceEnabled()) {
    const col = await collection<Invoice>("invoices");
    if (col) {
      /* Status guard in the filter — two concurrent transitions cannot
         both succeed, same pattern as the escrow milestone writes. */
      const after = await col.findOneAndUpdate(
        { id: invoiceId, status: inv.status },
        { $set: patch },
        { returnDocument: "after" },
      );
      if (!after) throw new InvoiceError("This invoice was just changed by another request.");
      return after;
    }
  }

  const local = invoices.get(invoiceId);
  if (!local || local.status !== inv.status) throw new InvoiceError("This invoice was just changed by another request.");
  Object.assign(local, patch);
  return local;
}

/**
 * Raises a draft invoice from APPROVED milestones.
 *
 * The whole reason invoicing lives in this codebase rather than in an
 * accounting package: the invoice is generated from the same milestone
 * records escrow released against, so there is no re-keying step where
 * the invoiced amount can silently drift from the approved amount.
 * Deliberately refuses unapproved milestones — invoicing for work the
 * client has not signed off is how disputes start.
 */
export async function invoiceFromMilestones(
  issuerId: string,
  orgId: string | null,
  projectId: string,
  milestoneIds: string[],
  client: InvoiceParty,
  extra: Record<string, unknown> = {},
): Promise<Invoice> {
  const { listMilestones } = await import("./milestones");
  const all = await listMilestones(projectId);
  const wanted = new Set(milestoneIds);
  const chosen = all.filter((m) => wanted.has(m.id));

  if (chosen.length === 0) throw new InvoiceError("No matching milestones on this project.");

  const unapproved = chosen.filter((m) => m.status !== "approved");
  if (unapproved.length > 0) {
    throw new InvoiceError(
      `${unapproved.length} of the selected milestones ${unapproved.length === 1 ? "is" : "are"} not approved yet. Invoice only for work that has been signed off.`,
    );
  }

  return createInvoice(issuerId, orgId, {
    ...extra,
    client,
    projectId,
    milestoneIds: chosen.map((m) => m.id),
    currency: chosen[0].currency,
    lines: chosen.map((m) => ({
      id: `il_${m.id}`,
      description: m.title,
      quantity: 1,
      unit: "milestone",
      unitPrice: m.amount,
      taxPct: safe(extra.taxPct),
      milestoneId: m.id,
    })),
  });
}

export interface BulkInvoiceResult {
  invoices: Invoice[];
  skipped: { projectId: string; reason: string }[];
}

/**
 * Raises every outstanding invoice a user is owed, in one call — the
 * "auto-pull all my financial activity" entry point. Every real
 * project run through `listProjects({ awardedExpertId })`, every
 * approved milestone on it not already invoiced, one invoice per
 * project (an invoice has one client; mixing projects would mix
 * clients on it).
 *
 * Deliberately a thin orchestrator around `invoiceFromMilestones`
 * rather than a parallel code path: reusing it means a bulk-generated
 * invoice gets the exact same guarantees a manual one does (approved-
 * only enforcement, milestone-id provenance) with nothing to drift out
 * of sync between the two.
 *
 * NEVER "escrow" language here — see the ⚠️ note at the top of
 * milestones.ts. Nothing is held; approval already released the
 * payout balance before this ever runs. This function only decides
 * what to bill for work already signed off.
 */
export async function generateOutstandingInvoices(
  issuerId: string,
  orgId: string | null,
  opts: { taxPct?: number; paymentTermDays?: number } = {},
): Promise<BulkInvoiceResult> {
  const { listProjects } = await import("./marketplace");
  const { listMilestones } = await import("./milestones");
  const { findUserById } = await import("./users");
  const { record } = await import("./audit");

  const projects = await listProjects({ awardedExpertId: issuerId, take: 500 });
  if (projects.length === 0) return { invoices: [], skipped: [] };

  /* Built ONCE, before the per-project loop: every milestone id already
     claimed by a live invoice (draft/sent/paid) is off-limits. A
     `void`ed invoice's ids are simply absent from this set, so that
     work becomes billable again on the very next run — no separate
     "was this voided" query needed. */
  const existingInvoices = await listInvoices({ issuerId, take: 500 });
  const alreadyInvoiced = new Set(
    existingInvoices
      .filter((inv) => inv.status !== "void")
      .flatMap((inv) => inv.milestoneIds ?? []),
  );

  const me = await findUserById(issuerId);
  const issuerParty: InvoiceParty = { name: me?.name ?? me?.email ?? "", email: me?.email };

  const results = await Promise.all(projects.map(async (project): Promise<
    { invoice: Invoice } | { skipped: { projectId: string; reason: string } }
  > => {
    const milestones = await listMilestones(project.id);
    const eligible = milestones.filter((m) => m.status === "approved" && !alreadyInvoiced.has(m.id));

    if (eligible.length === 0) {
      return { skipped: { projectId: project.id, reason: "No approved milestones awaiting invoicing." } };
    }

    const client = await findUserById(project.clientId);
    if (!client) {
      return { skipped: { projectId: project.id, reason: "Client record could not be resolved." } };
    }

    try {
      const invoice = await invoiceFromMilestones(
        issuerId, orgId, project.id,
        eligible.map((m) => m.id),
        { name: client.name || client.email, email: client.email },
        { paymentTermDays: opts.paymentTermDays, taxPct: opts.taxPct, issuer: issuerParty },
      );

      /* One audit row per invoice — matches how milestones.ts logs one
         row per milestone action, and keeps each row traceable to a
         single invoice id rather than one row summarising a whole
         batch. First call site of `record()` in this file; existing
         single-invoice actions (createInvoice, invoiceFromMilestones
         called directly, transitionInvoice) are NOT retrofitted here —
         that is a separate, broader gap worth closing on its own. */
      await record({
        orgId,
        actorId: issuerId,
        actorRole: "expert",
        action: "invoice_generated_bulk",
        target: invoice.id,
        detail: `${invoice.currency} ${invoice.totals.total} — ${eligible.length} milestone${eligible.length === 1 ? "" : "s"}, project ${project.id}`,
      });

      return { invoice };
    } catch (e) {
      /* A milestone's status can change between the filter above and
         `invoiceFromMilestones`'s own fresh re-check (it re-reads
         milestones rather than trusting this function's snapshot) —
         race, not a bug. One project's race must not abort the batch. */
      const reason = e instanceof InvoiceError ? e.message : "Could not raise this invoice.";
      return { skipped: { projectId: project.id, reason } };
    }
  }));

  const invoices: Invoice[] = [];
  const skipped: { projectId: string; reason: string }[] = [];
  for (const r of results) {
    if ("invoice" in r) invoices.push(r.invoice);
    else skipped.push(r.skipped);
  }

  return { invoices, skipped };
}
