import { handler, ok, badRequest, tooLarge, rateLimited, bodyTooLarge, clean } from "@/lib/http";
import { limit, clientId } from "@/lib/ratelimit";

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

  /* ⚠️  SEAM — wire to ProdLamid's `lib/mailer.ts` and
     `lib/services/transactionalEmailService.ts`, and persist against
     SupportTicket so nothing depends on an inbox being watched. */
  console.info("[contact]", { topic, name, email, length: message.length });

  return ok({
    received: true,
    message: "Thanks — we will reply within two business days.",
  });
});
