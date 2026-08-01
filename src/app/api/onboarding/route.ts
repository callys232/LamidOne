import { handler, ok, fail, badRequest, tooLarge, rateLimited, bodyTooLarge, clean } from "@/lib/http";
import { limit, clientId } from "@/lib/ratelimit";
import { resolveIdentity } from "@/lib/entitlements";
import { chatCompletion, systemPrompt } from "@/lib/ai";
import { roleFor } from "@/content/dashboard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY = 16 * 1024;
const MAX_TURNS = 8;
const MAX_CHARS = 1200;
const SIGNUP_ROLES = new Set(["client", "expert", "enterprise"]);

/**
 * THE ONBOARDING AGENT — one endpoint, every user level, AND the
 * signup flow.
 *
 * Two modes:
 *
 *  · Default — a signed-in user on a real dashboard form. Role comes
 *    ONLY from `resolveIdentity`; a body field can never claim it. This
 *    is an entitlement-adjacent context (the reply can describe what a
 *    higher tier or a different role would see), so trusting a client
 *    claim here would be the exact privilege-claim bug JWTs are meant
 *    to prevent.
 *
 *  · `mode: "signup"` — an ANONYMOUS visitor choosing which account to
 *    create. There is no account yet and no privileged action follows
 *    from this reply — `signupRole` is a UI hint ("which persona brief
 *    and field set applies"), not an entitlement claim, and the actual
 *    account role is independently validated by POST /api/auth/signup
 *    regardless of anything said here. `extract: true` additionally
 *    asks the model to return a structured FIELDS line alongside its
 *    reply, which this route parses out and returns separately — the
 *    mechanism that lets the signup PAGE live-fill its visible,
 *    editable form fields from the conversation rather than requiring
 *    the visitor to type into two places.
 *
 * Free and unmetered in both modes — an agent that costs points to ask
 * "what goes in this field" would train people to avoid asking.
 */
export const POST = handler(async (req) => {
  if (bodyTooLarge(req, MAX_BODY)) return tooLarge();

  const identity = await resolveIdentity(req);
  const id = identity.userId ?? clientId(req);

  const rl = await limit("ai", id);
  if (!rl.ok) return rateLimited(rl.retryAfter);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest("Body must be JSON.");
  }

  const { messages, form, mode, signupRole, extract } = body as {
    messages?: unknown; form?: unknown; mode?: unknown; signupRole?: unknown; extract?: unknown;
  };
  if (!Array.isArray(messages) || messages.length === 0) {
    return badRequest("`messages` must be a non-empty array.");
  }

  const isSignup = mode === "signup" && !identity.userId;
  const role = isSignup
    ? (SIGNUP_ROLES.has(String(signupRole)) ? (signupRole as string) : "client")
    : identity.userId
      ? (identity.role ?? roleFor(identity))
      : "client";

  const turns = messages.slice(-MAX_TURNS).map((m) => {
    const msg = m as { role?: unknown; content?: unknown };
    return {
      role: msg.role === "assistant" ? ("assistant" as const) : ("user" as const),
      content: clean(msg.content, MAX_CHARS),
    };
  }).filter((m) => m.content.length > 0);

  if (turns.length === 0) return badRequest("No usable message content.");

  const formHint = typeof form === "string" ? clean(form, 80) : null;
  const wantsExtraction = isSignup && extract === true;

  const extractionInstruction = wantsExtraction
    ? `\nYou are helping fill a signup form with these fields: name, email, password, organisation (only if the account is for an organisation). After a short, warm reply, on a NEW final line output exactly: FIELDS: {"name":"...","email":"...","organisation":"..."} — include ONLY the keys you are confident about from what the user just said, omit any you are not sure of, and NEVER include "password" in that JSON (passwords are never extracted from chat). If you have nothing confident to extract, output FIELDS: {}.`
    : "";

  const payload = [
    { role: "system" as const, content: systemPrompt("onboarding", role) + extractionInstruction },
    ...(formHint ? [{ role: "system" as const, content: `The user is currently on: ${formHint}` }] : []),
    ...turns,
  ];

  const res = await chatCompletion({ messages: payload, maxTokens: 280 });
  if (!res.ok) {
    console.error("[onboarding] upstream", res.status, await res.text().catch(() => ""));
    return fail(502, "upstream", "The onboarding assistant is unavailable right now.");
  }

  const json = await res.json();
  const raw: string = json.choices?.[0]?.message?.content ?? "";

  if (!wantsExtraction) {
    return ok({ reply: raw, role, authenticated: Boolean(identity.userId) });
  }

  return ok({ ...splitExtraction(raw), role, authenticated: false });
});

/**
 * Splits the model's `FIELDS: {...}` line from its conversational
 * reply. Deliberately fails closed: a malformed or missing FIELDS line
 * yields an empty extraction rather than a guess, so the form is never
 * silently populated with something the model half-produced.
 */
function splitExtraction(raw: string): { reply: string; fields: Record<string, string> } {
  const match = /FIELDS:\s*(\{[^\n]*\})\s*$/.exec(raw.trim());
  if (!match) return { reply: raw.trim(), fields: {} };

  const reply = raw.slice(0, match.index).trim();
  try {
    const parsed = JSON.parse(match[1]);
    const fields: Record<string, string> = {};
    for (const key of ["name", "email", "organisation"]) {
      if (typeof parsed[key] === "string" && parsed[key].trim()) fields[key] = clean(parsed[key], 160);
    }
    return { reply, fields };
  } catch {
    return { reply, fields: {} };
  }
}
