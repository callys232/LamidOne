import { collection, persistenceEnabled, ensureIndexes } from "./store";

/**
 * OUTBOUND INTEGRATIONS.
 *
 * Deliberately webhook-based, not OAuth-based. An OAuth integration
 * (Slack app, Google Workspace app) needs a registered app with a
 * real client ID/secret this build does not have and cannot fabricate
 * — a "Connect Slack" button with no real app behind it would be
 * exactly the kind of thing this project's honest-state rule exists
 * to prevent. Incoming webhooks need only a URL the user already has
 * from their own Slack/Discord workspace, so this works today, for
 * real, without registering anything.
 *
 * The same generic webhook also makes this Zapier/Make/n8n-compatible
 * for free — those tools trigger off exactly this shape (an inbound
 * POST), so nothing LAMID-specific has to be built for them.
 */

export type IntegrationSettings = {
  userId: string;
  slackWebhookUrl?: string;
  discordWebhookUrl?: string;
  genericWebhookUrl?: string;
};

const store = new Map<string, IntegrationSettings>();

export async function getIntegrations(userId: string): Promise<IntegrationSettings> {
  if (persistenceEnabled()) {
    const col = await collection<IntegrationSettings>("integrations");
    const doc = await col?.findOne({ userId });
    if (doc) return doc;
  }
  return store.get(userId) ?? { userId };
}

const isHttpsUrl = (v: unknown): v is string => typeof v === "string" && /^https:\/\/\S+$/.test(v);

export async function setIntegrations(
  userId: string,
  patch: Partial<Omit<IntegrationSettings, "userId">>,
): Promise<IntegrationSettings> {
  for (const [key, val] of Object.entries(patch)) {
    if (val !== undefined && val !== "" && !isHttpsUrl(val)) {
      throw new Error(`\`${key}\` must be a valid https:// URL.`);
    }
  }
  const current = await getIntegrations(userId);
  const next: IntegrationSettings = { ...current, ...patch, userId };
  // Empty string clears a webhook rather than storing a blank one.
  for (const k of ["slackWebhookUrl", "discordWebhookUrl", "genericWebhookUrl"] as const) {
    if (next[k] === "") delete next[k];
  }

  if (persistenceEnabled()) {
    await ensureIndexes();
    const col = await collection<IntegrationSettings>("integrations");
    if (col) { await col.updateOne({ userId }, { $set: next }, { upsert: true }); return next; }
  }
  store.set(userId, next);
  return next;
}

/**
 * Fires an event to every webhook the user has configured. Best
 * effort — a failed or unconfigured webhook never blocks the action
 * that triggered it (see notify() in notifications.ts, the one place
 * this is called from), so a broken Slack URL cannot break the
 * platform action itself.
 */
export async function dispatchEvent(userId: string, title: string, body: string): Promise<void> {
  const settings = await getIntegrations(userId);
  const jobs: Promise<unknown>[] = [];

  if (settings.slackWebhookUrl) {
    jobs.push(postJson(settings.slackWebhookUrl, { text: `*${title}*\n${body}` }));
  }
  if (settings.discordWebhookUrl) {
    jobs.push(postJson(settings.discordWebhookUrl, { content: `**${title}**\n${body}` }));
  }
  if (settings.genericWebhookUrl) {
    jobs.push(postJson(settings.genericWebhookUrl, { title, body, at: Date.now() }));
  }
  if (jobs.length === 0) return;

  await Promise.allSettled(jobs);
}

async function postJson(url: string, payload: unknown): Promise<void> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeout);
  } catch (e) {
    console.error("[integrations] webhook delivery failed:", (e as Error).message);
  }
}
