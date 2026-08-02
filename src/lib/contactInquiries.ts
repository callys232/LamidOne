import { collection, persistenceEnabled, ensureIndexes } from "./store";

/**
 * PUBLIC CONTACT INQUIRIES.
 *
 * Before this existed, POST /api/contact only did `console.info` — a
 * submitted enquiry vanished into server logs the moment the process
 * recycled, despite the response promising "we will reply within two
 * business days." Deliberately separate from lib/tickets.ts: that
 * system is scoped to an authenticated user's own `userId`, and a
 * contact-form visitor usually has no account at all.
 */

export type ContactInquiry = {
  id: string;
  name: string;
  email: string;
  topic: string;
  message: string;
  status: "new" | "responded";
  createdAt: number;
};

const inquiries = new Map<string, ContactInquiry>();
const id = () => `inq_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

export async function recordInquiry(input: {
  name: string; email: string; topic: string; message: string;
}): Promise<ContactInquiry> {
  const inquiry: ContactInquiry = { id: id(), ...input, status: "new", createdAt: Date.now() };

  if (persistenceEnabled()) {
    await ensureIndexes();
    const col = await collection<ContactInquiry>("contactInquiries");
    if (col) { await col.insertOne(inquiry); return inquiry; }
  }
  inquiries.set(inquiry.id, inquiry);
  return inquiry;
}
