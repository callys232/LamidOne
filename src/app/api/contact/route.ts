import { requirePersistenceInProd } from "@/lib/store";
import { handler, ok, badRequest, tooLarge, rateLimited, bodyTooLarge, clean } from "@/lib/http";
import { limit, clientId } from "@/lib/ratelimit";
import { recordInquiry } from "@/lib/contactInquiries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Public enquiry intake.
 *
 * Rate limited hard (5 per 5 minutes) because a public unauthenticated
 * POST is the most reliably abused surface on any marketing site. A
 * honeypot field catches the naive bots that ignore rate limits.
 */
export const POST = handler(async (req) => {
  requirePersistenceInProd();
  if (bodyTooLarge(req, 16 * 1024)) return tooLarge();

  const rl = await limit("form", clientId(req));
  if (!rl.ok) return rateLimited(rl.retryAfter);

  const body = await req.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return badRequest("Body must be JSON.");

  /* Honeypot — a real person never fills a hidden field. Respond 200 so
     the bot believes it succeeded and does not retry with variations. */
  if (clean(body.company_website, 200)) return ok({ received: true });

  const name = clean(body.name, 120);
  const email = clean(body.email, 200);
  const message = clean(body.message, 4000);
  const topic = clean(body.topic, 60) || "general";

  if (!name || !email || !message) {
    return badRequest("Name, email and message are required.");
  }
  if (!/^[^@\s]+@[^@\s.]+\.[^@\s]+$/.test(email)) {
    return badRequest("That email address does not look right.");
  }

  /* Persisted so a reply depends on an operator checking a real,
     durable record — not on a log line surviving until someone reads
     it. No transactional-email send yet (no mailer is configured in
     this deploy), so the reply itself is still a human checking this
     queue and emailing back manually, not an automated notification. */
  await recordInquiry({ name, email, topic, message });

  return ok({
    received: true,
    message: "Thanks — we will reply within two business days.",
  });
});
