import { collection, persistenceEnabled, ensureIndexes } from "./store";

/**
 * SUPPORT TICKETS.
 *
 * The response target shown against each ticket is `responseTargetFor`
 * from content/tiers.ts, re-exported here for convenience server-side.
 * It deliberately does NOT live in this file — see the comment on it —
 * because this file imports lib/store.ts (and therefore the `mongodb`
 * driver), which must never reach a "use client" bundle.
 */
export { responseTargetFor } from "@/content/tiers";

export type Ticket = {
  id: string;
  userId: string;
  subject: string;
  body: string;
  status: "open" | "in_progress" | "resolved";
  createdAt: number;
  updatedAt: number;
};

const tickets = new Map<string, Ticket>();
const id = () => `tkt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

export class TicketError extends Error {
  constructor(msg: string) { super(msg); this.name = "TicketError"; }
}

export async function createTicket(userId: string, subject: string, body: string): Promise<Ticket> {
  const s = subject.trim().slice(0, 160);
  const b = body.trim().slice(0, 4000);
  if (s.length < 5) throw new TicketError("Give the ticket a subject of at least 5 characters.");
  if (b.length < 20) throw new TicketError("Describe the issue in at least 20 characters.");

  const ticket: Ticket = { id: id(), userId, subject: s, body: b, status: "open", createdAt: Date.now(), updatedAt: Date.now() };

  if (persistenceEnabled()) {
    await ensureIndexes();
    const col = await collection<Ticket>("supportTickets");
    if (col) { await col.insertOne(ticket); return ticket; }
  }
  tickets.set(ticket.id, ticket);
  return ticket;
}

export async function listTickets(userId: string, take = 25): Promise<Ticket[]> {
  if (persistenceEnabled()) {
    const col = await collection<Ticket>("supportTickets");
    if (col) return col.find({ userId }).sort({ createdAt: -1 }).limit(take).toArray();
  }
  return [...tickets.values()].filter((t) => t.userId === userId).sort((a, b) => b.createdAt - a.createdAt).slice(0, take);
}
