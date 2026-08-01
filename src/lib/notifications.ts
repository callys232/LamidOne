import { collection, persistenceEnabled, ensureIndexes } from "./store";
import { dispatchEvent } from "./integrations";

/** NOTIFICATIONS — recent alerts and delivery preferences. */

export type Notification = {
  id: string;
  userId: string;
  title: string;
  body: string;
  read: boolean;
  at: number;
};

export type NotificationPrefs = {
  userId: string;
  email: boolean;
  inApp: boolean;
  digest: "off" | "daily" | "weekly";
};

const store = new Map<string, Notification>();
const prefsStore = new Map<string, NotificationPrefs>();
const id = () => `ntf_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

const DEFAULT_PREFS = (userId: string): NotificationPrefs => ({ userId, email: true, inApp: true, digest: "daily" });

export async function listNotifications(userId: string, take = 30): Promise<Notification[]> {
  if (persistenceEnabled()) {
    const col = await collection<Notification>("notifications");
    if (col) return col.find({ userId }).sort({ at: -1 }).limit(take).toArray();
  }
  return [...store.values()].filter((n) => n.userId === userId).sort((a, b) => b.at - a.at).slice(0, take);
}

export async function notify(userId: string, title: string, body: string): Promise<void> {
  const n: Notification = { id: id(), userId, title: title.slice(0, 160), body: body.slice(0, 500), read: false, at: Date.now() };
  if (persistenceEnabled()) {
    await ensureIndexes();
    const col = await collection<Notification>("notifications");
    if (col) { await col.insertOne(n); }
  } else {
    store.set(n.id, n);
  }

  /* Every in-app notification also fires to any webhook the user has
     configured (Slack/Discord/generic) — one choke point rather than
     wiring dispatchEvent into every place that calls notify(). Best
     effort: dispatchEvent never throws, so a broken webhook cannot
     break whatever action triggered this notification. */
  await dispatchEvent(userId, title, n.body);
}

export async function markRead(userId: string, notificationId: string): Promise<void> {
  if (persistenceEnabled()) {
    const col = await collection<Notification>("notifications");
    if (col) { await col.updateOne({ id: notificationId, userId }, { $set: { read: true } }); return; }
  }
  const n = store.get(notificationId);
  if (n && n.userId === userId) n.read = true;
}

export async function getPrefs(userId: string): Promise<NotificationPrefs> {
  if (persistenceEnabled()) {
    const col = await collection<NotificationPrefs>("notificationPrefs");
    const doc = await col?.findOne({ userId });
    if (doc) return doc;
  }
  return prefsStore.get(userId) ?? DEFAULT_PREFS(userId);
}

export async function setPrefs(userId: string, patch: Partial<Omit<NotificationPrefs, "userId">>): Promise<NotificationPrefs> {
  const current = await getPrefs(userId);
  const next: NotificationPrefs = { ...current, ...patch, userId };

  if (persistenceEnabled()) {
    const col = await collection<NotificationPrefs>("notificationPrefs");
    if (col) { await col.updateOne({ userId }, { $set: next }, { upsert: true }); return next; }
  }
  prefsStore.set(userId, next);
  return next;
}
