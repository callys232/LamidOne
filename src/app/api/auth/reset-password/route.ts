import { handler, ok, fail, badRequest, tooLarge, rateLimited, bodyTooLarge } from "@/lib/http";
import { limit, clientId } from "@/lib/ratelimit";
import { consumeResetToken } from "@/lib/passwordReset";
import { setPassword, validatePassword, SignupError } from "@/lib/users";
import { requirePersistenceInProd } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = handler(async (req) => {
  requirePersistenceInProd();
  if (bodyTooLarge(req, 1024)) return tooLarge();

  const rl = await limit("form", clientId(req));
  if (!rl.ok) return rateLimited(rl.retryAfter);

  const body = await req.json().catch(() => null) as { token?: string; password?: string } | null;
  if (!body?.token || !body?.password) return badRequest("`token` and `password` are required.");

  try {
    validatePassword(body.password);
  } catch (e) {
    if (e instanceof SignupError) return badRequest(e.message);
    throw e;
  }

  const userId = await consumeResetToken(body.token);
  if (!userId) return fail(400, "invalid_token", "This reset link is invalid, expired, or already used. Request a new one.");

  const user = await setPassword(userId, body.password);
  if (!user) return fail(404, "not_found", "No account found for this reset link.");

  return ok({ reset: true });
});
