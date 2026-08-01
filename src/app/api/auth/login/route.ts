import { handler, ok, badRequest, tooLarge, rateLimited, bodyTooLarge } from "@/lib/http";
import { limit, clientId } from "@/lib/ratelimit";
import { authenticate, publicUser, SignupError } from "@/lib/users";
import { signAccessToken } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = handler(async (req) => {
  if (bodyTooLarge(req, 2 * 1024)) return tooLarge();

  const rl = await limit("form", clientId(req));
  if (!rl.ok) return rateLimited(rl.retryAfter);

  const body = await req.json().catch(() => null) as { email?: string; password?: string } | null;
  if (!body?.email || !body?.password) return badRequest("`email` and `password` are required.");

  try {
    const user = await authenticate(body.email, body.password);
    const token = signAccessToken({ sub: user.id, email: user.email, role: "user", ...(user.orgId ? { orgId: user.orgId } : {}) });

    const res = ok({ user: publicUser(user) });
    res.cookies.set("accessToken", token, {
      httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/",
      maxAge: Math.max(1, Number(process.env.LAMID_SESSION_DAYS ?? 7)) * 24 * 60 * 60,
    });
    return res;
  } catch (e) {
    if (e instanceof SignupError) {
      /* 401, not 400 — wrong credentials is an auth failure, not a
         malformed request. Same message either way (see authenticate). */
      const { fail } = await import("@/lib/http");
      return fail(401, "invalid_credentials", e.message);
    }
    throw e;
  }
});
