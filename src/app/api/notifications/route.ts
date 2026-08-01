import { handler, ok, fail, rateLimited } from "@/lib/http";
import { limit } from "@/lib/ratelimit";
import { resolveIdentity } from "@/lib/entitlements";
import { listNotifications, getPrefs, setPrefs } from "@/lib/notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = handler(async (req) => {
  const identity = await resolveIdentity(req);
  if (!identity.userId) return fail(401, "unauthorised", "Sign in to view notifications.");

  const rl = await limit("read", identity.userId);
  if (!rl.ok) return rateLimited(rl.retryAfter);

  const [items, prefs] = await Promise.all([listNotifications(identity.userId), getPrefs(identity.userId)]);
  return ok({ notifications: items, prefs });
});

/** Update preferences. `{ email?, inApp?, digest? }`. */
export const POST = handler(async (req) => {
  const identity = await resolveIdentity(req);
  if (!identity.userId) return fail(401, "unauthorised", "Sign in to update preferences.");

  const rl = await limit("read", identity.userId);
  if (!rl.ok) return rateLimited(rl.retryAfter);

  const body = await req.json().catch(() => ({})) as Record<string, unknown>;
  const patch: Record<string, unknown> = {};
  if (typeof body.email === "boolean") patch.email = body.email;
  if (typeof body.inApp === "boolean") patch.inApp = body.inApp;
  if (body.digest === "off" || body.digest === "daily" || body.digest === "weekly") patch.digest = body.digest;

  return ok({ prefs: await setPrefs(identity.userId, patch) });
});
