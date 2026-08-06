/**
 * CLOUDFLARE TURNSTILE — bot protection on public forms.
 *
 * Unlike Paystack or the mailer, an unconfigured deployment must keep
 * working exactly as before this existed: bot-screening is opt-in
 * hardening, not a required capability, so `verifyTurnstile` returns
 * true (pass) when no secret key is set rather than failing closed.
 * Once TURNSTILE_SECRET_KEY is set, a request with no token or a
 * failed challenge is rejected.
 */

export const turnstileConfigured = () => Boolean(process.env.TURNSTILE_SECRET_KEY);

export async function verifyTurnstile(token: string | undefined | null, remoteIp?: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;

  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token, ...(remoteIp ? { remoteip: remoteIp } : {}) }),
    });
    const data = await res.json().catch(() => null) as { success?: boolean } | null;
    return Boolean(data?.success);
  } catch {
    /* Cloudflare unreachable — do not lock out every real signup
       because of a third-party outage; the form is still behind rate
       limiting either way. */
    return true;
  }
}
