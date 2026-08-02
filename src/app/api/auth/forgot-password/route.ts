import { handler, ok, badRequest, tooLarge, rateLimited, bodyTooLarge } from "@/lib/http";
import { limit, clientId } from "@/lib/ratelimit";
import { findUserByEmail, validateEmail } from "@/lib/users";
import { createResetToken } from "@/lib/passwordReset";
import { sendEmail, mailerConfigured } from "@/lib/mailer";
import { env } from "@/lib/env";
import { requirePersistenceInProd } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GENERIC_MESSAGE = "If an account exists for that email, a reset link is on its way.";

/**
 * Always returns the same generic message regardless of whether the
 * email matched an account — a distinct "no such user" response here
 * is exactly the account-enumeration hole `authenticate()` already
 * avoids on login (see users.ts). What differs internally: mailer
 * configuration state is never leaked to the caller either, for the
 * same reason — an anonymous POST finding out whether email sending
 * is configured is itself a disclosure.
 */
export const POST = handler(async (req) => {
  requirePersistenceInProd();
  if (bodyTooLarge(req, 1024)) return tooLarge();

  const rl = await limit("form", clientId(req));
  if (!rl.ok) return rateLimited(rl.retryAfter);

  const body = await req.json().catch(() => null) as { email?: string } | null;
  if (!body?.email) return badRequest("`email` is required.");

  let email: string;
  try {
    email = validateEmail(body.email);
  } catch {
    return ok({ message: GENERIC_MESSAGE });
  }

  const user = await findUserByEmail(email);
  if (user && mailerConfigured()) {
    const token = await createResetToken(user.id);
    const link = `${env.siteUrl}/reset-password?token=${token}`;
    try {
      await sendEmail({
        to: user.email,
        subject: "Reset your LAMID ONE password",
        html: `<p>Someone requested a password reset for this account.</p><p><a href="${link}">Reset your password</a> — this link expires in 1 hour and works once.</p><p>If this wasn't you, no action is needed.</p>`,
      });
    } catch (e) {
      console.error("[forgot-password] send failed:", e);
    }
  } else if (user) {
    console.warn("[forgot-password] RESEND_API_KEY not configured — no email sent for", user.id);
  }

  return ok({ message: GENERIC_MESSAGE });
});
