import { handler, ok, fail, badRequest, rateLimited } from "@/lib/http";
import { limit, clientId } from "@/lib/ratelimit";
import { authenticate, publicUser, SignupError } from "@/lib/users";
import { signAccessToken } from "@/lib/auth";
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from "@/content/demoAccounts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * One-click demo sign-in — what the /demo-dev cards call.
 *
 * Only ever signs in as one of the fixed, public DEMO_ACCOUNTS — never
 * an arbitrary email. Deliberately does NOT touch MONGODB_URI at all:
 * `findUserByEmail` (lib/users.ts) resolves these 6 accounts from a
 * hardcoded, in-process map before ever checking persistence, so
 * signing in and browsing the dashboard shell works whether or not a
 * database is configured, or one is configured but unreachable. Data
 * that genuinely lives in Mongo (points, projects) still shows
 * honestly empty in that case — only the account's identity is
 * hardcoded, nothing about its data is faked.
 */
export const POST = handler(async (req) => {
  const rl = await limit("form", clientId(req));
  if (!rl.ok) return rateLimited(rl.retryAfter);

  const body = await req.json().catch(() => null) as { email?: string } | null;
  const account = DEMO_ACCOUNTS.find((a) => a.email === body?.email);
  if (!account) return badRequest("Unknown demo account.");

  let user;
  try {
    user = await authenticate(account.email, DEMO_PASSWORD);
  } catch (e) {
    if (e instanceof SignupError) return fail(500, "demo_login_failed", "Could not sign in to the demo account. Try again.");
    throw e;
  }

  /* Same operator bridge as the real login route — this account's
     stored role "operator" reaches the operator dashboard for real. */
  const token = signAccessToken({
    sub: user.id, email: user.email,
    role: user.role === "operator" ? "admin" : "user",
    ...(user.orgId ? { orgId: user.orgId } : {}),
  });

  const res = ok({ user: publicUser(user) });
  res.cookies.set("accessToken", token, {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/",
    maxAge: Math.max(1, Number(process.env.LAMID_SESSION_DAYS ?? 7)) * 24 * 60 * 60,
  });
  return res;
});
