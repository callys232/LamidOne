import { ok } from "@/lib/http";
import { env } from "@/lib/env";
import { SUITES } from "@/content/suites";
import { AGENTS } from "@/content/agents";
import { TIERS } from "@/content/tiers";
import { REGISTERED_CODES } from "@/lib/engines";
import { mockEnabled } from "@/lib/mockUsers";
import { mailerConfigured } from "@/lib/mailer";
import { turnstileConfigured } from "@/lib/turnstile";
import { stripeConfigured } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Liveness plus a configuration read-out.
 *
 * Reports which dependencies are wired without ever echoing a secret —
 * booleans only. The most common production failure here is a missing
 * key that silently degrades one route, so this makes it visible.
 */
export async function GET() {
  const configured = {
    /* Engines are compiled in, not fetched — they need no key and
       cannot be misconfigured. Reported so the count is visible. */
    engines: REGISTERED_CODES.length,
    model: Boolean(env.openrouterKey || env.openaiKey),
    rateLimitStore: Boolean(env.redisUrl && env.redisToken),
    database: Boolean(env.mongoUri),
    paystackWebhook: Boolean(process.env.PAYSTACK_SECRET_KEY),
    cronSecret: Boolean(process.env.LAMID_CRON_SECRET),
    mockAuth: mockEnabled(),
    mailer: mailerConfigured(),
    errorMonitoring: Boolean(process.env.SENTRY_DSN),
    botProtection: turnstileConfigured(),
    stripeWebhook: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
  };

  const warnings: string[] = [];
  if (!configured.model) warnings.push("No model key — the assistant and language agents will return 503. Engines are unaffected.");
  if (!configured.rateLimitStore && env.isProd) warnings.push("Rate limiting is in-memory in production; limits are per-instance. Set UPSTASH_REDIS_REST_URL.");
  if (!configured.database) {
    warnings.push(
      env.isProd
        ? "No database in PRODUCTION — checkout, points, escrow and marketplace routes are refusing requests (503) rather than running on in-memory storage that would reset and diverge across instances."
        : "No database — points and bundles are in-memory and reset on restart.",
    );
  }
  if (!configured.paystackWebhook) warnings.push("PAYSTACK_SECRET_KEY unset — /api/webhooks/paystack cannot verify signatures and rejects everything with 503.");
  if (!configured.cronSecret) warnings.push("LAMID_CRON_SECRET unset — /api/cron/auto-release and /api/cron/sweep-holds are unreachable; both still self-correct opportunistically on normal reads, just not on a schedule.");
  if (configured.mockAuth && env.isProd) warnings.push("MOCK AUTH IS ENABLED IN PRODUCTION. Unset LAMID_ALLOW_MOCK_AUTH.");
  if (!configured.mailer) warnings.push("RESEND_API_KEY unset — password reset, invitations and every other notification email silently do not send; the actions themselves still succeed.");
  if (!configured.errorMonitoring && env.isProd) warnings.push("SENTRY_DSN unset in production — unhandled errors only reach the server console, not an alertable dashboard.");

  return ok({
    status: warnings.length === 0 ? "ok" : "degraded",
    catalogue: {
      suites: SUITES.length,
      agents: AGENTS.length,
      tiers: TIERS.length,
      engines: REGISTERED_CODES.length,
    },
    configured,
    warnings,
    time: new Date().toISOString(),
  });
}
