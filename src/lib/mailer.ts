/**
 * TRANSACTIONAL EMAIL — Resend's HTTP API, no SDK dependency, same
 * shape as lib/paystack.ts: a plain `fetch` call, one env var, and a
 * ConfigError when it's unset rather than a silent no-op. Nothing in
 * this codebase could send an email before this existed — password
 * reset is the first real caller.
 */

export class MailerError extends Error {
  constructor(msg: string) { super(msg); this.name = "MailerError"; }
}

export const mailerConfigured = () => Boolean(process.env.RESEND_API_KEY);

export async function sendEmail(input: { to: string; subject: string; html: string }): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new MailerError("RESEND_API_KEY is not configured.");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.MAIL_FROM ?? "LAMID ONE <notifications@lamidone.com>",
      to: [input.to],
      subject: input.subject,
      html: input.html,
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new MailerError(body?.message ?? `Resend request failed (${res.status}).`);
  }
}
