import { collection, persistenceEnabled, ensureIndexes } from "./store";

/**
 * EVENTS — SIGNAL's "Event management" feature, which had no backing
 * data anywhere until now. Also what the support-ticket agent checks
 * a ticket against when it looks event-related, rather than guessing.
 */

export const EVENT_CATEGORIES = ["Workshop", "Seminar", "Networking", "Conference", "Training", "Webinar"] as const;
export type EventCategory = (typeof EVENT_CATEGORIES)[number];

export type LamidEvent = {
  id: string;
  hostId: string;
  orgId: string | null;
  title: string;
  description: string;
  category: EventCategory;
  startAt: number;
  endAt: number;
  location: string;
  /** null = unlimited. */
  capacity: number | null;
  attendeeIds: string[];
  createdAt: number;
};

const events = new Map<string, LamidEvent>();
const id = () => `evt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

export class EventError extends Error {
  constructor(msg: string) { super(msg); this.name = "EventError"; }
}

export async function createEvent(
  hostId: string,
  orgId: string | null,
  input: Record<string, unknown>,
): Promise<LamidEvent> {
  const title = String(input.title ?? "").trim().slice(0, 160);
  const description = String(input.description ?? "").trim().slice(0, 2000);
  const category = EVENT_CATEGORIES.includes(input.category as EventCategory) ? (input.category as EventCategory) : null;
  const startAt = Number(input.startAt);
  const endAt = Number(input.endAt);
  const location = String(input.location ?? "Online").trim().slice(0, 160);
  const capacity = input.capacity ? Math.max(1, Number(input.capacity)) : null;

  if (title.length < 5) throw new EventError("Give the event a title of at least 5 characters.");
  if (!category) throw new EventError(`\`category\` must be one of: ${EVENT_CATEGORIES.join(", ")}.`);
  if (!Number.isFinite(startAt) || !Number.isFinite(endAt) || endAt <= startAt) {
    throw new EventError("`startAt` and `endAt` must be valid timestamps, with the event ending after it starts.");
  }

  const event: LamidEvent = {
    id: id(), hostId, orgId, title, description, category, startAt, endAt, location, capacity,
    attendeeIds: [], createdAt: Date.now(),
  };

  if (persistenceEnabled()) {
    await ensureIndexes();
    const col = await collection<LamidEvent>("events");
    if (col) { await col.insertOne(event); return event; }
  }
  events.set(event.id, event);
  return event;
}

export async function listEvents(filter: {
  category?: EventCategory; upcomingOnly?: boolean; hostId?: string; take?: number;
} = {}): Promise<LamidEvent[]> {
  const take = Math.min(filter.take ?? 25, 100);

  if (persistenceEnabled()) {
    const col = await collection<LamidEvent>("events");
    if (col) {
      const q: Record<string, unknown> = {};
      if (filter.category) q.category = filter.category;
      if (filter.hostId) q.hostId = filter.hostId;
      if (filter.upcomingOnly) q.startAt = { $gte: Date.now() };
      return col.find(q).sort({ startAt: 1 }).limit(take).toArray();
    }
  }
  return [...events.values()]
    .filter((e) => (!filter.category || e.category === filter.category)
      && (!filter.hostId || e.hostId === filter.hostId)
      && (!filter.upcomingOnly || e.startAt >= Date.now()))
    .sort((a, b) => a.startAt - b.startAt)
    .slice(0, take);
}

export async function getEvent(eventId: string): Promise<LamidEvent | null> {
  if (persistenceEnabled()) {
    const col = await collection<LamidEvent>("events");
    if (col) return col.findOne({ id: eventId });
  }
  return events.get(eventId) ?? null;
}

export async function registerForEvent(eventId: string, userId: string): Promise<LamidEvent> {
  const event = await getEvent(eventId);
  if (!event) throw new EventError("No such event.");
  if (event.attendeeIds.includes(userId)) throw new EventError("You are already registered for this event.");
  if (event.capacity !== null && event.attendeeIds.length >= event.capacity) {
    throw new EventError("This event is at capacity.");
  }

  if (persistenceEnabled()) {
    const col = await collection<LamidEvent>("events");
    if (col) {
      const updated = await col.findOneAndUpdate(
        { id: eventId, $expr: event.capacity !== null ? { $lt: [{ $size: "$attendeeIds" }, event.capacity] } : { $literal: true } },
        { $addToSet: { attendeeIds: userId } },
        { returnDocument: "after" },
      );
      if (!updated) throw new EventError("This event filled up before your registration went through.");
      return updated;
    }
  }
  event.attendeeIds.push(userId);
  return event;
}
