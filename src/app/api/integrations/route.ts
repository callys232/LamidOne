import { requirePersistenceInProd } from "@/lib/store";
import { handler, ok, fail, badRequest, rateLimited } from "@/lib/http";
import { limit } from "@/lib/ratelimit";
import { resolveIdentity } from "@/lib/entitlements";
import { getIntegrations, setIntegrations } from "@/lib/integrations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Masks a webhook URL for display — the path segment usually carries
 *  a secret token, so the full value is never echoed back once saved. */
function mask(url?: string): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.host}/••••`;
  } catch {
    return "••••";
  }
}

export const GET = handler(async (req) => {
  const identity = await resolveIdentity(req);
  if (!identity.userId) return fail(401, "unauthorised", "Sign in to view integrations.");

  const rl = await limit("read", identity.userId);
  if (!rl.ok) return rateLimited(rl.retryAfter);

  const settings = await getIntegrations(identity.userId);
  return ok({
    slack: { connected: Boolean(settings.slackWebhookUrl), masked: mask(settings.slackWebhookUrl) },
    discord: { connected: Boolean(settings.discordWebhookUrl), masked: mask(settings.discordWebhookUrl) },
    generic: { connected: Boolean(settings.genericWebhookUrl), masked: mask(settings.genericWebhookUrl) },
  });
});

export const PATCH = handler(async (req) => {
  requirePersistenceInProd();
  const identity = await resolveIdentity(req);
  if (!identity.userId) return fail(401, "unauthorised", "Sign in to update integrations.");

  const rl = await limit("form", identity.userId);
  if (!rl.ok) return rateLimited(rl.retryAfter);

  const body = await req.json().catch(() => null) as {
    slackWebhookUrl?: string; discordWebhookUrl?: string; genericWebhookUrl?: string;
  } | null;
  if (!body) return badRequest("Body must be JSON.");

  try {
    await setIntegrations(identity.userId, body);
    return ok({ saved: true });
  } catch (e) {
    return badRequest((e as Error).message);
  }
});
